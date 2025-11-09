# Quick Deploy Guide - Get Your Live Demo Running in 10 Minutes

This guide helps you deploy WebOS to get a live demo URL for your fundraising campaign.

---

## 🚀 Option 1: Vercel (Recommended - FREE)

### Why Vercel?
- ✅ Free tier (perfect for demos)
- ✅ Automatic deployments
- ✅ Fast global CDN
- ✅ Custom domains
- ✅ Already configured (vercel.json exists)

### Steps

**1. Create Vercel Account**
```bash
# Visit https://vercel.com/signup
# Sign up with GitHub (easiest)
```

**2. Install Vercel CLI (Optional)**
```bash
npm install -g vercel
```

**3. Deploy via GitHub (Easiest)**

a. Go to https://vercel.com/new
b. Click "Import Git Repository"
c. Select your `webos` repository
d. Vercel auto-detects settings from `vercel.json`
e. Click "Deploy"
f. Wait 2-3 minutes
g. **Your live URL**: `https://webos-username.vercel.app`

**4. Or Deploy via CLI**
```bash
# From project root
cd /home/user/webos
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? webos
# - Directory? ./
# - Override settings? No

# Wait for deployment...
# URL will be shown: https://webos-username.vercel.app
```

**5. Set Up Production Domain**
```bash
vercel --prod

# This creates the production URL (not preview)
```

### Configuration Check

Your `vercel.json` is already set up:
```json
{
  "version": 2,
  "name": "webos",
  "buildCommand": "cd src/client && npm install && npm run build",
  "outputDirectory": "src/client/dist",
  ...
}
```

### Custom Domain (Optional)

1. Buy domain (Namecheap, Google Domains, etc.)
2. Go to Vercel dashboard → Project → Settings → Domains
3. Add domain: `webos.yourdomain.com`
4. Update DNS records as instructed
5. Wait for SSL certificate (automatic)

**Recommended domain**: `amiga.yourdomain.com` or `workbench.yourdomain.com`

---

## 🎯 Option 2: Netlify (Alternative - FREE)

### Steps

**1. Create Account**
- Visit https://netlify.com/signup
- Sign up with GitHub

**2. Create `netlify.toml`**
```bash
cat > netlify.toml << 'EOF'
[build]
  command = "cd src/client && npm install && npm run build && cd ../server && npm install"
  publish = "src/client/dist"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[functions]
  directory = "api"
EOF
```

**3. Deploy**
- Go to https://app.netlify.com/start
- Connect GitHub repository
- Click "Deploy site"
- Wait 2-3 minutes
- **Your live URL**: `https://webos-random.netlify.app`

**4. Custom Domain** (same process as Vercel)

---

## 🐳 Option 3: Railway (Good for Backend)

### Steps

**1. Create Account**
- Visit https://railway.app
- Sign up with GitHub

**2. Deploy**
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Init project
railway init

# Deploy
railway up

# Get URL
railway domain
```

**URL**: `https://webos.up.railway.app`

---

## ⚡ Option 4: Render (Full-Stack)

### Steps

**1. Create `render.yaml`**
```yaml
services:
  - type: web
    name: webos
    env: node
    buildCommand: cd src/client && npm install && npm run build && cd ../server && npm install
    startCommand: cd src/server && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

**2. Deploy**
- Go to https://render.com
- New → Web Service
- Connect GitHub
- Select repository
- Deploy

**URL**: `https://webos.onrender.com`

---

## 🎨 Option 5: GitHub Pages (Client Only)

Good for static demo, but no backend.

### Steps

**1. Build Client**
```bash
cd src/client
npm install
npm run build
```

**2. Deploy to GitHub Pages**
```bash
# Install gh-pages
npm install -g gh-pages

# Deploy
gh-pages -d src/client/dist
```

**URL**: `https://yourusername.github.io/webos`

**Note**: Backend features won't work (file operations, shell, etc.)

---

## 🔧 Post-Deployment Checklist

### 1. Update README.md
```markdown
## Live Demo

🚀 **[Try WebOS Live](https://your-actual-url.vercel.app)**
```

### 2. Update All Documentation
Replace `[your-url]` with actual URL in:
- [ ] FUNDING.md
- [ ] FUNDRAISING_CHECKLIST.md
- [ ] FUNDRAISING_LAUNCH_TEMPLATES.md
- [ ] PROMOTION_TEMPLATES.md
- [ ] SPONSOR_PITCH.md

### 3. Update Social Media
- [ ] Twitter bio
- [ ] GitHub profile
- [ ] LinkedIn

### 4. Test Everything
- [ ] Home page loads
- [ ] Windows drag/resize
- [ ] File operations work
- [ ] Applications open (NotePad, Paint, Calculator, Shell, Clock)
- [ ] Mobile responsive

### 5. Set Up Analytics (Optional)

**Google Analytics:**
```html
<!-- Add to src/client/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Plausible (Privacy-friendly):**
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Cannot find module`
```bash
# Ensure dependencies installed
cd src/client && npm install
cd ../server && npm install
```

**Error**: `Build timeout`
```bash
# Increase build timeout in vercel.json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Backend Not Working

**Check API routes:**
- Vercel: Serverless functions in `/api` directory
- Netlify: Functions in `/.netlify/functions`
- Railway/Render: Full Node.js server

**Vercel API Setup:**
```bash
# Move server routes to api directory
cp -r src/server/routes/* api/
```

### Environment Variables

**Set in Vercel:**
```bash
vercel env add NODE_ENV production
vercel env add DATABASE_URL your-db-url
```

**Set in Netlify:**
- Dashboard → Site Settings → Environment Variables

---

## 📊 Monitoring Your Demo

### Track These Metrics

**Vercel Analytics** (free):
- Go to Dashboard → Analytics
- See pageviews, unique visitors, top pages

**Custom Tracking:**
```javascript
// Add to src/client/main.ts
const trackVisit = () => {
  fetch('/api/analytics/visit', { method: 'POST' })
}
```

### Important URLs to Monitor

- Landing page: `/`
- Funding page link from README
- Demo interactions (window opens, file ops)

---

## 🚀 Production Optimization

### 1. Enable Caching
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Compress Assets
```bash
# Already handled by Vite build
npm run build
```

### 3. CDN for Static Assets
- Vercel/Netlify handle this automatically

---

## 💡 Pro Tips

1. **Use a custom domain** - Looks more professional for fundraising
2. **Enable HTTPS** - Automatic on Vercel/Netlify
3. **Set up status page** - updown.io or StatusCake (free tier)
4. **Monitor uptime** - Vercel has 99.99% SLA
5. **Create staging environment** - Deploy main branch to `staging.yoururl.com`

---

## ✅ You're Done!

Once deployed:

1. ✅ Update all documentation with live URL
2. ✅ Test the demo thoroughly
3. ✅ Share on social media
4. ✅ Add to GitHub Sponsors profile
5. ✅ Include in fundraising materials

**Your live demo is the #1 tool for converting visitors to sponsors.**

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Railway Docs**: https://docs.railway.app
- **Open an issue**: https://github.com/yanivduke/webos/issues

---

**Next Steps**: Go to [FUNDRAISING_CHECKLIST.md](FUNDRAISING_CHECKLIST.md) for your 30-day action plan!
