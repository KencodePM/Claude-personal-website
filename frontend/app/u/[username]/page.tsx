import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPortfolio, PortfolioSection } from '@/types/portfolio'

// Server Component — uses server-side env (not NEXT_PUBLIC_*).
// BACKEND_URL is the same var that powers the Next.js rewrites proxy.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

type PortfolioApiResult =
  | { status: 'PUBLISHED'; data: PublicPortfolio }
  | { status: 'UNPUBLISHED'; user: { username: string; displayName: string } }
  | { status: 'NOT_FOUND' }

async function getPortfolio(username: string): Promise<PortfolioApiResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/portfolio/${username}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) return { status: 'NOT_FOUND' }
    if (!res.ok) return { status: 'NOT_FOUND' }

    const json = await res.json()
    const payload = json?.data

    if (payload?.status === 'UNPUBLISHED') {
      return { status: 'UNPUBLISHED', user: payload.user }
    }
    if (payload?.status === 'PUBLISHED') {
      return { status: 'PUBLISHED', data: payload }
    }
    return { status: 'NOT_FOUND' }
  } catch {
    return { status: 'NOT_FOUND' }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const result = await getPortfolio(username)

  if (result.status === 'NOT_FOUND') {
    return { title: 'Portfolio Not Found' }
  }
  if (result.status === 'UNPUBLISHED') {
    return { title: `${result.user.displayName} — Portfolio (未公開)` }
  }

  const data = result.data
  const title = data.portfolio.seoTitle || `${data.user.displayName}'s Portfolio`
  return {
    title,
    description: data.portfolio.seoDescription || undefined,
    openGraph: {
      title,
      description: data.portfolio.seoDescription || undefined,
      images: data.portfolio.ogImageUrl ? [data.portfolio.ogImageUrl] : [],
      type: 'profile',
    },
  }
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const result = await getPortfolio(username)

  if (result.status === 'NOT_FOUND') notFound()

  if (result.status === 'UNPUBLISHED') {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 border border-amber-200 mb-5">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {result.user.displayName} 的作品集尚未公開
          </h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            作者 <span className="font-mono text-gray-700">@{result.user.username}</span> 還沒有發布這個作品集。
            <br />
            發布後即可在此網址瀏覽。
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-sm text-blue-600 hover:underline"
          >
            回到首頁 →
          </Link>
        </div>
      </main>
    )
  }

  const { user, portfolio } = result.data
  const sections = [...portfolio.sections].sort((a, b) => a.order - b.order)

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">@{user.username}</span>
        <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
        {sections.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            此作品集尚未有內容。
          </div>
        ) : (
          sections.map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              displayName={user.displayName}
            />
          ))
        )}
      </div>
    </main>
  )
}

function SectionRenderer({
  section,
  displayName,
}: {
  section: PortfolioSection
  displayName: string
}) {
  const d = section.data as Record<string, unknown>

  switch (section.type) {
    case 'HERO':
      return (
        <section id="hero" className="text-center py-8">
          {!!d.avatarUrl && (
            <img
              src={d.avatarUrl as string}
              alt={displayName}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900">
            {(d.name as string) || displayName}
          </h1>
          {!!d.title && (
            <p className="text-xl text-gray-600 mt-2">{d.title as string}</p>
          )}
          {!!d.bio && (
            <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
              {d.bio as string}
            </p>
          )}
          <div className="flex justify-center gap-6 mt-6">
            {!!d.email && (
              <a
                href={`mailto:${d.email}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Email
              </a>
            )}
            {!!d.linkedin && (
              <a
                href={d.linkedin as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                LinkedIn
              </a>
            )}
            {!!d.github && (
              <a
                href={d.github as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                GitHub
              </a>
            )}
          </div>
        </section>
      )

    case 'ABOUT':
      if (!d.content) return null
      return (
        <section id="about">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-600 leading-relaxed">{d.content as string}</p>
        </section>
      )

    case 'EXPERIENCE': {
      const items =
        (d.items as Array<{
          company: string
          role: string
          period: string
          description?: string
        }>) || []
      if (!items.length) return null
      return (
        <section id="experience">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Experience</h2>
          <div className="space-y-6">
            {items.map((item, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-5">
                <p className="font-medium text-gray-900">{item.role}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {item.company} · {item.period}
                </p>
                {!!item.description && (
                  <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )
    }

    case 'PROJECTS': {
      const items =
        (d.items as Array<{
          title: string
          description?: string
          url?: string
          tags?: string[]
        }>) || []
      if (!items.length) return null
      return (
        <section id="projects">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Projects</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-5">
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                {!!item.description && (
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.map((t, j) => (
                      <span
                        key={j}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {!!item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 mt-3 inline-block"
                  >
                    View project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )
    }

    case 'SKILLS': {
      const groups =
        (d.groups as Array<{ name: string; skills: string[] }>) || []
      if (!groups.length) return null
      return (
        <section id="skills">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Skills</h2>
          <div className="space-y-4">
            {groups.map((group, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {group.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill, j) => (
                    <span
                      key={j}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    case 'EDUCATION': {
      const items =
        (d.items as Array<{
          school: string
          degree: string
          period: string
        }>) || []
      if (!items.length) return null
      return (
        <section id="education">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Education</h2>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-5">
                <p className="font-medium text-gray-900">{item.degree}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {item.school} · {item.period}
                </p>
              </div>
            ))}
          </div>
        </section>
      )
    }

    case 'CONTACT': {
      if (!d.email && !d.linkedin && !d.github && !d.website) return null
      return (
        <section id="contact">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact</h2>
          <div className="flex flex-wrap gap-4">
            {!!d.email && (
              <a
                href={`mailto:${d.email}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {d.email as string}
              </a>
            )}
            {!!d.linkedin && (
              <a
                href={d.linkedin as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                LinkedIn
              </a>
            )}
            {!!d.github && (
              <a
                href={d.github as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                GitHub
              </a>
            )}
            {!!d.website && (
              <a
                href={d.website as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Website
              </a>
            )}
          </div>
        </section>
      )
    }

    default:
      return null
  }
}
