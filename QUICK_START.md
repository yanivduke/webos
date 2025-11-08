# WebOS Quick Start Guide

Get WebOS live and start fundraising in 30 minutes. Everything you need is ready!

## ⚡ 30-Minute Launch Plan

### Step 1: Deploy to Vercel (10 minutes)

**Option A: One-Click Deploy (Easiest)**
1. Visit: https://vercel.com/new
2. Sign in with GitHub
3. Click "Import Git Repository"
4. Select `yanivduke/webos`
5. Click "Deploy"
6. ✅ **Done!** Copy your URL: `https://webos-xxxxx.vercel.app`

**Option B: Use Deploy Button**
1. Go to your GitHub repo
2. Click the "Deploy with Vercel" button in README
3. Follow Vercel prompts

**What happens:**
- Vercel reads `vercel.json` configuration
- Builds client with `npm run build`
- Deploys serverless API
- Gives you HTTPS URL automatically

### Step 2: Set Up Funding (10 minutes)

**Create Accounts:**
1. **Buy Me a Coffee** (5 min)
   - https://buymeacoffee.com/signup
   - Choose username: `webos` or similar
   - Copy your username

2. **Ko-fi** (5 min)
   - https://ko-fi.com/signup
   - Choose username: match with Buy Me a Coffee
   - Copy your username

**Update 3 Files:**

Replace `YOUR_USERNAME` with your actual usernames:

```bash
# File 1: .github/FUNDING.yml
# Line with buy_me_a_coffee: your-username
# Line with ko_fi: your-username

# File 2: README.md
# Lines 21-24 (all badge URLs)

# File 3: src/client/components/AmigaDesktop.vue
# Line 133 (footer support link)
```

**Quick Update:**
```bash
# Search and replace (macOS/Linux)
find . -type f \( -name "FUNDING.yml" -o -name "README.md" -o -name "AmigaDesktop.vue" \) \
  -exec sed -i '' 's/YOUR_USERNAME/your-actual-username/g' {} +

# Or manually edit the 3 files
```

### Step 3: Update Live Demo URL (5 minutes)

After Vercel deployment completes:

```bash
# Edit README.md line 43
# Replace: https://your-deployment-url.vercel.app
# With: https://your-actual-vercel-url.vercel.app

git add .
git commit -m "Update funding links and live demo URL"
git push
```

### Step 4: Launch on Hacker News (5 minutes)

1. Go to: https://news.ycombinator.com/submit
2. **Title:** `Show HN: WebOS – Pixel-perfect Amiga Workbench 3.1 in your browser`
3. **URL:** Your Vercel URL
4. **Text:** (Copy from `PROMOTION_TEMPLATES.md` → Hacker News section)
5. **Best time:** 7-9 AM PST on weekdays

---

## 📋 Files You Need to Edit

### Required Updates:

| File | What to Change | Line Numbers |
|------|---------------|--------------|
| `.github/FUNDING.yml` | Add your funding usernames | Throughout |
| `README.md` | Update badge URLs | 21-24 |
| `README.md` | Update live demo URL | 43 |
| `src/client/components/AmigaDesktop.vue` | Update support link | 133 |

### Example:

**Before:**
```yaml
# .github/FUNDING.yml
buy_me_a_coffee: YOUR_USERNAME
ko_fi: YOUR_USERNAME
```

**After:**
```yaml
# .github/FUNDING.yml
buy_me_a_coffee: webos
ko_fi: webos
```

---

## 🚀 First Day Launch Checklist

- [ ] **Deploy to Vercel** (get live URL)
- [ ] **Update funding links** (3 files)
- [ ] **Update live demo URL** (README.md)
- [ ] **Commit and push** changes
- [ ] **Post to Hacker News** (7-9 AM PST)
- [ ] **Post to Reddit** r/amiga
- [ ] **Tweet launch** with screenshot
- [ ] **Monitor comments** (respond within 2 hours)

---

## 📢 Ready-to-Use Content

All templates are in **`PROMOTION_TEMPLATES.md`**:

- ✅ Hacker News "Show HN" post
- ✅ Reddit posts (5+ subreddits)
- ✅ Twitter thread
- ✅ Product Hunt description
- ✅ DEV.to article
- ✅ Indie Hackers post
- ✅ Email templates
- ✅ Social media captions

**Just copy, customize with your URL, and post!**

---

## 🎯 Week 1 Goals

- [ ] 100+ GitHub stars
- [ ] 1,000+ demo visits
- [ ] Posted to 5+ platforms
- [ ] First donation received
- [ ] Active discussions in comments

---

## 🔗 Important Links

**Your Resources:**
- Complete Launch Guide: `LAUNCH_CHECKLIST.md`
- All Post Templates: `PROMOTION_TEMPLATES.md`
- Technical Deployment: `DEPLOYMENT.md`
- Project README: `README.md`

**External Platforms:**
- Vercel Deploy: https://vercel.com/new
- Buy Me a Coffee: https://buymeacoffee.com/signup
- Ko-fi: https://ko-fi.com/signup
- GitHub Sponsors: https://github.com/sponsors
- Hacker News Submit: https://news.ycombinator.com/submit
- Product Hunt: https://producthunt.com

---

## 💡 Pro Tips

1. **Deploy first, promote second** - Don't promote without a live URL
2. **Test before launching** - Visit your Vercel URL and test all apps
3. **Post in morning PST** - Best time for Hacker News visibility
4. **Respond quickly** - First 2 hours are critical for engagement
5. **Be authentic** - Share your genuine passion for retro computing

---

## ⚠️ Before You Launch

**Pre-flight Checklist:**
- [ ] Vercel deployment successful
- [ ] Live demo URL works
- [ ] All apps functional (NotePad, Paint, Calculator, Shell, Clock)
- [ ] No console errors in browser
- [ ] Mobile responsive (test on phone)
- [ ] Funding links updated
- [ ] GitHub repo description updated
- [ ] Screenshot ready for social media

---

## 🆘 Quick Troubleshooting

**Vercel build fails?**
- Check build logs in Vercel dashboard
- Verify `vercel.json` is correct
- Test locally: `cd src/client && npm run build`

**Funding buttons don't show?**
- Verify `.github/FUNDING.yml` syntax
- Check usernames are valid
- Wait 5 minutes for GitHub to process

**Low engagement?**
- Post at better times (7-9 AM PST)
- Improve screenshot quality
- Engage in comments more actively

---

## 🎉 You're Ready!

Everything is configured and ready to launch:

✅ Vercel deployment config (`vercel.json`)
✅ Serverless API wrapper (`api/server.js`)
✅ Funding buttons (`.github/FUNDING.yml`)
✅ README badges and deploy button
✅ In-app support link
✅ Complete documentation
✅ 15+ platform templates

**Next action:** Deploy to Vercel → https://vercel.com/new

**Questions?** Check `LAUNCH_CHECKLIST.md` for detailed guidance.

Good luck! 🚀
