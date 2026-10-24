# BrandShield AI

**Evidence-based brand governance for promotional content**

**Team:** Infinite Loop | **Institution:** Adamas University
**Team Leader:** Atif Intezar | **Team Member:** M Arquam Kamal

---

## Overview

BrandShield AI is a brand governance platform that helps organisations review promotional content against their approved brand guidelines, product facts, and approved claims. The system uses AI-powered evidence retrieval and explainable findings to support human reviewers in making informed approval decisions.

## Problem

Marketing teams frequently publish promotional content that overstates product capabilities, misquotes warranty terms, or makes claims unsupported by approved documentation — creating legal, reputational, and compliance risks.

## Solution

BrandShield AI provides an end-to-end workflow:

1. Upload approved brand documents (PDF/TXT)
2. Submit promotional content for review
3. AI extracts claims and retrieves relevant evidence from approved documents
4. Each claim is classified as SUPPORTED, UNVERIFIED, or CONTRADICTED
5. Findings include source document, evidence passage, explanation, and suggested correction
6. A human reviewer makes the final Approve/Reject/Request Changes decision
7. All versions and decisions are recorded in revision history

---

## Round 2 Features

- ✅ Role-based authentication (Admin, Creator, Reviewer, Manager)
- ✅ Brand document library (PDF and TXT upload with extraction)
- ✅ Document processing with passage indexing
- ✅ New review submission form with demo examples
- ✅ AI claim extraction using Gemini API
- ✅ Real evidence retrieval using TF-IDF cosine similarity
- ✅ Claim classification: SUPPORTED / UNVERIFIED / CONTRADICTED
- ✅ Explainable findings with source, evidence, and suggested correction
- ✅ Human reviewer workflow (Approve / Reject / Request Changes)
- ✅ Reviewer comments stored with decisions
- ✅ Content revision after changes requested
- ✅ Revision history timeline
- ✅ Dashboard with real statistics
- ✅ Insights page with real data
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Error handling and loading states

---

## User Roles

| Role | Key Permissions |
|---|---|
| **Admin** | Upload documents, view all reviews, approve/reject, submit reviews |
| **Creator** | Submit reviews, view own reviews, revise content |
| **Reviewer** | View all reviews, approve/reject/request changes |
| **Manager** | View dashboard, all reviews (read-only), insights |

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@novatech.com | demo1234 | Admin |
| creator@novatech.com | demo1234 | Creator |
| reviewer@novatech.com | demo1234 | Reviewer |
| manager@novatech.com | demo1234 | Manager |

---

## Demo Organisation

**Organisation:** NovaTech
**Product:** NovaTech Flow

Pre-seeded approved facts:
- NovaTech Flow reduces processing time by **up to 30%**
- NovaTech Flow includes a **1-year standard warranty**
- NovaTech Flow is available in **three configurations**: Starter, Professional, Enterprise

**Test claims:**
| Submitted Claim | Expected Result |
|---|---|
| "NovaTech Flow is available in three configurations." | SUPPORTED |
| "NovaTech Flow includes a 2-year warranty." | CONTRADICTED |
| "NovaTech Flow is the fastest solution in the world." | UNVERIFIED |

---

## Full Acceptance Workflow

1. Login as `creator@novatech.com`
2. Go to **Brand Documents** → Upload `demo-files/NovaTech_Flow_Product_Facts.txt`
3. Confirm document status → **READY**
4. Go to **New Review** → Try the "Contradicted example"
5. Click **Analyze Content** and wait for analysis
6. View findings: CONTRADICTED with source evidence and suggested correction
7. Login as `reviewer@novatech.com`
8. Open the review → Select **Request Changes** → Add comment → Submit
9. Login back as `creator@novatech.com`
10. Open the review → Revise content with the suggested correction
11. Submit Revised Content → Re-analysis runs automatically
12. Login as `reviewer@novatech.com` → **Approve** the corrected version
13. Check **Revision History** → Both versions shown with decisions
14. Check **Dashboard** and **Insights** → Stats reflect real activity

