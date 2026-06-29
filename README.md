# Leviathan 🌊
**Build Android Apps From The Browser — Free Forever**

> By Dev Noctky | Zero Cost | No Login | No Registration

---

## ✨ What It Is

Leviathan is a cloud platform that converts **websites, PWAs, GitHub repos, ZIP files, Flutter projects** into Android APKs — entirely from your browser, powered by **GitHub Actions** as the build engine.

**Everything runs on free tiers. Forever.**

---

## 🆓 Cost Breakdown

| Service | Cost | What it does |
|---------|------|-------------|
| Vercel Hobby | **$0/month** | Hosts the Next.js app |
| Supabase Free | **$0/month** | Stores build metadata |
| GitHub Free | **$0/month** | Runs the actual builds |
| **Total** | **$0/month** | |

> GitHub Actions on **public repos = unlimited free minutes**. This is the core of how Leviathan stays free.

---

## 🚀 Quick Deploy

See **[SETUP_FREE.md](./SETUP_FREE.md)** for the complete 30-minute step-by-step guide.

```bash
# 1. Clone
git clone <your-repo>
cd leviathan

# 2. Configure
cp .env.example .env.local
# Fill in Supabase + GitHub credentials

# 3. Deploy
npm i -g vercel && vercel --prod

# 4. Set env vars in Vercel Dashboard
# 5. Done! 🎉
```

---

## 🏗️ How Builds Work (Free Tier Flow)

```
User: "Build my website as APK"
         │
         ▼
[Leviathan API] validates input
         │
         ▼
[Supabase] creates build record
         │
         ▼
[GitHub API] creates temp PUBLIC repo
         │  (public = unlimited free Actions minutes)
         ▼
[GitHub API] pushes Android project files + workflow
         │
         ▼
[GitHub Actions] runs ubuntu-latest runner (FREE)
         │  gradle assembleDebug
         ▼
[GitHub Artifacts] APK stored for 1 day (FREE)
         │
         ▼
[User] downloads APK via /api/download/:id
         │
         ▼
[Cleanup] temp repo deleted automatically
```

---

## 🔒 Security

- Rate limiting: 60 req/min, 3 builds/5min per IP (in-memory, no Redis needed)
- DDoS: attack pattern detection, auto IP banning
- Input validation: Zod schemas on all API inputs
- GitHub token: server-side only, never exposed to client
- CSP + HSTS headers on every response
- AES-256-GCM encryption for sensitive data at rest

---

## 📄 License
MIT © Dev Noctky — Free to use, free to deploy, free forever.
