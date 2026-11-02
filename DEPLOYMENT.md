# MZ Tourism Qatar — Production Deployment & Operations Manual

This runbook provides the definitive operational and deployment guide for the **MZ Tourism Qatar** platform (`gcc-tourism-platform`).

---

## 1. System Architecture Summary

- **Frontend & App Engine**: Next.js 15.1.7 (App Router), React 19, Tailwind CSS 3.4.1.
- **Backend & Database**: Supabase (PostgreSQL 15), Supabase Auth, Supabase Storage (`deposit-proofs` private bucket).
- **Security & Authorization**: Row-Level Security (RLS) across all 8 core tables + articles table, server-only service-role isolation, rate-limiting, magic-byte receipt validation.
- **Bilingual Infrastructure**: Native English (`/en`) and Arabic (`/ar`) with Cairo font and true Right-to-Left (RTL) alignment.
- **Official Concierge Conduit**: WhatsApp integration anchored to **`+974 7038 6705`**.

---

## 2. Environment Variables Matrix

Configure these environment variables in your production hosting provider (e.g. Vercel Project Settings -> Environment Variables):

| Variable Name | Exposure | Required | Production Value / Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | **Yes** | `https://spmomvusvhielqcoxtwu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | **Yes** | Supabase Project Anonymous Key (from Supabase API Settings) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Strictly Server-Only** | **Yes** | Supabase Project Service Role Secret *(Never expose to browser!)* |
| `NEXT_PUBLIC_SITE_URL` | Public / Browser | **Yes** | `https://mztourismqatar.qa` *(Replaces local localhost:3000)* |
| `RESEND_FROM_EMAIL` | Server-Only | Optional | Custom sender: `MZ Tourism Qatar <concierge@mztourismqatar.qa>` |
| `CRON_SECRET` | Server-Only | Optional | Secret bearer token for `/api/cron/reminders` endpoint |
| `RESEND_API_KEY` | Server-Only | Optional | Resend API Key (`re_...`) for live departure reminder and welcome emails |

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` has administrative bypass privileges in Postgres. It is strictly guarded in server code (`src/lib/supabase/admin.ts`) with `import "server-only";` and must **never** be prefixed with `NEXT_PUBLIC_`.

---

## 3. Supabase Production Setup Checklist

### Step 1: Execute Blog System Migration
Open your [Supabase Dashboard](https://supabase.com/dashboard/project/spmomvusvhielqcoxtwu) -> **SQL Editor** -> **New Query**, paste and run the contents of:
[`supabase/migrations/20261030000001_blog_system.sql`](file:///c:/Users/Flick/Downloads/gcc-tourism-platform/supabase/migrations/20261030000001_blog_system.sql)

This creates:
1. `public.articles` table with category constraints and reading time indicators.
2. Row-Level Security: public can view published articles (`is_published = true`), while administrators can manage all drafts and articles.
3. 3 curated luxury editorial guides in both English and Arabic.

### Step 2: Verify Private Storage Bucket
In Supabase Dashboard -> **Storage** -> **deposit-proofs**:
- Confirm that the bucket is **Private** (`public = false`).
- Direct public URLs are disabled; the app automatically signs 15-minute expiring URLs (`createSignedUrl`) for admin verification.

### Step 3: Configure Auth Redirect URLs
In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
- **Site URL**: `https://mztourismqatar.qa`
- **Redirect URLs** (Add each):
  - `https://mztourismqatar.qa/en/auth`
  - `https://mztourismqatar.qa/ar/auth`
  - `https://mztourismqatar.qa/en/account`
  - `https://mztourismqatar.qa/ar/account`
  - `http://localhost:3000/**` *(for local testing)*

### Step 4: Verify Administrator Clearance
To grant an administrator account dashboard clearance:
1. Sign up or invite the staff email via Supabase Auth or the `/en/auth` portal.
2. In Supabase Dashboard -> **Table Editor** -> `public.admin_users`, ensure an entry exists:
   - `email`: `staff@mztourismqatar.qa`
   - `role`: `super_admin` or `admin`
   - `is_active`: `true`

