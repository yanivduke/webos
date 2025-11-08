# Analytics & Tracking Setup for Fundraising

Track your fundraising funnel: visitors → stars → sponsors.

---

## 🎯 What to Track

### Primary Metrics
1. **Demo page visitors** - Total traffic
2. **GitHub stars** - Social proof
3. **Sponsor conversions** - $$$
4. **README views** - Funding section exposure
5. **Referral sources** - Which marketing works

### Conversion Funnel
```
100 Visitors
  ↓ 20% star the repo
20 GitHub Stars
  ↓ 5% click sponsor link
1 Visit to GitHub Sponsors
  ↓ 30% convert
0.3 New Sponsors
```

**Goal**: Optimize each step!

---

## 📊 Option 1: Plausible Analytics (Privacy-Friendly, Recommended)

### Why Plausible?
- ✅ Privacy-friendly (no cookies, GDPR compliant)
- ✅ Lightweight (<1KB script)
- ✅ Simple dashboard
- ✅ Free for hobby projects
- ✅ No cookie banners needed

### Setup

**1. Create Account**
```
Visit: https://plausible.io
Sign up for Community Edition (self-hosted, free)
Or use cloud: $9/month (worth it for fundraising)
```

**2. Add Script to HTML**
```html
<!-- src/client/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WebOS - Amiga Workbench for the Web</title>

    <!-- Plausible Analytics -->
    <script defer data-domain="your-domain.vercel.app" src="https://plausible.io/js/script.js"></script>

    <!-- Optional: Track outbound links (GitHub Sponsors, Ko-fi) -->
    <script defer data-domain="your-domain.vercel.app" src="https://plausible.io/js/script.outbound-links.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**3. Track Custom Events**
```typescript
// src/client/utils/analytics.ts
export function trackEvent(eventName: string, props?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props });
  }
}

// Usage examples:
trackEvent('Sponsor Click', { tier: 'gold' });
trackEvent('Demo Interaction', { action: 'opened-window' });
trackEvent('File Operation', { operation: 'create' });
```

**4. Track Sponsor Link Clicks**
```typescript
// In AmigaDesktop.vue or wherever you show sponsor links
import { trackEvent } from '@/utils/analytics';

const handleSponsorClick = (tier: string) => {
  trackEvent('Sponsor Link Click', { tier });
  // Then open link
};
```

**5. Dashboard**
- Visit https://plausible.io/your-domain.vercel.app
- See visitors, pages, goals, sources

---

## 📈 Option 2: Google Analytics 4 (Most Popular)

### Setup

**1. Create GA4 Property**
```
Visit: https://analytics.google.com
Create account → Property → Data stream
Get Measurement ID: G-XXXXXXXXXX
```

**2. Add to HTML**
```html
<!-- src/client/index.html -->
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

**3. Track Events**
```typescript
// src/client/utils/analytics.ts
export function trackEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// Usage:
trackEvent('sponsor_click', { tier: 'gold', location: 'readme' });
trackEvent('star_click', { source: 'header' });
```

**4. Set Up Goals**
In GA4 Admin → Events → Create Event:
- `sponsor_click` (when sponsor link clicked)
- `star_click` (when GitHub star clicked)
- `demo_interaction` (when user interacts with demo)

**5. Create Conversion Funnel**
```
Page View → README View → Sponsor Click → Conversion
```

---

## 🔍 Option 3: GitHub Insights (Built-in, Free)

### What You Get
- README views (Insights → Traffic)
- Unique visitors
- Referral sources
- Popular content

### How to Access
```
https://github.com/yanivduke/webos/graphs/traffic
```

### Track Stars Over Time
```
https://github.com/yanivduke/webos/stargazers
```

### Track Referrals
```
https://github.com/yanivduke/webos/graphs/traffic
```

**Note**: Data only kept for 14 days! Screenshot weekly.

---

## 💰 Track Sponsor Conversions

### GitHub Sponsors Insights

**1. Access Sponsor Dashboard**
```
https://github.com/sponsors/yanivduke/dashboard
```

**2. Track Metrics**
- Active sponsors
- Monthly recurring revenue (MRR)
- Tier distribution
- Churn rate
- New vs. returning

**3. Export Data**
```
Dashboard → Analytics → Export CSV
```

### Create Tracking Sheet

