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

## 🌿 分支與部署策略
- **`main`** = 正式環境（Vercel 前端 + Render 後端均自動追蹤此分支）
- Render `rootDir: backend` — 只有 `backend/` 有異動才會觸發後端重新部署
- push 到 main 後，**必須**至 Vercel Dashboard 確認 deployment 已觸發
- Render 事故期間（status.render.com 有 incident）**禁止**觸發 redeploy

## 🩺 Debug SOP — 遇到後端 5xx / 521
1. 先查 https://status.render.com（是否有 incident）
2. 再查 Render Logs（是否有 crash）
3. 確認 PORT env 為 10000
4. 才開始改 code 或 redeploy

## 🗃️ Prisma Migration 流程
- 每次修改 `backend/prisma/schema.prisma`，必須執行：
  ```
  cd backend && npx prisma migrate dev --name <migration_name>
  ```
- Migration 檔案必須 commit 進 git（`backend/prisma/migrations/`）
- 嚴禁手動修改 migrations/ 目錄內的 SQL
- Render 部署時會自動執行 `prisma migrate deploy`

## ☁️ 平台環境變數
| 平台 | 需設定 | 說明 |
|------|--------|------|
| Render | `DATABASE_URL`, `JWT_SECRET`, `PORT=10000`, `FRONTEND_URL` | `FRONTEND_URL` 標記 `sync: false`，需手動填入 |
| Vercel | `BACKEND_URL` | 指向 Render 後端 URL |

## 🚀 開發流程
1. 功能開發在 feature branch（`feat/xxx`）
2. PR 前執行安全 Checklist
3. QA 測試通過後才 merge

## ✅ 新功能開發 Checklist（每次都要照做）

### 後端新增 API
- [ ] 在 `backend/src/routes/` 建立新 router
- [ ] 在 `backend/src/index.ts` 掛載：`app.use('/api/xxx', xxxRoutes)`
- [ ] 若有新資料表 → 修改 `schema.prisma` + 執行 `prisma migrate dev`
- [ ] 在 `seed.ts` 加入對應的 upsert 種子資料
- [ ] 確認 `/api/health` 仍回傳 200

### 前端新增頁面
- [ ] App Router 路徑：`frontend/app/{page}/page.tsx`
- [ ] 後端 API 呼叫通過 Next.js rewrites（`/api/*` → Render），不可硬寫 localhost
- [ ] 有 loading 狀態處理（避免 SSR hydration error）

### 部署前確認
- [ ] `git diff --cached` 無敏感資訊
- [ ] push 到 main
- [ ] 至 Vercel Dashboard 確認 deployment 觸發
- [ ] 若有後端異動：至 Render Dashboard 確認 deploy 觸發
- [ ] 執行 `bash scripts/check-deploy.sh` 驗證線上狀態
