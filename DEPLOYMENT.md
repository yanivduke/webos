# WebOS Deployment Guide

This guide covers deploying WebOS to Vercel for a live demo with free hosting.

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account (to connect your repository)
- Vercel account (free at [vercel.com](https://vercel.com))
- Your repository pushed to GitHub

### Option 1: One-Click Deploy via Vercel Dashboard

1. **Push this repository to GitHub** (if not already done)

2. **Visit Vercel and Import**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub account
   - Select the `webos` repository

3. **Configure Project**
   - **Framework Preset**: Select "Other"
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Will use `vercel.json` configuration
   - **Output Directory**: Will use `vercel.json` configuration

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your WebOS will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd /path/to/webos
   vercel
   ```

4. **Follow Prompts**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (first time)
   - What's your project's name? `webos` (or custom name)
   - In which directory is your code located? `.` (root)

5. **Production Deploy**
   ```bash
   vercel --prod
   ```

## Configuration Files

The following files have been set up for Vercel deployment:

- **`vercel.json`** - Vercel configuration (build commands, rewrites, functions)
- **`api/server.js`** - Serverless function wrapper for Express API
- **`package.json`** - Root package.json with build scripts
- **`.vercelignore`** - Files to exclude from deployment

## Important Limitations on Vercel Free Tier

### Serverless Function Constraints

⚠️ **File System Writes Are NOT Persistent**
- Vercel serverless functions use ephemeral storage
- Any files written during execution are lost after the function completes
- This affects: NotePad saves, Paint drawings, shell file operations

**What This Means:**
- ✅ Reading files works (pre-bundled files)
- ✅ In-memory operations work (during single request)
- ❌ Persistent file saves don't work
- ❌ User-created files are lost

### Solutions for Persistence

**For Demo/Preview (Current Setup):**
- Use in-memory storage (data resets on each deployment)
- Acceptable for showcasing features
- Users understand it's a demo

**For Production with Persistence:**

1. **Vercel KV (Redis)** - For app state and settings
   ```bash
   vercel env add KV_REST_API_URL
   vercel env add KV_REST_API_TOKEN
   ```
   [Setup Guide](https://vercel.com/docs/storage/vercel-kv)

2. **Vercel Postgres** - For structured data
   ```bash
   vercel postgres create
   ```
   [Setup Guide](https://vercel.com/docs/storage/vercel-postgres)

3. **Vercel Blob** - For file storage (images, documents)
   ```bash
   npm install @vercel/blob
   ```
   [Setup Guide](https://vercel.com/docs/storage/vercel-blob)

4. **External Services**
   - Supabase (PostgreSQL + file storage)
   - MongoDB Atlas
   - AWS S3 for file storage
   - Firebase

### Other Limitations

- **Function Timeout**: 10 seconds (free tier), 60 seconds (Pro)
- **No WebSockets**: Use Vercel's Edge Functions or external service
- **Cold Starts**: First request may be slower (1-2 seconds)
- **Memory**: 1024 MB per function (configurable in `vercel.json`)

## Environment Variables

If you need environment variables (API keys, database URLs):

### Via Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. Add variables (e.g., `DATABASE_URL`, `API_KEY`)
3. Redeploy to apply

### Via CLI
```bash
vercel env add VARIABLE_NAME
```

## Custom Domain

### Add Custom Domain (Free on Vercel)

1. **Via Dashboard**
   - Project Settings → Domains
   - Add your domain (e.g., `webos.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Via CLI**
   ```bash
   vercel domains add webos.yourdomain.com
   ```

## Monitoring and Logs

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

### Real-time Logs
```bash
vercel logs --follow
```

### Via Dashboard
- Go to Deployments → Select deployment → View Logs

## Continuous Deployment

Once connected to GitHub, Vercel automatically:
- ✅ Deploys on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Runs build checks before deploying
- ✅ Provides unique URLs for each deployment

### Configure Branch Deployments
1. Project Settings → Git
2. Select production branch (default: `main`)
3. Enable/disable automatic deployments

## Testing Before Deployment

Always test locally first:

```bash
# Terminal 1 - Start server
cd src/server
npm install
npm start

# Terminal 2 - Start client
cd src/client
npm install
npm run dev
```

Visit http://localhost:3000 to verify everything works.

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Test build locally: `cd src/client && npm run build`

### API Endpoints Don't Work
- Check function logs: `vercel logs`
- Verify `api/server.js` is being deployed
- Check browser DevTools → Network tab for errors

### Missing Dependencies
- Add to `src/server/package.json` for server deps
- Add to `src/client/package.json` for client deps
- Redeploy after changes

### "Function timeout" Errors
- Optimize slow endpoints
- Upgrade to Pro plan (60s timeout)
- Move long-running tasks to external service

## Performance Optimization

### Enable Edge Caching
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
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

### Optimize Build Size
```bash
# Analyze bundle size
cd src/client
npm run build
npx vite-bundle-visualizer
```

## Alternative Deployment Options

If Vercel doesn't meet your needs:

### Netlify
- Similar to Vercel
- Better for JAMstack sites
- [Deploy Guide](https://docs.netlify.com/)

### Railway
- Better for full Node.js apps
- Persistent file system
- PostgreSQL included
- [Deploy Guide](https://docs.railway.app/)

### Render
- Free tier with persistent disk
- Better for traditional servers
- [Deploy Guide](https://render.com/docs)

### DigitalOcean App Platform
- Container-based deployment
- Persistent storage available
- [Deploy Guide](https://docs.digitalocean.com/products/app-platform/)

## Cost Estimates

### Vercel Free Tier (Hobby)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited projects
- ✅ Automatic SSL
- ✅ Custom domains
- ❌ No persistent storage
- ❌ 10s function timeout

### Vercel Pro ($20/month)
- ✅ 1 TB bandwidth
- ✅ 60s function timeout
- ✅ Team features
- ✅ Advanced analytics
- Add-ons: KV ($10/month), Postgres ($20/month)

## Post-Deployment Checklist

After successful deployment:

- [ ] Test all applications (NotePad, Paint, Calculator, Shell, Clock)
- [ ] Verify API endpoints work (`/api/health`, `/api/system/status`)
- [ ] Test file operations (note: won't persist, but should work)
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Add custom domain (optional)
- [ ] Set up analytics (Vercel Analytics or Google Analytics)
- [ ] Update README with live demo link
- [ ] Share on social media and tech communities

## Get Your Live URL

After deployment, update your README and funding pages:

1. Copy your Vercel URL (e.g., `https://webos-demo.vercel.app`)
2. Update README.md with live demo link
3. Add to GitHub repo description
4. Share in your funding posts!

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

For WebOS issues:
- [GitHub Issues](https://github.com/yanivduke/webos/issues)
