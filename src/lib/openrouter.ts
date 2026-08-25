export type OpenRouterImageModel = {
  id: string;
  name: string;
  description?: string;
  modality: string;
  inputModalities: string[];
  outputModalities: string[];
  supportsImageInput: boolean;
  pricingImage?: string;
  reasoningRequired?: boolean;
};

export function parseOpenRouterImageModels(payload: { data?: Array<Record<string, unknown>> }): OpenRouterImageModel[] {
  return (payload.data ?? [])
    .map((row) => {
      const arch = (row.architecture ?? {}) as Record<string, unknown>;
      const inputModalities = Array.isArray(arch.input_modalities)
        ? (arch.input_modalities as string[])
        : [];
      const outputModalities = Array.isArray(arch.output_modalities)
        ? (arch.output_modalities as string[])
        : [];
      const pricing = (row.pricing ?? {}) as Record<string, string>;
      const reasoning = (row.reasoning ?? {}) as Record<string, unknown>;
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? row.id ?? ''),
        description: row.description ? String(row.description) : undefined,
        modality: String(arch.modality ?? ''),
        inputModalities,
        outputModalities,
        supportsImageInput: inputModalities.includes('image'),
        pricingImage: pricing.image,
        reasoningRequired: reasoning.mandatory === true,
      };
    })
    .filter((m) => m.id && m.outputModalities.includes('image'));
}

/** Prefer image-to-image models for virtual try-on. */
export function pickTryOnModel(models: OpenRouterImageModel[], preferred?: string): OpenRouterImageModel | null {
  if (preferred) {
    const hit = models.find((m) => m.id === preferred && m.supportsImageInput);
    if (hit) return hit;
  }
  const ranked = [
    'sourceful/riverflow-v2.5-fast',
    'sourceful/riverflow-v2.5-pro',
    'x-ai/grok-imagine-image-quality',
    'google/gemini-2.5-flash-image',
    'openai/gpt-image-1-mini',
  ];
  for (const id of ranked) {
    const hit = models.find((m) => m.id === id && m.supportsImageInput);
    if (hit) return hit;
  }
  return models.find((m) => m.supportsImageInput) ?? models[0] ?? null;
}

export type TryOnGenerationInput = {
  personImageDataUrl: string;
  garmentImageUrl: string;
  productName: string;
  model?: string;
};

export type TryOnGenerationResult = {
  imageDataUrl: string;
  model: string;
  text?: string;
};

type OpenRouterMessage = {
  role: string;
  content?: unknown;
  images?: Array<{ type?: string; image_url?: { url?: string }; imageUrl?: { url?: string } }>;
};

function modalitiesForModel(model: OpenRouterImageModel): string[] {
  if (model.outputModalities.includes('text')) return ['image', 'text'];
  return ['image'];
}

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:image/')) return url;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load garment photo (${res.status})`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buf.toString('base64')}`;
}

function extractImageUrl(message: OpenRouterMessage): string | null {
  const images = message.images;
  if (images?.length) {
    const first = images[0];
    return first.image_url?.url ?? first.imageUrl?.url ?? null;
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (!part || typeof part !== 'object') continue;
      const block = part as Record<string, unknown>;
      if (block.type === 'image_url') {
        const nested = block.image_url as { url?: string } | undefined;
        if (nested?.url) return nested.url;
      }
      if (block.type === 'image' && typeof block.image === 'string') {
        return block.image.startsWith('data:') ? block.image : `data:image/png;base64,${block.image}`;
      }
    }
  }

  if (typeof message.content === 'string' && message.content.startsWith('data:image/')) {
    return message.content;
  }

  return null;
}

export async function generateVirtualTryOn(
  apiKey: string,
  input: TryOnGenerationInput,
): Promise<TryOnGenerationResult> {
  const modelsRes = await fetch('https://openrouter.ai/api/v1/models?output_modalities=image', {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!modelsRes.ok) {
    throw new Error(`Could not load OpenRouter image models (${modelsRes.status})`);
  }
  const modelsJson = await modelsRes.json();
  const models = parseOpenRouterImageModels(modelsJson);
  const modelMeta = pickTryOnModel(models, input.model);
  if (!modelMeta) throw new Error('No OpenRouter image model available for try-on');

  const garmentDataUrl = await urlToDataUrl(input.garmentImageUrl);

  const prompt = [
    'Virtual fashion try-on for VV Brown Fragrances e-commerce.',
    'Image 1: the customer photo (keep face, body shape, pose, and background).',
    'Image 2: the exact garment product photo (color, fabric, cut).',
    `Task: realistically dress the person in "${input.productName}" using the garment from image 2.`,
    'Natural fit and fabric drape. Photorealistic. No text, watermarks, or extra logos.',
  ].join(' ');

  const body: Record<string, unknown> = {
    model: modelMeta.id,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: input.personImageDataUrl, detail: 'high' } },
          { type: 'image_url', image_url: { url: garmentDataUrl, detail: 'high' } },
        ],
      },
    ],
    modalities: modalitiesForModel(modelMeta),
    stream: false,
    image_config: {
      aspect_ratio: '3:4',
      scoring_prompt: 'Realistic garment fit, natural skin tones, clean edges, fashion e-commerce quality.',
    },
  };

  if (modelMeta.reasoningRequired || modelMeta.id.includes('riverflow')) {
    body.reasoning = { effort: 'medium' };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veebrown.vercel.app',
      'X-Title': 'VV Brown Fragrances Try-On',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof json?.error?.message === 'string'
      ? json.error.message
      : typeof json?.message === 'string'
        ? json.message
        : `OpenRouter request failed (${res.status})`;
    throw new Error(msg);
  }

  const message = json?.choices?.[0]?.message as OpenRouterMessage | undefined;
  const imageDataUrl = message ? extractImageUrl(message) : null;
  if (!imageDataUrl) {
    const hint = typeof message?.content === 'string' ? message.content.slice(0, 180) : '';
    throw new Error(hint ? `No image returned: ${hint}` : 'No image returned — try another photo or model');
  }

  return {
    imageDataUrl,
    model: modelMeta.id,
    text: typeof message?.content === 'string' ? message.content : undefined,
  };
}

export async function pingOpenRouter(apiKey: string): Promise<{ ok: boolean; modelCount: number; defaultModel: string | null }> {
  const res = await fetch('https://openrouter.ai/api/v1/models?output_modalities=image', {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, modelCount: 0, defaultModel: null };
  const json = await res.json();
  const models = parseOpenRouterImageModels(json).filter((m) => m.supportsImageInput);
  const picked = pickTryOnModel(models);
  return { ok: true, modelCount: models.length, defaultModel: picked?.id ?? null };
}