---

## Technical Architecture

```
Browser (Next.js 14 App Router)
        ↕ HTTPS
Vercel Serverless Functions (API Routes)
        ↕
┌───────────────────────────────────────┐
│  NextAuth.js (JWT session)            │
│  Prisma ORM → Neon PostgreSQL         │
│  Vercel Blob (file storage)           │
│  pdf-parse (text extraction)          │
│  TF-IDF RAG (evidence retrieval)      │
│  Google Gemini API (claim analysis)   │
└───────────────────────────────────────┘
```

### AI Pipeline

1. **Claim Extraction** — Gemini 1.5 Flash extracts factual/promotional claims as structured JSON
2. **Evidence Retrieval** — TF-IDF cosine similarity search over indexed passages from approved documents
3. **Claim Classification** — Gemini receives claim + top-3 evidence passages → returns status, severity, explanation, suggested correction
4. **Brand Issues** — Separate Gemini pass for tone/terminology issues not caught as individual claims

### RAG Implementation

Real retrieval (not hardcoded):
- Documents are split into ~500-character passages on upload
- TF-IDF vectors computed per-query against all DB-stored passages
- Cosine similarity ranking returns top-3 most relevant passages per claim
- Passages are passed to Gemini as context for classification

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) via Prisma |
| File Storage | Vercel Blob |
| Auth | NextAuth.js v4 (credentials) |
| AI/LLM | Google Gemini 1.5 Flash |
| RAG | TF-IDF cosine similarity (custom, no extra API) |
| PDF Extraction | pdf-parse |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Neon PostgreSQL database (free at neon.tech)
- A Google Gemini API key (free at aistudio.google.com)
- Vercel account (for Blob storage token)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd brandshield-ai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in all values

# 4. Push database schema
npx prisma db push

# 5. Seed demo data
npx prisma db seed

# 6. Start development server
npm run dev
```

### Environment Variables

```env
NEXTAUTH_SECRET=your-random-secret-32-chars-minimum
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
MAX_FILE_SIZE_MB=10
```

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → add all from .env.example

# After deploy, run seed:
vercel env pull .env.production.local
npx prisma db push
npx prisma db seed
```

---

## Security

- API keys are server-side only, never exposed to client
- `.env.local` is gitignored
- File uploads validated (type, size, MIME)
- Role-based access enforced on every API route
- Prisma ORM prevents SQL injection
- Sessions use JWT with server-side secret

---

## Known Limitations (Round 2)

- Analysis runs synchronously — very long content may approach Vercel's 60s function timeout
- No real-time status updates (requires manual page refresh after analysis)
- TF-IDF retrieval is effective but simpler than embedding-based vector search
- No email notifications
- No bulk document operations

---

## Round 3 — Planned Improvements

> These are FUTURE PLANS only. Not implemented in Round 2.

1. **Multimodal Brand & Creative Analysis** — Visual brand consistency, logo usage, image text, accessibility checks
2. **Advanced Governance Intelligence** — Recurring violation detection, unclear guideline surfacing, review trend analytics
3. **Advanced Enterprise Approval & Audit** — Custom role-based policies, multi-level approval chains, immutable audit logs

---

## AI Tools Disclosure

- **Google Gemini 1.5 Flash** — Used for claim extraction, claim classification, and brand issue analysis
- **Antigravity (Google DeepMind)** — AI coding assistant used for code generation and project scaffolding
- All AI-generated code was reviewed and integrated by the development team

---

## GitHub Preparation

```bash
git init
git add .
git commit -m "feat: BrandShield AI Round 2 MVP"
git branch -M main
git remote add origin <your-github-url>
git push -u origin main
```

> Note: `.env.local` is gitignored. Only `.env.example` (no secrets) is committed.
