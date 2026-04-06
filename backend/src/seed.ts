import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Admin user (always upsert) ---
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@portfolio.com' },
    update: {},
    create: { email: 'admin@portfolio.com', password: hash }
  });

  // --- Profile (create only if missing) ---
  const existingProfile = await prisma.profile.findFirst();
  if (!existingProfile) await prisma.profile.create({
    data: {
      name: '李紅義',
      title: 'Full Stack Developer',
      bio: '熱愛創造優雅解決方案的全端開發者，擁有 5 年以上的軟體開發經驗。專注於 React、Node.js 與雲端架構，致力於打造高效能、高可用的產品。',
      email: 'hello@portfolio.com',
      phone: '+886 912 345 678',
      location: '台北，台灣',
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
    }
  });

  // --- Skills (create only if missing) ---
  const skillCount = await prisma.skill.count();
  if (skillCount > 0) { console.log('✅ Seed complete'); return; }

  const skills = [
    { name: 'React', level: 92, category: 'Frontend', order: 0 },
    { name: 'TypeScript', level: 88, category: 'Frontend', order: 1 },
    { name: 'Next.js', level: 85, category: 'Frontend', order: 2 },
    { name: 'Tailwind CSS', level: 90, category: 'Frontend', order: 3 },
    { name: 'Node.js', level: 87, category: 'Backend', order: 0 },
    { name: 'Express', level: 85, category: 'Backend', order: 1 },
    { name: 'PostgreSQL', level: 80, category: 'Backend', order: 2 },
    { name: 'Prisma', level: 82, category: 'Backend', order: 3 },
    { name: 'Docker', level: 78, category: 'DevOps', order: 0 },
    { name: 'AWS', level: 72, category: 'DevOps', order: 1 },
    { name: 'Git', level: 93, category: 'Tools', order: 0 },
    { name: 'Figma', level: 75, category: 'Tools', order: 1 },
  ];
  for (const skill of skills) await prisma.skill.create({ data: skill });

  // --- Experience ---
  const experiences = [
    {
      company: 'TechCorp Taiwan',
      role: 'Senior Full Stack Developer',
      startDate: '2022-01',
      endDate: null,
      current: true,
      description: '主導多個核心產品的前後端開發，優化系統效能提升 40%，帶領 5 人團隊完成敏捷開發流程轉型。',
      order: 0
    },
    {
      company: 'StartupXYZ',
      role: 'Frontend Developer',
      startDate: '2020-06',
      endDate: '2021-12',
      current: false,
      description: '負責 SPA 架構設計與元件庫建立，使用 React + TypeScript 重構舊系統，用戶體驗指標提升 30%。',
      order: 1
    },
    {
      company: 'Digital Agency',
      role: 'Junior Developer',
      startDate: '2019-03',
      endDate: '2020-05',
      current: false,
      description: '參與多個客戶網站開發，熟悉 HTML/CSS/JavaScript 基礎，並開始學習 React 框架。',
      order: 2
    }
  ];
  for (const exp of experiences) await prisma.experience.create({ data: exp });

  // --- Projects ---
  const projects = [
    {
      title: 'E-Commerce Platform',
      description: '全功能電商平台，包含商品管理、購物車、金流串接（綠界）、訂單追蹤系統，日均處理 500+ 筆交易。',
      tags: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Docker']),
      projectUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: true,
      order: 0
    },
    {
      title: 'Real-time Dashboard',
      description: 'IoT 設備即時監控儀表板，使用 WebSocket 推送數據，支援 1000+ 設備同時連線，含告警系統。',
      tags: JSON.stringify(['Next.js', 'Socket.io', 'Redis', 'Chart.js']),
      projectUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: true,
      order: 1
    },
    {
      title: 'AI Resume Analyzer',
      description: '運用 GPT-4 API 分析履歷並提供改進建議，自動生成面試問題，已幫助 2000+ 求職者優化履歷。',
      tags: JSON.stringify(['Python', 'FastAPI', 'OpenAI', 'React']),
      projectUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: true,
      order: 2
    },
    {
      title: 'Team Collaboration Tool',
      description: '企業內部協作工具，包含任務管理、文件共享、即時聊天，整合 Slack/Teams 通知。',
      tags: JSON.stringify(['React', 'Express', 'MongoDB', 'AWS S3']),
      projectUrl: 'https://example.com',
      featured: false,
      order: 3
    }
  ];
  for (const p of projects) await prisma.project.create({ data: p });

  // --- Testimonials ---
  const testimonials = [
    {
      name: '陳志偉',
      role: 'CTO',
      company: 'TechCorp Taiwan',
      content: '工作態度積極主動，技術能力出色。在加入團隊後迅速掌握業務脈絡，並帶來許多創新的技術解決方案。是我遇過最優秀的工程師之一。',
      rating: 5,
      featured: true,
      order: 0
    },
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'StartupXYZ',
      content: 'Excellent developer with strong communication skills. Always delivers on time and proactively identifies potential issues before they become problems.',
      rating: 5,
      featured: true,
      order: 1
    },
    {
      name: '林小明',
      role: 'UI/UX Designer',
      company: 'Digital Agency',
      content: '對設計規範的理解和落實能力非常強，能完美還原設計稿並提出合理的技術限制建議。合作起來非常順暢！',
      rating: 5,
      featured: true,
      order: 2
    }
  ];
  for (const t of testimonials) await prisma.testimonial.create({ data: t });

  console.log('✅ Seed data created successfully');
  console.log('📧 Admin: admin@portfolio.com');
  console.log('🔑 Password: admin123');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
