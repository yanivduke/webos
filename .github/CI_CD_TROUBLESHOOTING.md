# CI/CD Troubleshooting Guide

## Common Issues and Solutions

### 🔴 Client Build Failures

#### Issue: "npm ci" fails
```
Error: Cannot find module 'vite'
```

**Solution:**
```bash
cd src/client
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Why it happens:** Outdated or corrupted node_modules

**Prevention:** Always use `npm ci` in CI, `npm install` locally

---

#### Issue: TypeScript errors in CI but not locally
```
Error: Type 'string' is not assignable to type 'number'
```

**Solution:**
```bash
cd src/client
npm run type-check  # See actual errors
npx tsc --noEmit --pretty  # Detailed output
```

**Why it happens:**
- Local cache masking errors
- Different TypeScript versions
- Missing type definitions

**Prevention:** Run `npm run type-check` before committing

---

#### Issue: Vite build succeeds but errors not caught
```
Build completed but app crashes at runtime
```

**Solution:**
```bash
cd src/client
npm run build
npm run preview  # Test production build
```

**Why it happens:** Dev mode hides some errors

**Prevention:** Test production builds locally

---

### 🔴 Server Build Failures

#### Issue: "Cannot find module" in server
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd src/server
npm install
node index.js
```

**Why it happens:** Missing dependencies in package.json

**Prevention:** Always install dependencies after adding imports

---

#### Issue: Server build (tsc) fails
```
error TS2307: Cannot find module './routes/file-operations.route'
```

**Solution:**
```bash
cd src/server
# Check file exists
ls routes/

# Fix import path in index.js
# Should be: require('./routes/file-operations.route')
# Not: require('./routes/file-operations.route.ts')
```

**Why it happens:** Incorrect file paths, mixing .js and .ts

**Prevention:** Server uses CommonJS, check paths carefully

---

### 🔴 Merge Conflict Issues

#### Issue: Automatic merge conflict detection fails
```
merge-conflict-check: ❌ Failed
```

**Solution:**
```bash
# Locally simulate the merge
git fetch origin main
git merge --no-commit --no-ff origin/main

# See conflicting files
git status

# Fix conflicts
# ... edit files ...

git add .
git commit -m "Resolve merge conflicts"
git push
```

**Why it happens:** Changes in same files on both branches

**Prevention:** Keep feature branches up to date with target

---

#### Issue: False positive merge conflicts
```
Conflicts detected but files look fine
```

**Solution:**
```bash
# Clean workspace
git reset --hard HEAD
git clean -fd

# Pull latest
git fetch origin
git rebase origin/main
```

**Why it happens:** Stale local refs, whitespace differences

**Prevention:** Regular `git fetch` and clean workspace

---

### 🔴 Code Preservation Check Failures

#### Issue: Large deletions warning
```
⚠️ Warning: Large number of deletions detected (523 lines)
```

**Solution:**
1. Review what's being deleted:
   ```bash
   git diff origin/main...HEAD --stat
   git diff origin/main...HEAD | grep "^-" | wc -l
   ```

2. Verify deletions are intentional:
   - Refactoring? ✅ OK
   - Removing old code? ✅ OK
   - Accidental? ❌ Fix it!

3. Document in PR description:
   ```
   ## Large Deletions

   Removed legacy authentication system (500 lines)
   Replaced with new OAuth implementation
   ```

**Why it happens:** Large refactoring or accidental reverts

**Prevention:** Make incremental changes, review diffs before pushing

---

#### Issue: Files missing in source branch
```
⚠️ Files present in target but missing in source
src/client/components/OldComponent.vue
```

**Solution:**
1. Check if deletion was intentional:
   ```bash
   git log --all --full-history -- src/client/components/OldComponent.vue
   ```

2. If accidental, restore:
   ```bash
   git checkout origin/main -- src/client/components/OldComponent.vue
   git commit -m "Restore accidentally deleted component"
   ```

3. If intentional, document it

**Why it happens:** Files deleted in feature branch

**Prevention:** Always document file deletions in commits

---

### 🔴 Merge Simulation Failures

#### Issue: Merge simulation shows conflicts
```
❌ Merge simulation failed: conflicts detected
```

**Solution:**
```bash
# Fix conflicts locally first
git checkout your-feature-branch
git fetch origin main
git merge origin/main

# Resolve conflicts
# ... edit files ...

git add .
git commit -m "Merge main into feature"
git push
```

**Why it happens:** Divergent changes in same code

**Prevention:** Regularly merge/rebase from target branch

---

#### Issue: Merge simulation times out
```
Error: Process completed with exit code 124
```

