'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { Profile, Project, Experience, Skill, Testimonial } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, MapPin, ExternalLink, Download, ChevronDown, Star, Menu, X, CheckCircle } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/icons';

export default function Portfolio() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', content: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [activeSection, setActiveSection] = useState('hero');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProfile().catch(() => null),
      api.getProjects().catch(() => []),
      api.getExperience().catch(() => []),
      api.getSkills().catch(() => []),
      api.getTestimonials().catch(() => []),
    ]).then(([p, pr, ex, sk, te]) => {
      setProfile(p);
      setProjects((pr as any)?.projects ?? (Array.isArray(pr) ? pr : []));
      setExperiences(ex);
      setSkills(sk);
      setTestimonials(te);
    });
  }, []);

  useEffect(() => {
    const sections = ['hero', 'about', 'experience', 'projects', 'testimonials', 'contact'];
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    try {
      await api.sendMessage(contactForm);
      setContactStatus('sent');
      setContactForm({ name: '', email: '', subject: '', content: '' });
      setShowSuccessModal(true);
    } catch { setContactStatus('error'); }
  };

  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const navLinks = [
    { id: 'about', label: '關於' },
    { id: 'experience', label: '經歷' },
    { id: 'projects', label: '作品集' },
    { id: 'testimonials', label: '推薦人' },
    { id: 'contact', label: '聯繫' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 20 }}
              className="flex justify-center mb-5"
            >
              <CheckCircle size={64} className="text-green-500" strokeWidth={1.5} />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">訊息已送出！</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              您的信息已收到，請等待回覆。<br />我會盡快與您聯繫！
            </p>
            <button
              onClick={() => { setShowSuccessModal(false); setContactStatus('idle'); }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              好的，謝謝！
            </button>
          </motion.div>
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#hero" className="font-semibold text-gray-900 text-lg">{profile?.nameCn || profile?.nameEn || 'Portfolio'}</a>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a key={link.id} href={`#${link.id}`}
                className={`text-sm transition-colors ${activeSection === link.id ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}>
                {link.label}
              </a>
            ))}
            {profile?.resumeUrl && (
              <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm px-4 py-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors flex items-center gap-1.5">
                <Download size={12} /> 下載履歷
              </a>
            )}
          </div>
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <a key={link.id} href={`#${link.id}`} className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="min-h-screen flex items-center pt-16">
        <div className="max-w-5xl mx-auto px-6 py-24 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs text-gray-400 mb-4 tracking-widest uppercase">Full Stack Developer</p>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {profile?.nameCn || profile?.nameEn || '載入中...'}
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">{profile?.bio}</p>
              <div className="flex flex-wrap gap-3">
                <a href="#projects" className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-700 transition-colors">
                  查看作品集
                </a>
                {profile?.resumeUrl ? (
                  <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer"
                    className="px-6 py-3 border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-gray-400 transition-colors flex items-center gap-2">
                    <Download size={14} /> 下載履歷
                  </a>
                ) : (
                  <a href="#contact" className="px-6 py-3 border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-gray-400 transition-colors">
                    聯繫我
                  </a>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                {profile?.githubUrl && <SocialLink href={profile.githubUrl}><GithubIcon size={18} /></SocialLink>}
                {profile?.linkedinUrl && <SocialLink href={profile.linkedinUrl}><LinkedinIcon size={18} /></SocialLink>}
                {profile?.email && <SocialLink href={`mailto:${profile.email}`}><Mail size={18} /></SocialLink>}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="w-64 h-64 md:w-72 md:h-72 rounded-3xl bg-gray-100 overflow-hidden border border-gray-200">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl font-light text-gray-200">{profile?.nameCn?.[0] || profile?.nameEn?.[0] || '?'}</span>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 -z-10" />
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 -z-10" />
              </div>
            </div>
          </div>
          <div className="mt-20 flex justify-center">
            <a href="#about" className="text-gray-200 hover:text-gray-400 transition-colors animate-bounce">
              <ChevronDown size={24} />
            </a>
          </div>
        </div>
      </section>

      {/* About / Skills */}
      <section id="about" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader title="關於我" subtitle="技術能力與專業背景" />
          <div className="flex flex-wrap gap-6 mb-12">
            {profile?.location && <ContactItem icon={<MapPin size={14} />} label={profile.location} />}
            {profile?.email && <ContactItem icon={<Mail size={14} />} label={profile.email} href={`mailto:${profile.email}`} />}
            {profile?.phone && <ContactItem icon={<Phone size={14} />} label={profile.phone} />}
          </div>
          <div className="space-y-10">
            {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">{cat}</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  {catSkills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                      <StarRating value={skill.level} max={7} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience — framer-motion timeline */}
      <section id="experience" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader title="工作經歷" subtitle="職涯發展歷程" />
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gray-200" />
            <div className="space-y-8">
              {experiences.map((exp, idx) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: idx * 0.1, ease: 'easeOut' }}
                  className="flex gap-6"
                >
                  {/* Dot */}
                  <div className="relative flex-shrink-0 mt-1.5">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 relative
                      ${idx === 0 ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                      {exp.imageUrl ? (
                        <img src={exp.imageUrl} alt={exp.company} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className={`text-xs font-bold ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>
                          {exp.company[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.role}</h3>
                        <p className="text-gray-500 text-sm mt-0.5">{exp.company}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className="text-xs text-gray-400">
                          {formatDate(exp.startDate)} — {exp.current ? '現在' : formatDate(exp.endDate || '')}
                        </span>
                        {exp.current && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">目前職位</span>}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{exp.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader title="作品集" subtitle="精選開發專案" />
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-b border-gray-100">
                  {project.imageUrl
                    ? <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                    : <span className="text-6xl font-light text-gray-200">{project.title[0]}</span>}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                    {project.featured && <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-400 text-xs rounded-full whitespace-nowrap">精選</span>}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 pt-3 border-t border-gray-100">
                    {project.projectUrl && (
                      <a href={project.projectUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                        <ExternalLink size={12} /> 查看專案
                      </a>
                    )}
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                        <GithubIcon size={12} /> 原始碼
                      </a>
                    )}
                    {!project.projectUrl && !project.githubUrl && (
                      <span className="text-xs text-gray-300">連結即將上線</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — hover float */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader title="推薦人" subtitle="合作夥伴的評語" />
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.filter(t => t.featured).map(t => (
              <motion.div
                key={t.id}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col cursor-default"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-gray-400 text-gray-400" />
                  ))}
                </div>
                <blockquote className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm shrink-0 overflow-hidden">
                    {t.avatar ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" /> : t.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role} · {t.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader title="聯繫我" subtitle="期待與您合作" />
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                無論是新的專案合作、技術諮詢，或只是想打聲招呼，我都很樂意收到您的訊息。
              </p>
              <div className="space-y-4">
                {profile?.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-gray-300 transition-colors">
                      <Mail size={14} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{profile.email}</span>
                  </a>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                      <Phone size={14} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600">{profile.phone}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                      <MapPin size={14} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600">{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleContact} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">姓名 *</label>
                  <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="您的姓名" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">電子郵件 *</label>
                  <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">主旨</label>
                <input type="text" value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="訊息主旨（選填）" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">訊息 *</label>
                <textarea required rows={5} value={contactForm.content} onChange={e => setContactForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  placeholder="您的訊息..." />
              </div>
              <button type="submit" disabled={contactStatus === 'sending'}
                className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {contactStatus === 'sending' ? '傳送中...' : '傳送訊息'}
              </button>
              {contactStatus === 'error' && <p className="text-red-400 text-xs text-center">傳送失敗，請稍後再試</p>}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} {profile?.nameCn || profile?.nameEn}. All rights reserved.</p>
          <div className="flex gap-4">
            {profile?.githubUrl && <SocialLink href={profile.githubUrl}><GithubIcon size={16} /></SocialLink>}
            {profile?.linkedinUrl && <SocialLink href={profile.linkedinUrl}><LinkedinIcon size={16} /></SocialLink>}
          </div>
        </div>
      </footer>
    </div>
  );
}

/** 7-star rating display */
function StarRating({ value, max = 7 }: { value: number; max?: number }) {
  const stars = Math.min(Math.max(Math.round(value), 0), max);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < stars ? 'fill-gray-600 text-gray-600' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-gray-400 text-sm">{subtitle}</p>
      <div className="mt-4 w-10 h-0.5 bg-gray-200 rounded-full" />
    </div>
  );
}

function SocialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-700 transition-colors">
      {children}
    </a>
  );
}

function ContactItem({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <span className="text-gray-400">{icon}</span>
      {label}
    </div>
  );
  if (href) return <a href={href} className="hover:text-gray-900 transition-colors">{content}</a>;
  return content;
}
