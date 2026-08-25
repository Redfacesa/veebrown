import { NextResponse } from 'next/server';
import { pingOpenRouter } from '@/lib/openrouter';

export const runtime = 'nodejs';

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      ok: false,
      message: 'Set OPENROUTER_API_KEY in Vercel environment variables',
    });
  }

  try {
    const status = await pingOpenRouter(apiKey);
    return NextResponse.json({
      configured: true,
      ok: status.ok,
      imageModels: status.modelCount,
      defaultModel: status.defaultModel,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      ok: false,
      message: err instanceof Error ? err.message : 'OpenRouter check failed',
    }, { status: 502 });
  }
}
