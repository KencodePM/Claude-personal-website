# Backend — Claude 規則

## 架構
- **框架**：Express + Prisma + PostgreSQL
- **入口**：`src/index.ts` → 編譯到 `dist/index.js`
- **Port**：必須讀 `process.env.PORT`（Render 設定為 10000，禁止 hardcode）
- **Build**：`npm run build`（tsc）
- **Start**：`prisma migrate deploy && node dist/seed.js && node dist/index.js`

## Prisma 規則
- schema 修改後必須建立 migration（`npx prisma migrate dev --name <name>`）
- **禁止**使用 `prisma db push`（不會建立 migration 記錄）
- `seed.ts` 必須保持 idempotent（重複執行不出錯）
- 每個 model 的 upsert 使用 unique field 作為 `where` 條件

## API 命名規範
- RESTful：`GET /api/{resource}`, `POST /api/{resource}`, `PATCH /api/{resource}/:id`, `DELETE /api/{resource}/:id`
- 認證路由：`/api/auth/*`（JWT）
- 上傳路由：`POST /api/upload`（multer，限 10MB，僅圖片/PDF）
- 健康檢查：`GET /api/health`（永遠回傳 `{ status: 'ok' }`）

## 錯誤處理
- 所有 async route handler 必須有 `try/catch`
- 錯誤統一回傳 `{ error: string }` + 對應 HTTP status code
- 401 = 未認證，403 = 無權限，404 = 找不到，500 = 伺服器錯誤

## 部署注意
- `FRONTEND_URL` env var 控制 CORS origin（多個用逗號分隔）
- 圖片上傳目前存在本地磁碟（`../../uploads/`）— Render ephemeral，重新部署後消失
- 健康檢查路徑：`/api/health`（render.yaml 已設定）

## 禁止事項
- 禁止 hardcode `localhost:4000` 或任何 port（使用 `process.env.PORT`）
- 禁止在 seed.ts 使用非冪等操作（`create` 而非 `upsert`）
- 禁止手動修改 `prisma/migrations/` 內的 SQL 檔案
