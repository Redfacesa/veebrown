import { NextResponse } from 'next/server';
import { parseOpenRouterImageModels, pickTryOnModel } from '@/lib/openrouter';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ models: [], defaultModel: null, configured: false });
  }

  const res = await fetch('https://openrouter.ai/api/v1/models?output_modalities=image&sort=pricing-low-to-high', {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Could not load models', models: [] }, { status: 502 });
  }

  const json = await res.json();
  const models = parseOpenRouterImageModels(json)
    .filter((m) => m.supportsImageInput)
    .slice(0, 24);

  return NextResponse.json({
    configured: true,
    defaultModel: pickTryOnModel(models),
    models,
  });
}
