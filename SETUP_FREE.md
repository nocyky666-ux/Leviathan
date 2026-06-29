# 🆓 Leviathan — Free Forever Setup Guide

Deploy Leviathan with **zero cost**, **no credit card**, no expiry.

---

## ✅ Free Services Used

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Vercel Hobby** | Free forever | 100GB bandwidth/mo |
| **Supabase** | Free forever | 500MB DB, 2 projects |
| **GitHub Free** | Free forever | ∞ Actions min (public repos) |
| **No Redis** | In-memory rate limiting | Resets on cold start |
| **No S3/R2** | Artifacts stored in GitHub | Kept 1 day (auto-delete) |

---

## 🚀 Step-by-Step Deploy (30 minutes total)

### STEP 1 — Fork / Clone

```bash
# Option A: Clone directly
git clone https://github.com/your-username/leviathan
cd leviathan

# Option B: Upload to a new GitHub repo
# (required so Vercel can deploy it)
```

### STEP 2 — Create Supabase Project (Free)

1. Go to **https://supabase.com** → Sign Up (free)
2. Click **"New Project"** → pick a name, set a password, choose a region
3. Wait ~2 minutes for provisioning
4. Go to **SQL Editor** (left sidebar)
5. Paste the entire contents of **`supabase/schema.sql`** → click **Run**
6. *(Optional but recommended)*: Go to **Extensions** → enable **`pg_cron`** → then uncomment the `cron.schedule` block in the schema and run it again to enable hourly cleanup

Collect your credentials:
- **Settings → API** → copy `Project URL` and `anon public` key and `service_role secret` key

### STEP 3 — Create GitHub Personal Access Token (Free)

1. GitHub.com → **Settings** → **Developer Settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. Settings:
   - **Token name**: `Leviathan Build Bot`
   - **Expiration**: `No expiration` ← important for "free forever"
   - **Repository access**: `All repositories` (or specific)
   - **Permissions**:
     - `Contents` → Read & Write
     - `Actions` → Read & Write
     - `Administration` → Read & Write (needed for repo create/delete)
3. Click **Generate token** → copy it (shown once!)

> ℹ️ Builds use **public repos** by default → unlimited free GitHub Actions minutes.
> Set `USE_PUBLIC_REPOS=false` in .env only if you want private builds (uses 2000 min/month quota).

### STEP 4 — Generate Security Secrets (Free)

Run these commands in your terminal:

```bash
# APP_SECRET (min 32 chars)
openssl rand -base64 32

# ENCRYPTION_KEY (64 hex chars = 32 bytes)
openssl rand -hex 32

# WEBHOOK_SECRET
openssl rand -base64 32
```

Save all three outputs — you'll need them in the next step.

### STEP 5 — Deploy to Vercel (Free)

**Option A: Deploy via Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Deploy via GitHub (easier)**
1. Push your code to GitHub
2. Go to **https://vercel.com** → New Project → Import from GitHub
3. Select your repo → click **Deploy**

### STEP 6 — Set Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add each variable:

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY       = eyJ...your-service-role-key...

GITHUB_TOKEN                    = ghp_...your-pat...
GITHUB_OWNER                    = your-github-username

APP_SECRET                      = (output from openssl rand -base64 32)
ENCRYPTION_KEY                  = (output from openssl rand -hex 32)
WEBHOOK_SECRET                  = (output from openssl rand -base64 32)

NEXT_PUBLIC_APP_URL             = https://your-project.vercel.app
USE_PUBLIC_REPOS                = true
REPO_TTL_HOURS                  = 1
MAX_UPLOAD_SIZE                 = 52428800
BUILD_TIMEOUT_MS                = 1500000
```

Click **Save** for each one.

### STEP 7 — Redeploy

After setting env vars:
```bash
vercel --prod
# or in Vercel Dashboard → Deployments → Redeploy
```

### STEP 8 — Done! 🎉

Your Leviathan instance is live at your Vercel URL.

---

## 📊 Free Tier Limits & How We Handle Them

### Vercel Hobby (Free)
| Limit | Value | How Leviathan handles it |
|-------|-------|--------------------------|
| Function timeout | 30s | Build API returns immediately (async), never blocks |
| Bandwidth | 100GB/mo | APKs proxied once then deleted |
| Deployments | Unlimited | ✅ |
| Edge middleware | Included | ✅ Used for rate limiting |

### Supabase Free
| Limit | Value | How Leviathan handles it |
|-------|-------|--------------------------|
| Database | 500MB | Auto-cleanup deletes builds after 24h |
| Bandwidth | 2GB/mo | Metadata only (small JSON rows) |
| API calls | Unlimited | ✅ |
| Realtime | 200 concurrent | ✅ Used for live build status |

### GitHub Free
| Limit | Value | How Leviathan handles it |
|-------|-------|--------------------------|
| Public repo Actions | **Unlimited** | ✅ All builds use public repos |
| Private repo Actions | 2,000 min/mo | N/A (public repos used by default) |
| Artifact retention | 1 day (public) | ✅ Download immediately, auto-delete |
| API rate limit | 5,000 req/hr | ~10 API calls per build — handles 500 builds/hr |

---

## 🔁 Keeping It Free Forever

| Task | Automated? | Action |
|------|-----------|--------|
| Temp repo cleanup | ✅ Auto | Deleted after download or 1 hour |
| Old build cleanup | ✅ Auto (pg_cron) | Deleted after 24 hours |
| GitHub PAT expiry | ❌ Manual | Set token to "No expiration" |
| Supabase project | ✅ Free forever | No action needed |
| Vercel deployment | ✅ Free forever | No action needed |

> ⚠️ The only thing that needs attention: your **GitHub PAT** expiration date.
> Set it to **"No expiration"** when creating it for true set-and-forget operation.

---

## ❓ FAQ

**Q: What if I exceed Supabase 500MB?**
A: Enable pg_cron cleanup in the schema. Each build row is ~2KB, so 500MB = 250,000 builds. You'll never hit this.

**Q: What if GitHub Actions minutes run out?**
A: They won't — public repos have unlimited free minutes. Only private repos have a 2,000 min/month limit.

**Q: Do users need a GitHub account?**
A: No! Only YOU (the deployer) need a GitHub account. Users just open the URL and build.

**Q: How long are APKs available for download?**
A: GitHub keeps artifacts for 1 day on public repos (free). After the user downloads the APK, the temp repo is automatically deleted.

**Q: Can I use a custom domain?**
A: Yes — Vercel Hobby supports custom domains for free.

---

## 🛠️ Local Development

```bash
# Install deps
npm install

# Copy env
cp .env.example .env.local
# Fill in your values

# Run locally
npm run dev
# → http://localhost:3000
```

---

## 📄 License
MIT © Dev Noctky — Free forever, open source.