**Google Sheets Template:**
| Date | Stars | Sponsors | MRR | One-Time | Total | Notes |
|------|-------|----------|-----|----------|-------|-------|
| 11/8 | 100 | 0 | $0 | $0 | $0 | Launch |
| 11/15 | 150 | 3 | $15 | $10 | $25 | HN post |
| 11/22 | 200 | 7 | $45 | $30 | $75 | PH launch |

**Formula for MRR Growth:**
```
= (This Week MRR - Last Week MRR) / Last Week MRR * 100
```

---

## 🎨 Custom Event Tracking

### Important Events to Track

**1. Sponsor Link Clicks**
```typescript
// When user clicks GitHub Sponsors link
trackEvent('sponsor_link_click', {
  source: 'readme',  // or 'website', 'footer', etc.
  tier: 'unknown',   // if clicking general link
  timestamp: new Date().toISOString()
});
```

**2. README Funding Section Views**
```typescript
// Use intersection observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      trackEvent('funding_section_view');
    }
  });
});

// Observe funding section
const fundingSection = document.getElementById('funding');
if (fundingSection) observer.observe(fundingSection);
```

**3. Demo Interactions**
```typescript
// Track meaningful interactions
trackEvent('demo_interaction', {
  action: 'window_opened',
  app: 'notepad'
});

trackEvent('demo_interaction', {
  action: 'file_created',
  filetype: 'txt'
});
```

**4. Social Shares**
```typescript
// When user clicks share button
trackEvent('share', {
  platform: 'twitter',
  content: 'project_link'
});
```

---

## 📱 UTM Tracking for Marketing

### What Are UTM Parameters?

URL tags that track where traffic comes from:
```
https://your-url.vercel.app?utm_source=twitter&utm_medium=social&utm_campaign=launch
```

### Create UTM Links

**Tool**: https://ga-dev-tools.web.app/campaign-url-builder/

**Examples:**

**Twitter Launch:**
```
https://your-url.vercel.app?utm_source=twitter&utm_medium=social&utm_campaign=launch&utm_content=thread
```

**Reddit r/amiga:**
```
https://your-url.vercel.app?utm_source=reddit&utm_medium=post&utm_campaign=launch&utm_content=amiga
```

**Hacker News:**
```
https://your-url.vercel.app?utm_source=hackernews&utm_medium=post&utm_campaign=launch
```

**Email Signature:**
```
https://your-url.vercel.app?utm_source=email&utm_medium=signature&utm_campaign=ongoing
```

### Track UTM in Analytics

Both Plausible and GA4 automatically track UTM parameters.

**In Plausible:**
```
Dashboard → Sources → See breakdown by campaign
```

**In GA4:**
```
Reports → Acquisition → Traffic acquisition
```

---

## 🎯 Conversion Tracking Setup

### Define Your Funnel

**Step 1: Visit Demo**
```typescript
// Automatic (pageview)
```

**Step 2: View Funding Info**
```typescript
// Track when funding section is viewed
trackEvent('Funding Section Viewed');
```

**Step 3: Click Sponsor Link**
```typescript
// Track outbound click
trackEvent('Sponsor Link Clicked', {
  destination: 'github_sponsors',
  tier: 'general'
});
```

**Step 4: Complete Sponsorship** (External)
```typescript
// Can't track directly, but can use GitHub Sponsors webhook
// Or manual tracking via dashboard
```

### Calculate Conversion Rate

```
Conversion Rate = (Sponsors / Demo Visitors) * 100
```

**Industry Benchmarks:**
- Open source projects: 0.1% - 0.5%
- With good pitch: 1% - 2%
- Exceptional: 5%+

**Target**: 1% conversion (1 sponsor per 100 visitors)

---

## 📊 Dashboard Setup

### Create Real-Time Dashboard

**Option 1: Notion Dashboard**
```
Create table with:
- Date
- Demo Visitors (from Plausible)
- GitHub Stars (from API)
- Sponsor Count (manual)
- MRR (manual)
- Goal Progress (formula)
```

**Option 2: Google Sheets**
```
Use Google Analytics Add-on to auto-pull data
Or manual entry weekly
```

**Option 3: Custom Dashboard**
```typescript
// Create simple dashboard in WebOS itself!
// Fetch data from APIs and display
```

### Metrics to Display

