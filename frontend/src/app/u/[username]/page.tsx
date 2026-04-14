import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicPortfolio, PortfolioSection } from '@/types/portfolio'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getPortfolio(username: string): Promise<PublicPortfolio | null> {
  try {
    const res = await fetch(`${API}/api/portfolio/${username}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { username: string }
}): Promise<Metadata> {
  const data = await getPortfolio(params.username)
  if (!data) return { title: 'Portfolio Not Found' }
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
  params: { username: string }
}) {
  const data = await getPortfolio(params.username)
  if (!data) notFound()

  const { user, portfolio } = data
  const sections = [...portfolio.sections].sort((a, b) => a.order - b.order)

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">@{user.username}</span>
        <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
        {sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            displayName={user.displayName}
          />
        ))}
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
          {d.avatarUrl && (
            <img
              src={d.avatarUrl as string}
              alt={displayName}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900">
            {(d.name as string) || displayName}
          </h1>
          {d.title && (
            <p className="text-xl text-gray-600 mt-2">{d.title as string}</p>
          )}
          {d.bio && (
            <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
              {d.bio as string}
            </p>
          )}
          <div className="flex justify-center gap-6 mt-6">
            {d.email && (
              <a
                href={`mailto:${d.email}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Email
              </a>
            )}
            {d.linkedin && (
              <a
                href={d.linkedin as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                LinkedIn
              </a>
            )}
            {d.github && (
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
                {item.description && (
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
                {item.description && (
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
                {item.url && (
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
            {d.email && (
              <a
                href={`mailto:${d.email}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {d.email as string}
              </a>
            )}
            {d.linkedin && (
              <a
                href={d.linkedin as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                LinkedIn
              </a>
            )}
            {d.github && (
              <a
                href={d.github as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                GitHub
              </a>
            )}
            {d.website && (
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
