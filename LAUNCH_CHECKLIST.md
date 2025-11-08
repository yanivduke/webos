# WebOS Launch Checklist

Complete guide to launching WebOS, setting up fundraising, and promoting to tech communities.

## Phase 1: Setup Funding Accounts (30 minutes)

### Step 1: Buy Me a Coffee (5 minutes)
- [ ] Go to https://buymeacoffee.com/signup
- [ ] Sign up with email or GitHub
- [ ] Choose username (suggestion: `webos` or `webos-dev`)
- [ ] Set up profile:
  - Title: "WebOS - Amiga Workbench for the Web"
  - Description: "Building authentic retro computing experiences"
  - Add avatar (use Amiga logo or screenshot)
- [ ] Copy your username for later

### Step 2: Ko-fi (5 minutes)
- [ ] Go to https://ko-fi.com/signup
- [ ] Sign up with email or Google
- [ ] Choose username (match with BMC if possible)
- [ ] Set up page:
  - Display name: "WebOS"
  - Short bio: "Recreating the classic Amiga Workbench in your browser"
  - Add gallery images (screenshots of WebOS)
- [ ] Copy your username

### Step 3: GitHub Sponsors (10 minutes)
- [ ] Go to https://github.com/sponsors
- [ ] Click "Join the waitlist" or "Set up GitHub Sponsors"
- [ ] Complete profile (if approved):
  - About: Talk about WebOS and retro computing passion
  - Sponsorship tiers:
    - $3/month - "Coffee Tier" (Supporter badge)
    - $10/month - "Contributor Tier" (Name in credits)
    - $25/month - "Patron Tier" (Vote on features)
- [ ] Note: May take 1-7 days for approval
- [ ] Copy your GitHub username

### Step 4: Patreon (Optional - 10 minutes)
- [ ] Go to https://patreon.com
- [ ] Create page
- [ ] Set up tiers similar to GitHub Sponsors
- [ ] Copy your username

## Phase 2: Update Project Files (10 minutes)

### Update Funding Links

Replace `YOUR_USERNAME` with your actual usernames in these files:

#### File 1: `.github/FUNDING.yml`
```yaml
# Example with usernames filled in:
github: your-github-username
patreon: your-patreon-username
ko_fi: your-kofi-username
buy_me_a_coffee: your-buymeacoffee-username
```

#### File 2: `README.md` (4 locations)
- Line 21: Buy Me a Coffee badge
- Line 22: Ko-fi badge
- Line 23: GitHub Sponsors badge
- Line 24: Patreon badge

#### File 3: `src/client/components/AmigaDesktop.vue` (Line 133)
```vue
<a href="https://buymeacoffee.com/YOUR_ACTUAL_USERNAME" target="_blank" ...>
```

### Commit Changes
```bash
git add .github/FUNDING.yml README.md src/client/components/AmigaDesktop.vue
git commit -m "Update funding links with actual usernames"
git push
```

## Phase 3: Deploy to Vercel (15 minutes)

### Option A: Via Vercel Dashboard (Recommended)

1. **Visit Vercel**
   - [ ] Go to https://vercel.com/signup
   - [ ] Sign up with GitHub (recommended for auto-deploy)

2. **Import Project**
   - [ ] Click "Add New" → "Project"
   - [ ] Select "Import Git Repository"
   - [ ] Authorize Vercel to access GitHub
   - [ ] Find and select `webos` repository

3. **Configure Project**
   - [ ] Project Name: `webos` (or custom)
   - [ ] Framework Preset: Other (vercel.json will handle it)
   - [ ] Root Directory: `./` (leave as root)
   - [ ] Build Settings: Leave default (uses vercel.json)
   - [ ] Environment Variables: None needed for now

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait 2-5 minutes for build
   - [ ] Watch build logs for any errors
   - [ ] Click on deployment URL when ready

5. **Test Deployment**
   - [ ] Visit your Vercel URL (e.g., `webos-abc123.vercel.app`)
   - [ ] Test opening windows (Workbench, RAM Disk)
   - [ ] Test NotePad app
   - [ ] Test Paint app
   - [ ] Test Calculator
   - [ ] Test Shell
   - [ ] Check browser console for errors
   - [ ] Test on mobile device

6. **Copy Your Live URL**
   - [ ] Copy the Vercel URL (e.g., `https://webos-abc123.vercel.app`)
   - [ ] Update `README.md` line 43:
     ```markdown
     🚀 **[Try WebOS Live](https://your-actual-vercel-url.vercel.app)**
     ```
   - [ ] Commit and push:
     ```bash
     git add README.md
     git commit -m "Add live demo URL"
     git push
     ```

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
cd /path/to/webos
vercel

