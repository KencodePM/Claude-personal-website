export interface Profile {
  id: string;
  name: string;
  title: string;
  bio: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
  order: number;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  imageUrl?: string;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  featured: boolean;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
  featured: boolean;
  order: number;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  content: string;
  read: boolean;
  createdAt: string;
}