### Step 5: Execute White-Label Welcome Email Migration
Open Supabase Dashboard -> **SQL Editor** -> **New Query**, paste and run:
[`supabase/migrations/20261030000002_white_label_email.sql`](file:///c:/Users/Flick/Downloads/gcc-tourism-platform/supabase/migrations/20261030000002_white_label_email.sql)

This adds the `welcome_email_sent_at` column to `public.profiles` to enforce strict single-send idempotency for the VIP welcome letter.

### Step 6: Custom Domain & White-Label Email Setup
To eliminate all technical provider names and expose **only** `MZ Tourism Qatar` to customers:
1. In [Resend Dashboard](https://resend.com/domains), add your custom domain: `mztourismqatar.qa`.
2. Add the generated DNS records to your domain registrar (e.g., Ooredoo, Cloudflare):
   - **TXT (SPF)**: `v=spf1 include:amazonses.com ~all`
   - **CNAME (DKIM)**: `resend._domainkey.mztourismqatar.qa`
   - **TXT (DMARC)**: `_dmarc.mztourismqatar.qa` -> `v=DMARC1; p=none;`
3. In Supabase Dashboard -> **Authentication** -> **SMTP Settings**:
   - Toggle **Enable Custom SMTP**: ON
   - **Sender email**: `concierge@mztourismqatar.qa`
   - **Sender name**: `MZ Tourism Qatar`
   - **Host**: `smtp.resend.com` (Port `465` or `587`)
   - **User**: `resend`
   - **Password**: Your `RESEND_API_KEY`
4. In Supabase Dashboard -> **Authentication** -> **Email Templates**:
   - Update **Confirm Signup** & **Reset Password** templates to remove all default Supabase branding and headers.
   - Set Subject: `Reset Your MZ Tourism Qatar Password` / `استعادة كلمة المرور — إم زد للسياحة قطر`
   - Use clean luxury text with redirect to `https://mztourismqatar.qa/en/auth?mode=reset`.

---

## 4. Deploying to Vercel

### Option A: Via GitHub Integration (Recommended)
1. Push this repository to your GitHub organization or private account.
2. Go to [Vercel Dashboard](https://vercel.com) -> **Add New Project** -> Import repository.
3. In **Environment Variables**, paste the keys from Section 2.
4. Click **Deploy**. Vercel will run `npm run build` and provision edge network caching.
5. Vercel Cron will automatically register the schedule defined in `vercel.json` (`0 6 * * *`, daily at 09:00 Qatar time).

### Option B: Custom Domain DNS Setup
In Vercel -> Project -> **Settings** -> **Domains**:
- Add `mztourismqatar.qa` and `www.mztourismqatar.qa`.
- Configure your DNS provider (e.g. Cloudflare, GoDaddy, Ooredoo, Namecheap):
  - **Type A**: `@` -> `76.76.21.21` (or Vercel designated IP)
  - **Type CNAME**: `www` -> `cname.vercel-dns.com`

---

## 5. Day-1 Staff Operations Manual

### 1. Accessing the Staff Command Center
- **English Portal**: `https://mztourismqatar.qa/en/admin`
- **Arabic Portal**: `https://mztourismqatar.qa/ar/admin`
- Enter authorized administrator credentials.

### 2. Managing Reservations & Deposit Verification
1. **Executive Overview (`Metrics`)**: Real-time counts of pending inquiries, active reservations, unreviewed payment slips, and total revenue.
2. **Deposit Review Queue (`Deposit Review`)**:
   - Displays uploaded bank transfer receipts awaiting staff approval.
   - Click **Review Receipt** to view the cryptographically signed preview (PDF or image).
   - Click **Approve** to mark deposit as confirmed, or **Reject** with a clear explanation sent to the customer tracking view.
3. **Reservations Table (`All Reservations`)**:
   - Filter by date, payment status, booking status, or service.
   - Click **Export CSV** to download an RFC 4180 compliant spreadsheet with UTF-8 BOM encoding (opens cleanly in Microsoft Excel with Arabic support).
   - Use the **WhatsApp** icon on any booking to open a direct pre-filled concierge chat with the guest.

### 3. Publishing Travel Guides & Editorial Content
1. Navigate to **Travel Guides & Editorial** tab in the Admin Console.
2. Click **+ New Editorial Guide** to publish a new bilingual itinerary or protocol advisory.
3. Toggle articles between **Published** and **Draft** with 1 click.
4. Live previews are accessible at `/en/blog/[slug]` and `/ar/blog/[slug]`.

---

## 6. System Health & Monitoring

- **Health Check Endpoint**: `https://mztourismqatar.qa/api/health`
  - Returns HTTP 200 `healthy` when Supabase and server services are operating normally.
  - Returns live database query latency in milliseconds.
  - Safe for external uptime monitors (UptimeRobot, BetterUptime, Pingdom). Zero secrets or credentials are disclosed.
- **Automated Verification Script**:
  Run this at any time in terminal to verify all 165 platform security controls:
  ```bash
  npm run test:security
  ```