# Follow prompts, then deploy to production
vercel --prod
```

## Phase 4: Optional Enhancements (15 minutes)

### Add Custom Domain (If you have one)
- [ ] Go to Vercel Dashboard → Your Project → Settings → Domains
- [ ] Add domain (e.g., `webos.yourdomain.com`)
- [ ] Update DNS records as instructed
- [ ] Wait for SSL certificate (automatic)

### Enable Vercel Analytics (Free)
- [ ] Go to Project Settings → Analytics
- [ ] Enable Web Analytics (free tier)
- [ ] Track visitors and performance

### Add Screenshot to README
- [ ] Take high-quality screenshot of WebOS
- [ ] Use tool: Cmd/Ctrl + Shift + 4 (Mac), Snipping Tool (Windows)
- [ ] Upload to `docs/images/screenshot.png`
- [ ] Add to README after title:
  ```markdown
  ![WebOS Screenshot](docs/images/screenshot.png)
  ```

## Phase 5: Launch Promotion (60+ minutes)

### Immediate Launches (Day 1)

#### Hacker News (Morning PST - best time)
- [ ] Go to https://news.ycombinator.com/submit
- [ ] Use template from `PROMOTION_TEMPLATES.md`
- [ ] Post between 7-9 AM PST for best visibility
- [ ] Monitor comments and respond professionally

#### Reddit (Multiple subreddits)
- [ ] r/amiga - Use retro-focused template
- [ ] r/retrobattlestations - Include screenshot
- [ ] r/webdev - Technical focus
- [ ] r/vue - Vue 3 technical details
- [ ] r/programming - If HN goes well, cross-post
- [ ] Follow subreddit rules (some require approval)

#### Twitter/X
- [ ] Post with screenshot
- [ ] Use hashtags: #Amiga #RetroComputing #WebDev #Vue3 #OpenSource
- [ ] Tag influential retro computing accounts
- [ ] Share live demo link

#### Product Hunt (Launch day strategy)
- [ ] Schedule for weekday (Tue-Thu best)
- [ ] Post early (12:01 AM PST for full day)
- [ ] Use template from `PROMOTION_TEMPLATES.md`
- [ ] Add 3-5 screenshots/GIFs
- [ ] Engage with comments throughout day
- [ ] Ask friends to upvote/comment

### Community Posts (Week 1)

#### Retro Computing Forums
- [ ] Amiga.org Forums - https://forum.amiga.org/
- [ ] English Amiga Board - https://eab.abime.net/
- [ ] Lemon Amiga - https://www.lemonamiga.com/
- [ ] AtariAge Forums - https://atariage.com/forums/

#### Developer Communities
- [ ] DEV.to - Write technical article (see template)
- [ ] Hashnode - Cross-post or unique content
- [ ] Indie Hackers - Share journey + fundraising
- [ ] Echo JS - https://echojs.com/

#### Social Media
- [ ] Mastodon (tech instances)
- [ ] BlueSky
- [ ] LinkedIn (professional angle)
- [ ] Discord servers (webdev, retro computing)

### Content Creation (Ongoing)

#### Blog Posts / Articles
- [ ] "Building a WebAssembly-Powered Amiga OS in Vue 3"
- [ ] "Recreating 1980s UI: Pixel-Perfect Amiga Aesthetics"
- [ ] "Why Retro Computing Still Matters in 2025"
- [ ] "Technical Deep-Dive: AWML SDK Architecture"

#### Video Content (If comfortable)
- [ ] Screen recording demo on YouTube
- [ ] 60-second TikTok/Instagram Reel
- [ ] Tweet video with highlights

## Phase 6: Monitor & Engage (Ongoing)

### Daily Monitoring
- [ ] Check GitHub stars (measure interest)
- [ ] Respond to comments on all platforms
- [ ] Answer questions professionally
- [ ] Thank people for support
- [ ] Monitor Vercel analytics

### Track Metrics
- [ ] GitHub stars: _____
- [ ] Live demo visits: _____
- [ ] Donations received: $____
- [ ] Community members: _____

### Engage with Community
- [ ] Respond to issues on GitHub
- [ ] Accept pull requests
- [ ] Feature user-created AWML apps
- [ ] Share community contributions

## Phase 7: Iterate & Improve

### Based on Feedback
- [ ] Prioritize requested features
- [ ] Fix reported bugs
- [ ] Improve documentation
- [ ] Add examples and tutorials

### Funding Goals
- [ ] Set visible goal (e.g., "$50/month for hosting")
- [ ] Update supporters with progress
- [ ] Thank donors publicly (if they consent)
- [ ] Share roadmap for funded features

## Success Metrics

### Week 1 Goals
- [ ] 100+ GitHub stars
- [ ] 1000+ demo visits
- [ ] Posted to 5+ platforms
- [ ] First donation received

### Month 1 Goals
- [ ] 500+ GitHub stars
- [ ] 10,000+ demo visits
- [ ] $25+/month recurring support
- [ ] Active community discussions

### Month 3 Goals
- [ ] 1000+ GitHub stars
- [ ] Featured on major tech blog
- [ ] $100+/month recurring support
- [ ] Community contributions (PRs, AWML apps)

## Troubleshooting

### Deployment Issues
- See `DEPLOYMENT.md` troubleshooting section
- Check Vercel build logs
- Test locally first

### Low Engagement
- Improve screenshots/demo
- Post at optimal times
- Engage more in communities
- Create video content

### No Donations
- Make value proposition clearer
- Add more visible support CTAs
- Share development updates
- Build trust with consistency

## Resources

- DEPLOYMENT.md - Technical deployment guide
- PROMOTION_TEMPLATES.md - Ready-to-use post templates
- README.md - Project overview
- GitHub Issues - Community feedback

---

**Remember:** Building a community takes time. Be consistent, be helpful, and be authentic about your passion for retro computing. The Amiga community is passionate and supportive!

Good luck with your launch! 🚀
