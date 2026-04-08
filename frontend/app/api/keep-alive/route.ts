import { NextResponse } from 'next/server';

// Allow up to 60s for Render cold start
export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL || 'https://portfolio-backend-2qry.onrender.com';

export async function GET() {
  const start = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(60000), // 60s timeout for cold start
    });
    const elapsed = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      elapsed_ms: elapsed,
      backend: data,
      pinged_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const elapsed = Date.now() - start;
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      elapsed_ms: elapsed,
      pinged_at: new Date().toISOString(),
    }, { status: 503 });
  }
}