**Solution:**
This is a CI infrastructure issue. Try:
1. Re-run the workflow
2. If persists, merge locally:
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff your-feature-branch
   git push origin main
   ```

**Why it happens:** CI resource limits, large diffs

**Prevention:** Keep PRs small and focused

---

### 🔴 Integration Test Failures

#### Issue: Build fails after merge simulation
```
integration-test: Client build failed in merged state
```

**Solution:**
```bash
# Test the merge locally
git checkout main
git pull origin main
git merge --no-commit your-feature-branch

# Try building
cd src/client && npm run build
cd ../server && npm run build

# If fails, see error and fix
git merge --abort  # Undo test merge
# Fix issues in your branch
```

**Why it happens:** Dependencies conflict, breaking changes

**Prevention:** Test merged state before pushing

---

### 🔴 Security Audit Failures

#### Issue: High severity vulnerabilities found
```
security-audit: found 5 high severity vulnerabilities
```

**Solution:**
```bash
cd src/client  # or src/server
npm audit
npm audit fix  # Try automatic fix
npm audit fix --force  # If automatic fix doesn't work

# Or update manually
npm update <package-name>
```

**Why it happens:** Outdated dependencies with known CVEs

**Prevention:** Regular `npm audit` and dependency updates

---

#### Issue: Audit fix breaks build
```
After npm audit fix, build fails
```

**Solution:**
```bash
# Revert
git checkout package.json package-lock.json

# Update one by one
npm update <vulnerable-package>
npm run build  # Test after each

# If package must stay outdated, document why
```

**Why it happens:** Breaking changes in dependency updates

**Prevention:** Test after dependency updates

---

### 🔴 GitHub Actions Workflow Issues

#### Issue: Workflow doesn't trigger
```
PR created but no checks running
```

**Solution:**
1. Check workflow file syntax:
   ```bash
   # Validate YAML
   cat .github/workflows/pr-validation.yml | yamllint -
   ```

2. Check branch patterns:
   ```yaml
   on:
     pull_request:
       branches:
         - main  # Must match your target branch
   ```

3. Push a trivial change:
   ```bash
   git commit --allow-empty -m "Trigger CI"
   git push
   ```

**Why it happens:** YAML syntax errors, branch mismatch

**Prevention:** Test workflows in feature branch first

---

#### Issue: Workflow permission denied
```
Error: Resource not accessible by integration
```

**Solution:**
1. Check repository settings:
   - Settings > Actions > General
   - Workflow permissions: "Read and write permissions"

2. Add permissions to workflow:
   ```yaml
   jobs:
     job-name:
       permissions:
         contents: read
         pull-requests: write
   ```

**Why it happens:** Restricted workflow permissions

**Prevention:** Configure permissions at repository level

---

#### Issue: Artifact upload fails
```
Error: Unable to upload artifact
```

**Solution:**
1. Check artifact size (max 10GB per repository)
2. Clean build before uploading:
   ```yaml
   - name: Upload artifacts
     uses: actions/upload-artifact@v4
     with:
       name: build
       path: |
         src/client/dist
         !src/client/dist/**/*.map  # Exclude source maps
   ```

**Why it happens:** Artifacts too large, permissions

**Prevention:** Exclude unnecessary files (maps, logs)

---

### 🔴 Branch Protection Issues

#### Issue: Can't merge even though checks pass
```
Merging is blocked
```

**Solution:**
1. Check required reviews:
   - Need approval from code owner
   - Get review from team member

2. Check conversations:
   - Resolve all comment threads

3. Check branch up to date:
   ```bash
   git fetch origin main
   git merge origin/main
   git push
   ```

**Why it happens:** Branch protection rules

**Prevention:** Follow merge checklist

---

#### Issue: Force push rejected
```
error: failed to push some refs
hint: Updates were rejected because the tip of your current branch is behind
```

**Solution:**
```bash
# DON'T use --force on protected branches!

# Instead, pull and merge
git pull origin your-branch
# Resolve conflicts if any
git push

# On feature branches only:
git push --force-with-lease  # Safer than --force
```

**Why it happens:** Branch protection, divergent history

**Prevention:** Never force push to main/develop

---

### 🔴 Performance Issues

#### Issue: CI runs taking too long
```
Client build times out after 60 minutes
```

**Solution:**
1. Cache dependencies:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'
       cache-dependency-path: src/client/package-lock.json
   ```

2. Run jobs in parallel:
   ```yaml
   jobs:
     client: # ...
     server: # ...
     # These run simultaneously
   ```

3. Limit workflow triggers:
   ```yaml
   on:
     pull_request:
       paths:
         - 'src/**'  # Only run if code changes
   ```

