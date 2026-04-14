export interface PortfolioUser {
  id: string
  email: string
  username: string
  displayName: string
}

export type SectionType =
  | 'HERO'
  | 'ABOUT'
  | 'EXPERIENCE'
  | 'PROJECTS'
  | 'SKILLS'
  | 'EDUCATION'
  | 'CONTACT'

export interface PortfolioSection {
  id: string
  type: SectionType
  order: number
  isVisible: boolean
  data: Record<string, unknown>
}

export interface Portfolio {
  id: string
  isPublished: boolean
  seoTitle: string | null
  seoDescription: string | null
  ogImageUrl: string | null
  sections: PortfolioSection[]
}

export interface PublicPortfolio {
  user: { username: string; displayName: string }
  portfolio: {
    seoTitle: string | null
    seoDescription: string | null
    ogImageUrl: string | null
    sections: PortfolioSection[]
  }
}
