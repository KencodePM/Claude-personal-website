# Claude Code — 專案規則

## 🔐 安全規則（最高優先）

**所有對外發布（commit / push / PR）前，必須確認以下項目：**

### 禁止提交的內容
- `.env`、`.env.local`、`.env.production` 等環境變數檔案
- 任何真實的 API Key、Token、Secret（GitHub、AWS、Stripe、OpenAI 等）
- 資料庫連線字串（含帳密）
- JWT Secret 真實值
- 私鑰檔案（`.pem`、`.key`、`.p12`）
- OAuth Client Secret
- 任何包含 `password =` 真實值的設定檔

### 允許提交的內容
- `.env.example`（只含佔位符，例如 `your-secret-here`）
- 程式碼中讀取環境變數的寫法（例如 `process.env.JWT_SECRET`）
- Dev seed 預設密碼需在 README 中標明為「僅開發用，部署前需更改」

### 每次 Push 前的安全 Checklist
1. `git diff --cached` 確認無敏感資訊
2. 確認 `.gitignore` 涵蓋所有 `.env*` 檔案
3. 掃描是否含有真實 Token pattern（`gho_`、`sk-`、`AKIA`、`ghp_`）
4. 確認 git remote URL 不含 token（`git remote -v`）
5. 若有新的第三方服務，確認其金鑰未硬寫在程式碼中

### Git Remote URL 規範
- 永遠使用 `https://github.com/...` 格式
- 禁止 `https://user:token@github.com/...` 格式

---

## 📁 專案結構

```
my_profolio/
├── frontend/      # Next.js 14 + Tailwind（灰白色系）
├── backend/       # Express + Prisma + SQLite
├── nginx/         # Nginx 反向代理設定
├── qa/            # Playwright 自動化測試
├── .env.example   # 環境變數範本（無真實值）
├── docker-compose.yml
└── CLAUDE.md      # 本文件
```

## 🎨 設計規範
- 色系：灰白色系（背景 `#FFFFFF`/`#F8F9FA`，強調 `#374151`）
- 框架：Next.js 14 App Router + Tailwind CSS
- 字型：系統字型優先

## 🚀 開發流程
1. 功能開發在 feature branch（`feat/xxx`）
2. PR 前執行安全 Checklist
3. QA 測試通過後才 merge