**Weekly:**
- Demo visitors
- Unique visitors
- GitHub stars (+/- change)
- Sponsor count (+/- change)
- MRR (+/- change)
- Conversion rate
- Top referral source

**Monthly:**
- Total raised
- Total expenses
- Net funding
- Goal progress %
- Churn rate
- Average sponsor value

---

## 🔔 Set Up Alerts

### GitHub Sponsors Notifications

**1. Email Alerts**
```
GitHub → Settings → Notifications → Sponsorships
✓ Email me when someone sponsors me
✓ Email me when someone upgrades/downgrades
✓ Email me when someone cancels
```

**2. Webhook (Advanced)**
```javascript
// Set up webhook to Slack/Discord
// When new sponsor: Celebrate! 🎉
```

### Traffic Spikes

**Plausible Spike Notifications:**
```
Settings → Email Reports
✓ Send spike notifications
Threshold: 2x normal traffic
```

**GA4 Alerts:**
```
Admin → Custom Alerts
Create alert for > 500 visitors/day
```

---

## 📈 A/B Testing (Advanced)

### Test Different Pitches

**Version A: Emotional**
```markdown
Help preserve Amiga computing history ❤️
Sponsor: [link]
```

**Version B: Practical**
```markdown
Fund new features ($2K goal)
Sponsor: [link]
```

**Track which converts better:**
```typescript
trackEvent('pitch_view', { version: 'A' });
trackEvent('sponsor_click', { version: 'A' });

// Calculate conversion per version
```

---

## 🚀 Quick Start (10 Minutes)

**1. Add Plausible** (5 min)
```html
<!-- src/client/index.html -->
<script defer data-domain="your-domain.vercel.app" src="https://plausible.io/js/script.outbound-links.js"></script>
```

**2. Create Tracking Sheet** (3 min)
```
Google Sheets with: Date, Visitors, Stars, Sponsors, MRR
```

**3. Set Up GitHub Notifications** (2 min)
```
GitHub Settings → Notifications → Enable sponsor emails
```

**Done!** You're now tracking your funnel.

---

## 📊 Weekly Reporting Template

**Every Monday:**

```markdown
## Week [X] Fundraising Report

### Metrics
- Demo visitors: [X] (+/- Y%)
- GitHub stars: [X] (+/- Y)
- New sponsors: [X]
- MRR: $[X] (+/- $Y)
- Conversion rate: [X]%

### Top Sources
1. [Source]: [X] visitors
2. [Source]: [X] visitors
3. [Source]: [X] visitors

### This Week's Activities
- Posted on [platform]
- Shipped [feature]
- Reached out to [number] potential sponsors

### Next Week Plan
- [ ] Post on [platform]
- [ ] Ship [feature]
- [ ] Contact [target]

### Learnings
- What worked: [insight]
- What didn't: [insight]
- To try next: [idea]
```

**Share publicly** on Twitter/GitHub Discussions = builds trust!

---

## 🎯 Advanced: API Integrations

### GitHub Stars API

```typescript
// Fetch current stars
const response = await fetch('https://api.github.com/repos/yanivduke/webos');
const data = await response.json();
const stars = data.stargazers_count;
```

### GitHub Sponsors API (Requires GraphQL)

```graphql
query {
  viewer {
    sponsors(first: 100) {
      totalCount
      edges {
        node {
          ... on User {
            login
            name
          }
          ... on Organization {
            login
            name
          }
        }
      }
    }
    sponsorshipsAsMaintainer(first: 100) {
      totalCount
    }
  }
}
```

---

## ✅ Checklist

### Initial Setup
- [ ] Add analytics script to HTML
- [ ] Create tracking spreadsheet
- [ ] Enable GitHub notifications
- [ ] Set up UTM links for marketing
- [ ] Test event tracking

### Ongoing (Weekly)
- [ ] Check dashboard
- [ ] Update tracking sheet
- [ ] Screenshot GitHub Insights
- [ ] Calculate conversion rates
- [ ] Adjust strategy based on data

### Monthly
- [ ] Review all metrics
- [ ] Identify top channels
- [ ] Double down on what works
- [ ] Cut what doesn't
- [ ] Share transparent report

---

**Next Steps**: Deploy your demo ([QUICK_DEPLOY.md](QUICK_DEPLOY.md)), add analytics, start tracking!
