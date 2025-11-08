# Branch Protection Configuration

This document describes the recommended branch protection rules for the WebOS repository to prevent code loss and ensure quality merges.

## Quick Setup Guide

To enable these protections, a repository administrator should configure the following in GitHub Settings > Branches > Branch protection rules:

### Main Branch Protection

**Branch name pattern:** `main`

**Required settings:**
- ✅ Require pull request reviews before merging
  - Required approving reviews: 1
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Required status checks:
    - `Client Build & Type Check`
    - `Server Build & Validation`
    - `Merge Simulation`
    - `Code Preservation Check`
- ✅ Require conversation resolution before merging
- ✅ Require linear history (optional, prevents merge commits)
- ✅ Do not allow bypassing the above settings (even for admins)
- ✅ Allow force pushes: **DISABLED**
- ✅ Allow deletions: **DISABLED**

### Development Branch Protection

**Branch name pattern:** `develop`

**Required settings:**
- ✅ Require pull request reviews before merging
  - Required approving reviews: 1
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `Client Build & Type Check`
    - `Server Build & Validation`
- ✅ Allow force pushes: **DISABLED**

### Feature Branch Protection

**Branch name pattern:** `claude/**`

**Required settings:**
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `Client Build & Type Check`
    - `Server Build & Validation`
- ⚠️ Allow force pushes: **ENABLED** (for development flexibility)
- ⚠️ Allow deletions: **ENABLED** (for cleanup)

## Automated Protection

The CI/CD workflows provide automated protection through:

1. **Pre-merge validation** - Checks code quality before allowing merge
2. **Merge simulation** - Tests the merge without actually merging
3. **Code preservation checks** - Detects potential code loss
4. **Integration testing** - Ensures merged code builds successfully
5. **Backup references** - Creates backup tags before risky operations

## Manual Configuration Steps

### Step 1: Access Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** > **Branches**
3. Click **Add branch protection rule**

### Step 2: Configure Main Branch

1. Enter `main` in "Branch name pattern"
2. Enable all checkboxes listed above in "Main Branch Protection"
3. Click **Create** or **Save changes**

### Step 3: Configure Additional Branches

Repeat for `develop` and `claude/**` patterns with their respective settings.

### Step 4: Verify Configuration

Run a test PR to ensure:
- Status checks are required
- PRs cannot be merged with failing checks
- Force pushes are blocked on protected branches

## CODEOWNERS File (Optional)

Create `.github/CODEOWNERS` to automatically request reviews:

```
# Global owners
* @your-team

# Client code
/src/client/** @frontend-team

# Server code
/src/server/** @backend-team

# CI/CD configuration
/.github/** @devops-team
```

## Merge Strategies

### Recommended Strategy: Squash and Merge

**Best for:** Feature branches → Main

**Benefits:**
- Clean, linear history
- Each feature = one commit
- Easy to revert entire features
- Reduces noise in git log

**How to enable:**
1. Settings > General > Pull Requests
2. ✅ Allow squash merging
3. ❌ Allow merge commits (disable)
4. ❌ Allow rebase merging (disable)

### Alternative: Merge Commit

**Best for:** Long-lived branches (develop → main)

**Benefits:**
- Preserves full history
- Shows branch relationships
- Easier to track feature development

**How to enable:**
1. Settings > General > Pull Requests
2. ✅ Allow merge commits
3. Select "Default to merge commit"

### Not Recommended: Rebase and Merge

**Why avoid:**
- Can lose merge history
- Rewrites commit history
- Harder to track changes
- Risk of code loss if not careful

## Emergency Procedures

### If Code is Lost During Merge

1. **Don't panic** - Git never truly deletes data
2. Find the lost commit:
   ```bash
   git reflog
   git log --all --oneline --graph
   ```
3. Recover from backup reference:
   ```bash
   git show refs/backup/TIMESTAMP-SHA
   git cherry-pick <lost-commit-sha>
   ```
4. Or reset to before merge:
   ```bash
   git reset --hard <commit-before-merge>
   ```

### Force Push Recovery

If someone force-pushed (and it wasn't blocked):

1. Check GitHub's Events API for the old SHA
2. Recover the lost commits:
   ```bash
   git fetch origin
   git reflog
   git checkout -b recovery <lost-sha>
   ```
3. Merge recovery branch back to main

## Enforcement Levels

### Level 1: Soft Protection (Current State)
- CI checks run automatically
- Warnings displayed for issues
- Merges can proceed with failures (not recommended)

### Level 2: Medium Protection (Recommended)
- CI checks must pass
- One approval required
- Conversations must be resolved
- Force push disabled

### Level 3: Hard Protection (Maximum Safety)
- All Level 2 requirements
- Two approvals required
- CODEOWNERS approval required
- No admin bypass allowed
- Signed commits required

## Current Configuration Status

⚠️ **As of now, branch protection is NOT enforced in GitHub settings.**

The CI/CD workflows provide validation, but they are advisory. To prevent code loss:

1. **Enable branch protection rules** as described above
2. **Never force push** to main/develop
3. **Always create PRs** even for urgent fixes
4. **Review CI results** before merging
5. **Test locally** before pushing

## Validation Checklist

Before merging any PR, ensure:

- [ ] All CI checks are green
- [ ] No merge conflicts detected
- [ ] Code preservation check passed
- [ ] Integration tests passed
- [ ] At least one approval received
- [ ] All conversations resolved
- [ ] No large unexplained deletions
- [ ] Changes reviewed for security issues

## Related Documentation

- [MERGE_STRATEGY.md](./MERGE_STRATEGY.md) - Detailed merge strategy guide
- [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md) - CI/CD troubleshooting
- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
