import { PrismaClient, ProjectStatus, TestimonialStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.project.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  const user = await prisma.user.create({
    data: {
      email: 'admin@hungyilee.com',
      passwordHash,
      name: '李泓毅',
    },
  });
  console.log('✅ Admin user created:', user.email);

  // Create profile
  const profile = await prisma.profile.create({
    data: {
      nameCn: '李泓毅',
      nameEn: 'Hung Yi Lee',
      title: '資深產品經理',
      location: '台灣・台北',
      email: 'hungyilee@example.com',
      phone: '+886-912-345-678',
      bio: '擁有 8 年以上產品管理經驗，專注於企業數位轉型與 AI 驅動產品開發。曾帶領跨功能團隊交付多個高影響力產品，擅長數據驅動決策與敏捷開發方法論。熱衷於將複雜技術解決方案轉化為使用者友善的產品體驗。',
      heroSubtitle: '以數據為驅動，以使用者為核心，打造有影響力的數位產品',
      linkedinUrl: 'https://linkedin.com/in/hungyilee',
      githubUrl: 'https://github.com/hungyilee',
      resumeUrl: '/resume/hungyilee-resume.pdf',
      stat1Num: '8+',
      stat1Label: '年產品管理經驗',
      stat2Num: '15+',
      stat2Label: '成功交付專案',
      stat3Num: '3x',
      stat3Label: '平均 ROI 提升',
    },
  });
  console.log('✅ Profile created');

  // Create projects
  await prisma.project.createMany({
    data: [
      {
        title: '製造業數位轉型平台',
        category: '企業數位轉型',
        briefDesc: '為台灣頭部製造業客戶打造端對端數位轉型平台，整合 IoT 感測器數據、ERP 系統與 AI 預測分析，實現智慧工廠管理。',
        caseStudyBody: '## 背景與挑戰\n\n客戶為台灣前三大電子製造商，面臨生產效率低落、設備故障率高、庫存管理混亂等挑戰。\n\n## 成果\n\n- OEE 提升 23%\n- 年節省 NT$ 3,200 萬',
        tags: ['IoT', '數位轉型', 'AI/ML', 'ERP整合', '製造業', '敏捷開發'],
        impact: 'OEE 提升 23%，年節省 NT$ 3,200 萬',
        year: 2023,
        imageUrl: '/images/projects/manufacturing-platform.jpg',
        status: ProjectStatus.PUBLISHED,
        sortOrder: 1,
      },
      {
        title: 'AI 數據分析決策系統',
        category: 'AI 產品',
        briefDesc: '主導開發企業級 AI 數據分析平台，讓非技術背景的業務人員能夠透過自然語言查詢獲得即時數據洞察。',
        caseStudyBody: '## 背景與挑戰\n\n企業內部數據分析高度依賴數據團隊，業務人員等待報表平均需要 3-5 個工作天。\n\n## 成果\n\n- 自助分析率提升至 78%\n- 等待時間降低 93%',
        tags: ['AI/ML', 'NLP', '數據分析', 'LLM', '自助式BI', 'SaaS'],
        impact: '自助分析率提升至 78%，等待時間降低 93%',
        year: 2023,
        imageUrl: '/images/projects/ai-analytics.jpg',
        status: ProjectStatus.PUBLISHED,
        sortOrder: 2,
      },
      {
        title: '高流量電商後端服務',
        category: '電商平台',
        briefDesc: '重新架構電商平台後端服務，採用微服務架構應對高峰流量，系統穩定性從 99.2% 提升至 99.95%。',
        caseStudyBody: '## 背景與挑戰\n\n既有電商平台單體架構在促銷活動期間頻繁出現效能瓶頸。\n\n## 成果\n\n- 系統可用性 99.95%\n- 峰值處理能力提升 8x',
        tags: ['微服務', '電商', '高可用', 'Redis', '架構設計', 'DevOps'],
        impact: '可用性 99.95%，峰值處理能力提升 8x',
        year: 2022,
        imageUrl: '/images/projects/ecommerce-backend.jpg',
        status: ProjectStatus.PUBLISHED,
        sortOrder: 3,
      },
    ],
  });
  console.log('✅ Projects created');

  // Create testimonials
  await prisma.testimonial.createMany({
    data: [
      {
        name: '陳志明',
        role: '技術長 (CTO)',
        company: '台灣科技股份有限公司',
        linkedinUrl: 'https://linkedin.com/in/chenzm',
        quote: '泓毅在製造業數位轉型專案中展現出卓越的產品思維與跨功能協作能力。他能夠將複雜的技術挑戰轉化為清晰的業務價值，並帶領團隊以超乎預期的速度交付成果。',
        status: TestimonialStatus.PUBLISHED,
        sortOrder: 1,
      },
      {
        name: '林美華',
        role: '執行長 (CEO)',
        company: '創新數位解決方案有限公司',
        linkedinUrl: 'https://linkedin.com/in/linmh',
        quote: '泓毅是我合作過最出色的產品經理之一。他具備罕見的能力——既能與技術團隊深入討論架構細節，又能向董事會清晰呈現商業影響。',
        status: TestimonialStatus.PUBLISHED,
        sortOrder: 2,
      },
      {
        name: '王大偉',
        role: 'VP of Engineering',
        company: '全球電商平台股份有限公司',
        linkedinUrl: 'https://linkedin.com/in/wangdw',
        quote: '泓毅在電商後端重構專案中的表現令人印象深刻。他深刻理解技術債與業務需求之間的張力，能夠制定出務實且可執行的遷移策略。',
        status: TestimonialStatus.PUBLISHED,
        sortOrder: 3,
      },
    ],
  });
  console.log('✅ Testimonials created');

  // Create experiences
  await prisma.experience.createMany({
    data: [
      {
        jobTitle: '資深產品經理',
        company: '台灣科技股份有限公司',
        startDate: new Date('2022-03-01'),
        endDate: null,
        isCurrent: true,
        bullets: [
          '主導製造業數位轉型平台開發，帶領 15 人跨功能團隊，產品上線後為客戶創造年 NT$ 3,200 萬成本節省',
          '建立 AI 數據分析決策系統產品策略，月活躍用戶從零成長至 850+，NPS 達 67',
          '制定並執行年度產品路線圖，協調 3 個工程團隊與 2 個業務單位的優先級排序',
        ],
        sortOrder: 1,
      },
      {
        jobTitle: '產品經理',
        company: '全球電商平台股份有限公司',
        startDate: new Date('2019-06-01'),
        endDate: new Date('2022-02-28'),
        isCurrent: false,
        bullets: [
          '負責電商平台後端服務重構，將單體架構遷移至微服務，系統可用性提升至 99.95%',
          '主導支付模組產品化，整合 5 家支付服務商，年交易額突破 NT$ 20 億',
          '建立產品需求管理流程，Sprint 交付準時率從 72% 提升至 91%',
        ],
        sortOrder: 2,
      },
      {
        jobTitle: '初級產品經理',
        company: '創新數位解決方案有限公司',
        startDate: new Date('2017-07-01'),
        endDate: new Date('2019-05-31'),
        isCurrent: false,
        bullets: [
          '協助規劃與執行 SaaS B2B 產品功能迭代，負責需求文件撰寫與驗收測試',
          '進行競品分析與市場調研，產出月度市場洞察報告',
          '建立用戶訪談流程，每季執行 20+ 次深度訪談',
        ],
        sortOrder: 3,
      },
    ],
  });
  console.log('✅ Experiences created');

  // Create skill categories and skills
  const skillCategoriesData = [
    {
      name: '產品管理',
      sortOrder: 1,
      skills: [
        { name: '產品策略規劃', sortOrder: 1 },
        { name: '用戶故事地圖', sortOrder: 2 },
        { name: '路線圖制定', sortOrder: 3 },
        { name: 'OKR / KPI 設定', sortOrder: 4 },
        { name: '敏捷 / Scrum', sortOrder: 5 },
        { name: '競品分析', sortOrder: 6 },
      ],
    },
    {
      name: '數據分析',
      sortOrder: 2,
      skills: [
        { name: 'SQL', sortOrder: 1 },
        { name: 'Python (數據分析)', sortOrder: 2 },
        { name: 'Tableau / Power BI', sortOrder: 3 },
        { name: 'A/B 測試設計', sortOrder: 4 },
        { name: 'Google Analytics', sortOrder: 5 },
        { name: 'Mixpanel', sortOrder: 6 },
      ],
    },
    {
      name: '技術理解',
      sortOrder: 3,
      skills: [
        { name: 'RESTful API 設計', sortOrder: 1 },
        { name: '微服務架構', sortOrder: 2 },
        { name: 'AI/ML 產品化', sortOrder: 3 },
        { name: '雲端架構 (AWS/GCP)', sortOrder: 4 },
        { name: '資料庫設計', sortOrder: 5 },
        { name: 'DevOps 基礎', sortOrder: 6 },
      ],
    },
    {
      name: '協作工具',
      sortOrder: 4,
      skills: [
        { name: 'Jira / Confluence', sortOrder: 1 },
        { name: 'Figma', sortOrder: 2 },
        { name: 'Notion', sortOrder: 3 },
        { name: 'Slack', sortOrder: 4 },
        { name: 'Miro', sortOrder: 5 },
        { name: 'Linear', sortOrder: 6 },
      ],
    },
  ];

  for (const categoryData of skillCategoriesData) {
    await prisma.skillCategory.create({
      data: {
        name: categoryData.name,
        sortOrder: categoryData.sortOrder,
      },
    });

    await prisma.skill.createMany({
      data: categoryData.skills.map((skill) => ({
        category: categoryData.name,
        name: skill.name,
        sortOrder: skill.sortOrder,
      })),
    });
  }
  console.log('✅ Skills and categories created');

  // Create site settings
  await prisma.siteSettings.create({
    data: {
      metaTitle: '李泓毅 | 資深產品經理 Portfolio',
      metaDesc: '李泓毅的個人作品集，資深產品經理，專注企業數位轉型與 AI 產品開發，擁有 8 年以上產品管理經驗。',
      ogImageUrl: '/images/og-image.jpg',
      gaId: '',
      notifyEmail: 'admin@hungyilee.com',
      notifyOnMessage: true,
    },
  });
  console.log('✅ Site settings created');

  // Create sample message
  await prisma.message.create({
    data: {
      senderName: '系統測試',
      email: 'test@example.com',
      subject: '測試訊息',
      body: '這是一封測試訊息，確認聯絡表單功能正常運作。',
      status: 'READ',
    },
  });
  console.log('✅ Sample message created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
