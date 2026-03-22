# TechCare Pipeline

Lead management + AI reply system for TechCare IT Solutions.

---

## Stack
- React + Vite
- Supabase (database)
- Vercel (deployment)

---

## Setup Instructions

### Step 1 — Supabase: Create the leads table

1. Go to https://supabase.com → your `techcare-pipeline` project
2. Click **SQL Editor** → **New query**
3. Paste and run this SQL:

```sql
create table leads (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  email text,
  location text not null,
  use_case text,
  service text,
  stage text default 'First Contact',
  quote_date date,
  quote_amount numeric,
  dp_amount numeric,
  fu_count integer default 0,
  notes text,
  outcome text,
  created_at date default current_date,
  assignee text default 'Noriel',
  source text default 'Facebook',
  qual_checks boolean[] default array[false,false,false,false]
);

alter table leads enable row level security;

create policy "Allow all" on leads
  for all using (true) with check (true);
```

---

### Step 2 — Create your .env file

In the project root, create a file called `.env` (copy from `.env.example`):

```
VITE_SUPABASE_URL=https://yswqpwuqrtmlzkeejjue.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
```

> Get your Supabase anon key from: Project Settings → API → anon public
> Get your Anthropic API key from: console.anthropic.com → API Keys

---

### Step 3 — Add the TechCare logo

Copy `TechCare_Official_Logo.png` into the `/public` folder and rename it to `logo.png`.

---

### Step 4 — Install and run locally

Open VSCode terminal in the project folder:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

### Step 5 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — TechCare Pipeline v1"
git branch -M main
git remote add origin https://github.com/TechCareIT/techcare-pipeline.git
git push -u origin main
```

---

### Step 6 — Deploy to Vercel

1. Go to https://vercel.com → **New Project**
2. Import your `techcare-pipeline` GitHub repo
3. Add environment variables (same as your `.env` file):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_API_KEY`
4. Click **Deploy**

Done. Vercel gives you a live URL. Every `git push` auto-deploys.

---

## Project Structure

```
src/
  components/
    Sidebar.jsx     — lead list + stats
    Detail.jsx      — lead detail with tabs
    AIPanel.jsx     — AI reply generator + chat
    Modal.jsx       — create/edit/paste modal
  lib/
    supabase.js     — Supabase client
    constants.js    — stages, tones, use cases
    messages.js     — all message templates
    utils.js        — helpers
  App.jsx           — root layout + data
  main.jsx          — entry point
  index.css         — global styles + theme
```