**Why it happens:** No caching, sequential jobs, running on every change

**Prevention:** Optimize workflows from the start

---

### 🔴 Git Reflog / Recovery Issues

#### Issue: Can't find lost commit
```
git reflog shows nothing helpful
```

**Solution:**
```bash
# Check all refs
git fsck --lost-found

# Search for content
git log --all --source --full-history -- path/to/file

# Check GitHub
# Go to: https://github.com/user/repo/commits/branch-name
# Look for commit in web UI

# Check backup refs
git show-ref | grep backup
```

**Why it happens:** Commit was never pushed, or very old

**Prevention:** Push frequently, use backup refs

---

### 🔴 Monorepo-Specific Issues

#### Issue: Wrong package.json updated
```
Installed package in wrong directory
```

**Solution:**
```bash
# Check where you are
pwd

# Should be /path/to/webos/src/client OR /path/to/webos/src/server
# Not /path/to/webos

# Fix
cd src/client  # or src/server
npm install <package>
```

**Why it happens:** Running npm in wrong directory

**Prevention:** Always check pwd before npm commands

---

#### Issue: CI can't find package.json
```
Error: Cannot find module 'package.json'
```

**Solution:**
Update workflow to use correct working directory:
```yaml
- name: Install dependencies
  working-directory: ./src/client  # ← Must specify!
  run: npm ci
```

**Why it happens:** No root package.json, only in subdirectories

**Prevention:** Always use working-directory in workflows

---

## Debugging Workflows

### Enable Debug Logging

1. In GitHub:
   - Settings > Secrets and variables > Actions
   - Add secret: `ACTIONS_STEP_DEBUG` = `true`
   - Add secret: `ACTIONS_RUNNER_DEBUG` = `true`

2. Re-run workflow

3. See detailed logs

### Test Workflow Locally

Use [act](https://github.com/nektos/act):
```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act pull_request

# Run specific job
act pull_request -j client-validation
```

### Validate Workflow Syntax

```bash
# Install actionlint
brew install actionlint  # macOS
# or download from https://github.com/rhysd/actionlint

# Validate
actionlint .github/workflows/*.yml
```

## Emergency Procedures

### Bypass CI (Emergency Only)

⚠️ **Only use in true emergencies!**

```bash
# Admin can merge without checks
# In PR, click "Merge without waiting for requirements"

# Or temporarily disable branch protection
# Settings > Branches > Edit rule > Temporarily disable
# REMEMBER TO RE-ENABLE!
```

### Rollback Merge

```bash
# If just merged (within minutes)
git checkout main
git reset --hard HEAD~1
git push --force  # ⚠️ Dangerous!

# Better approach (preserves history)
git revert -m 1 HEAD
git push
```

### Complete Repository Recovery

If everything is broken:
```bash
# 1. Clone fresh copy
git clone <repo-url> fresh-clone
cd fresh-clone

# 2. Find good commit
git log --oneline
git checkout <good-commit-sha>

# 3. Create recovery branch
git checkout -b recovery

# 4. Force main to recovery (⚠️ DANGEROUS)
git branch -f main recovery
git push --force origin main
```

## Getting Help

### Before Asking for Help

1. ✅ Read this guide
2. ✅ Check workflow logs
3. ✅ Try local reproduction
4. ✅ Search GitHub issues
5. ✅ Review git history

### When Asking for Help

Include:
- Link to PR/workflow run
- Full error message
- What you've tried
- Local vs CI behavior
- Screenshots of issue

### Useful Commands

```bash
# Current status
git status
git log --oneline --graph -10

# Remote status
git fetch origin
git branch -vv

# Check CI workflow
gh run list  # if gh CLI installed
gh run view <run-id> --log

# Verify checksums
git fsck
```

## Prevention Checklist

Before every commit:
- [ ] Run `npm run type-check` (client)
- [ ] Run `npm run build` (both)
- [ ] Review `git diff`
- [ ] Verify no secrets in code
- [ ] Test changes locally
- [ ] Commit with clear message

Before every PR:
- [ ] Branch up to date with target
- [ ] All local tests pass
- [ ] No large unexplained deletions
- [ ] PR description complete
- [ ] Linked to issue if applicable

Before every merge:
- [ ] All CI checks green
- [ ] Approval received
- [ ] Conversations resolved
- [ ] Reviewed changes one more time
- [ ] No force pushes detected

## Related Documentation

- [MERGE_STRATEGY.md](./MERGE_STRATEGY.md) - Merge strategy guide
- [branch-protection.md](./branch-protection.md) - Branch protection setup
- [GitHub Actions Docs](https://docs.github.com/en/actions)
