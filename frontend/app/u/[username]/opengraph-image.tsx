import { ImageResponse } from 'next/og'

// Next.js convention: this file auto-registers as the default OG image for
// /u/[username]. It is ONLY used when generateMetadata() does NOT set
// openGraph.images — i.e. when the user has not uploaded a custom one.

export const alt = 'Portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

// Tiny fetch wrapper — mirrors the logic in page.tsx's getPortfolio().
// We don't crash the OG renderer if the API fails; we fall back to the
// raw username. The crawler will still get a valid PNG.
async function resolveDisplayName(username: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/portfolio/${username}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return username
    const json = await res.json()
    const payload = json?.data
    return (
      payload?.user?.displayName ||
      payload?.portfolio?.seoTitle ||
      username
    )
  } catch {
    return username
  }
}

export default async function OpenGraphImage({
  params,
}: {
  params: { username: string }
}) {
  const displayName = await resolveDisplayName(params.username)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          color: 'white',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            marginTop: 32,
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}
        >
          @{params.username}
        </div>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 60,
            fontSize: 24,
            color: '#64748b',
            letterSpacing: '0.05em',
          }}
        >
          PORTFOLIO
        </div>
      </div>
    ),
    size
  )
}
