import { NextResponse } from 'next/server';
import { generateVirtualTryOn } from '@/lib/openrouter';

export const runtime = 'nodejs';
export const maxDuration = 120;

type TryOnBody = {
  personImageDataUrl?: string;
  garmentImageUrl?: string;
  productName?: string;
  model?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Try-on is not configured. Set OPENROUTER_API_KEY on the server.' },
      { status: 503 },
    );
  }

  let body: TryOnBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const personImageDataUrl = body.personImageDataUrl?.trim();
  const garmentImageUrl = body.garmentImageUrl?.trim();
  const productName = body.productName?.trim() || 'Selected garment';

  if (!personImageDataUrl?.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Upload a photo of yourself first' }, { status: 400 });
  }
  if (!garmentImageUrl) {
    return NextResponse.json({ error: 'Select a clothing item from the catalog' }, { status: 400 });
  }

  try {
    const result = await generateVirtualTryOn(apiKey, {
      personImageDataUrl,
      garmentImageUrl,
      productName,
      model: body.model,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Try-on generation failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
