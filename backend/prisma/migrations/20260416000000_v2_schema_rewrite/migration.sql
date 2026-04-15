-- ============================================================
-- V2 Schema Rewrite Migration
-- Drops all legacy tables and recreates them with new schema.
-- Also adds: SkillCategory, InviteCode, PortfolioUser,
--            Portfolio, PortfolioSection, SiteSettings
-- ============================================================

-- Drop old tables (order matters due to any implicit FKs)
DROP TABLE IF EXISTS "Message";
DROP TABLE IF EXISTS "Testimonial";
DROP TABLE IF EXISTS "Project";
DROP TABLE IF EXISTS "Skill";
DROP TABLE IF EXISTS "Experience";
DROP TABLE IF EXISTS "Profile";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "SiteSettings";

-- Drop new-name tables in case of partial earlier migration
DROP TABLE IF EXISTS "portfolio_sections";
DROP TABLE IF EXISTS "portfolios";
DROP TABLE IF EXISTS "portfolio_users";
DROP TABLE IF EXISTS "invite_codes";
DROP TABLE IF EXISTS "skill_categories";
DROP TABLE IF EXISTS "site_settings";
DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "skills";
DROP TABLE IF EXISTS "experiences";
DROP TABLE IF EXISTS "testimonials";
DROP TABLE IF EXISTS "projects";
DROP TABLE IF EXISTS "profiles";
DROP TABLE IF EXISTS "users";

-- Drop old enums if exist, then recreate
DROP TYPE IF EXISTS "ProjectStatus";
DROP TYPE IF EXISTS "TestimonialStatus";
DROP TYPE IF EXISTS "MessageStatus";
DROP TYPE IF EXISTS "SectionType";

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE "ProjectStatus" AS ENUM ('PUBLISHED', 'DRAFT');
CREATE TYPE "TestimonialStatus" AS ENUM ('PUBLISHED', 'DRAFT');
CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED');
CREATE TYPE "SectionType" AS ENUM ('HERO', 'ABOUT', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'EDUCATION', 'CONTACT');

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"           TEXT         NOT NULL,
    "email"        TEXT         NOT NULL,
    "passwordHash" TEXT         NOT NULL,
    "name"         TEXT         NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ─── profiles ────────────────────────────────────────────────
