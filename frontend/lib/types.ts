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
  level: number
  category: string
  order: number
}

export interface Experience {
  id: string
  company: string
  role: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  imageUrl?: string
  order: number
}

export interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  imageUrl?: string
  projectUrl?: string
  githubUrl?: string
  featured: boolean
  order: number
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  avatar?: string
  rating: number
  featured: boolean
  order: number
}
