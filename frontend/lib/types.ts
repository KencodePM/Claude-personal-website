export interface Message {
  id: string
  senderName: string
  email: string
  subject: string
  body: string
  status: 'UNREAD' | 'READ' | 'REPLIED'
  createdAt: string
}

export interface Profile {
  id: string
  nameCn: string
  nameEn: string
  title: string
  location: string
  email: string
  phone: string | null
  bio: string
  heroSubtitle: string
  linkedinUrl: string | null
  githubUrl: string | null
  resumeUrl: string | null
  stat1Num: string
  stat1Label: string
  stat2Num: string
  stat2Label: string
  stat3Num: string
  stat3Label: string
  updatedAt: string
}

export interface Skill {
  id: string
  name: string
  category: string
  sortOrder: number
}

export interface Experience {
  id: string
  company: string
  jobTitle: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  bullets: string[]
  sortOrder: number
}

export interface Project {
  id: string
  title: string
  category: string
  briefDesc: string
  caseStudyBody: string
  tags: string[]
  impact: string
  year: number
  imageUrl?: string
  status: 'PUBLISHED' | 'DRAFT'
  sortOrder: number
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  linkedinUrl?: string
  quote: string
  status: 'PUBLISHED' | 'DRAFT'
  sortOrder: number
}