CREATE TABLE "profiles" (
    "id"          TEXT         NOT NULL,
    "nameCn"      TEXT         NOT NULL,
    "nameEn"      TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "location"    TEXT         NOT NULL,
    "email"       TEXT         NOT NULL,
    "phone"       TEXT,
    "bio"         TEXT         NOT NULL,
    "heroSubtitle" TEXT        NOT NULL,
    "linkedinUrl" TEXT,
    "githubUrl"   TEXT,
    "resumeUrl"   TEXT,
    "stat1Num"    TEXT         NOT NULL,
    "stat1Label"  TEXT         NOT NULL,
    "stat2Num"    TEXT         NOT NULL,
    "stat2Label"  TEXT         NOT NULL,
    "stat3Num"    TEXT         NOT NULL,
    "stat3Label"  TEXT         NOT NULL,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- ─── projects ────────────────────────────────────────────────
CREATE TABLE "projects" (
    "id"            TEXT            NOT NULL,
    "title"         TEXT            NOT NULL,
    "category"      TEXT            NOT NULL,
    "briefDesc"     TEXT            NOT NULL,
    "caseStudyBody" TEXT            NOT NULL,
    "tags"          TEXT[]          NOT NULL DEFAULT '{}',
    "impact"        TEXT            NOT NULL,
    "year"          INTEGER         NOT NULL,
    "imageUrl"      TEXT,
    "status"        "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder"     INTEGER         NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)    NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- ─── testimonials ─────────────────────────────────────────────
CREATE TABLE "testimonials" (
    "id"          TEXT                NOT NULL,
    "name"        TEXT                NOT NULL,
    "role"        TEXT                NOT NULL,
    "company"     TEXT                NOT NULL,
    "linkedinUrl" TEXT,
    "quote"       TEXT                NOT NULL,
    "status"      "TestimonialStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder"   INTEGER             NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- ─── experiences ─────────────────────────────────────────────
CREATE TABLE "experiences" (
    "id"        TEXT         NOT NULL,
    "jobTitle"  TEXT         NOT NULL,
    "company"   TEXT         NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate"   TIMESTAMP(3),
    "isCurrent" BOOLEAN      NOT NULL DEFAULT false,
    "bullets"   TEXT[]       NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- ─── skills ──────────────────────────────────────────────────
CREATE TABLE "skills" (
    "id"        TEXT    NOT NULL,
    "category"  TEXT    NOT NULL,
    "name"      TEXT    NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- ─── skill_categories ─────────────────────────────────────────
CREATE TABLE "skill_categories" (
    "id"        TEXT    NOT NULL,
    "name"      TEXT    NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- ─── messages ────────────────────────────────────────────────
CREATE TABLE "messages" (
    "id"          TEXT            NOT NULL,
    "senderName"  TEXT            NOT NULL,
    "email"       TEXT            NOT NULL,
    "subject"     TEXT            NOT NULL,
    "body"        TEXT            NOT NULL,
    "status"      "MessageStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- ─── site_settings ────────────────────────────────────────────
CREATE TABLE "site_settings" (
    "id"              TEXT    NOT NULL,
    "metaTitle"       TEXT    NOT NULL,
    "metaDesc"        TEXT    NOT NULL,
    "ogImageUrl"      TEXT,
    "gaId"            TEXT,
    "notifyEmail"     TEXT,
    "notifyOnMessage" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- ─── invite_codes ─────────────────────────────────────────────
CREATE TABLE "invite_codes" (
    "id"        TEXT         NOT NULL,
    "code"      TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt"    TIMESTAMP(3),
    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- ─── portfolio_users ──────────────────────────────────────────
CREATE TABLE "portfolio_users" (
    "id"           TEXT         NOT NULL,
    "email"        TEXT         NOT NULL,
    "passwordHash" TEXT         NOT NULL,
    "username"     TEXT         NOT NULL,
    "displayName"  TEXT         NOT NULL,
    "inviteCodeId" TEXT         NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "portfolio_users_email_key"        ON "portfolio_users"("email");
CREATE UNIQUE INDEX "portfolio_users_username_key"     ON "portfolio_users"("username");
CREATE UNIQUE INDEX "portfolio_users_inviteCodeId_key" ON "portfolio_users"("inviteCodeId");

-- ─── portfolios ───────────────────────────────────────────────
CREATE TABLE "portfolios" (
    "id"             TEXT         NOT NULL,
    "userId"         TEXT         NOT NULL,
    "isPublished"    BOOLEAN      NOT NULL DEFAULT false,
    "seoTitle"       TEXT,
    "seoDescription" TEXT,
    "ogImageUrl"     TEXT,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "portfolios_userId_key" ON "portfolios"("userId");

-- ─── portfolio_sections ───────────────────────────────────────
CREATE TABLE "portfolio_sections" (
    "id"          TEXT          NOT NULL,
    "portfolioId" TEXT          NOT NULL,
    "type"        "SectionType" NOT NULL,
    "order"       INTEGER       NOT NULL,
    "isVisible"   BOOLEAN       NOT NULL DEFAULT true,
    "data"        JSONB         NOT NULL DEFAULT '{}',
    CONSTRAINT "portfolio_sections_pkey" PRIMARY KEY ("id")
);

-- ─── Foreign Keys ─────────────────────────────────────────────
ALTER TABLE "portfolio_users" ADD CONSTRAINT "portfolio_users_inviteCodeId_fkey"
    FOREIGN KEY ("inviteCodeId") REFERENCES "invite_codes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "portfolio_users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "portfolio_sections" ADD CONSTRAINT "portfolio_sections_portfolioId_fkey"
    FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
