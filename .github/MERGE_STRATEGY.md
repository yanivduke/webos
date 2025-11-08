# WebOS CI/CD Merge Strategy

## 🎯 Zero Code Loss Philosophy

**Core Principle:** Every line of code is valuable. Our merge strategy ensures no code is lost during branch integration.

## Branch Structure

```
main (production-ready)
  ↑
develop (integration)
  ↑
claude/** (feature branches)
```

### Branch Purposes

**main / master**
- Production-ready code only
- Protected with strict rules
- All merges must pass CI/CD
- Never force push
- Never commit directly

**develop**
- Integration branch
- Latest development changes
- Pre-production testing
- Merges from feature branches

**claude/***
- Feature/fix branches
- Individual development work
- Must be kept up to date with develop
- Can be rebased during development

## Merge Workflows

### 1. Feature Branch → Develop

```bash
# Step 1: Ensure feature branch is up to date
git checkout develop
git pull origin develop
git checkout claude/your-feature-branch-ID

# Step 2: Rebase on develop (optional but recommended)
git rebase develop

# Step 3: Push and create PR
git push -u origin claude/your-feature-branch-ID

# Step 4: Create PR in GitHub
# - Set base: develop
# - Set compare: claude/your-feature-branch-ID
# - Wait for CI checks to pass
# - Get approval
# - Use "Squash and merge" button
```

**CI checks that run:**
- Client build & type check
- Server build & validation
- Security audit
- Merge conflict detection
- Code preservation check
- Merge simulation
- Integration test

### 2. Develop → Main

```bash
# This should only be done by release managers

# Step 1: Ensure develop is stable
# - All feature PRs merged and tested
# - All CI checks passing
# - No open critical issues

# Step 2: Create release PR
# - Base: main
# - Compare: develop
# - Title: "Release vX.Y.Z"

# Step 3: Wait for all CI checks
# - Post-merge validation
# - Build artifacts
# - Integration tests

# Step 4: Use "Merge commit" (not squash)
# - Preserves development history
# - Shows all features in release
```

### 3. Hotfix → Main

```bash
# Emergency fixes only

# Step 1: Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b claude/hotfix-issue-ID

# Step 2: Make minimal fix
# - Change only what's necessary
# - Add test if possible

# Step 3: Create PR to main
# - Mark as urgent
# - Request immediate review
# - Wait for CI (can override in true emergency)

# Step 4: After merge, backport to develop
git checkout develop
git cherry-pick <hotfix-commit-sha>
```

## Merge Strategy Selection

### Squash and Merge ✅ (Recommended for Features)

**When to use:**
- Feature branches → develop
- Small fixes
- Multiple commits that should be one

**Advantages:**
- Clean history
- One commit per feature
- Easy to revert
- Reduces noise

**How to:**
1. GitHub PR page
2. Click "Squash and merge"
3. Edit commit message
4. Confirm merge

**Example result:**
```
* feat: Add user authentication system
* feat: Add drag and drop for windows
* feat: Add settings panel
```

### Merge Commit ✅ (Recommended for Releases)

**When to use:**
- Develop → main
- Long-lived branches
- Want to preserve history

**Advantages:**
- Full history preserved
- Shows branch relationships
- Easier debugging
- Clear feature tracking

**How to:**
1. GitHub PR page
2. Click "Create a merge commit"
3. Confirm merge

**Example result:**
```
*   Merge branch 'develop' into main
|\
| * feat: Add authentication
| * feat: Add settings
|/
* Previous main commit
```

### Rebase and Merge ⚠️ (Use Carefully)

**When to use:**
- Very rarely
- Single commit PRs
- Want linear history

**Dangers:**
- Rewrites history
- Can cause confusion
- Risk of losing commits
- Conflicts harder to resolve

**Only use if:**
- You fully understand git rebase
- The branch has one commit
- No one else worked on the branch

## Code Preservation Checks

Our CI automatically checks for code loss:

### 1. Large Deletion Detection
```yaml
If deletions > 500 lines:
  → Warn reviewer
  → Require explanation
  → Manual verification needed
```

### 2. Missing File Detection
```yaml
For each file in target branch:
  If not in source branch:
    → Flag as potentially lost
    → Require confirmation
```

### 3. Merge Simulation
```yaml
Before actual merge:
  → Simulate merge
  → Check for conflicts
  → Verify result builds
  → Show diff to reviewer
```

### 4. Backup References
```yaml
Before risky operations:
  → Create backup tag
  → Store in refs/backup/
  → Keep for 30 days
  → Allow recovery
```

## Conflict Resolution

### When Conflicts Occur

**Step 1: Understand the conflict**
```bash
git status  # Show conflicting files
git diff    # Show conflict markers
```

**Step 2: Choose resolution strategy**

**Strategy A: Merge** (keeps both histories)
```bash
git checkout claude/your-branch
git merge develop
# Fix conflicts in editor
git add .
git commit -m "Merge develop into feature branch"
git push
```

**Strategy B: Rebase** (cleaner history)
```bash
git checkout claude/your-branch
git rebase develop
# Fix conflicts as they appear
git rebase --continue
git push --force-with-lease
```

**Step 3: Verify no code lost**
```bash
# Check file count
git diff --name-only develop

# Check for large deletions
git diff --stat develop

# Test build
cd src/client && npm run build
cd src/server && npm run build
```

### Conflict Markers

When you see conflict markers, understand what they mean:

```javascript
<<<<<<< HEAD (current branch - yours)
const API_URL = 'http://localhost:3001/api';
=======
const API_URL = process.env.API_URL || 'http://localhost:3001/api';
>>>>>>> develop (incoming branch)
```

**Resolution options:**
1. Keep yours (HEAD)
2. Keep theirs (develop)
3. Keep both (combine)
4. Write new solution

**Best practice:** Usually option 3 or 4 is safest.

## Pre-Merge Checklist

Before clicking "Merge" button:

### Automated Checks ✅
- [ ] Client Build & Type Check - PASSED
- [ ] Server Build & Validation - PASSED
- [ ] Security Audit - PASSED
- [ ] Merge Conflict Detection - PASSED
- [ ] Code Preservation Check - PASSED
- [ ] Merge Simulation - PASSED
- [ ] Integration Test - PASSED

### Manual Review ✅
- [ ] Read the code changes
- [ ] Check for security issues
- [ ] Verify no sensitive data committed
- [ ] Ensure coding standards followed
- [ ] Confirm tests added if needed
- [ ] Review large deletions
- [ ] Check documentation updated

### Final Verification ✅
- [ ] All conversations resolved
- [ ] Approval received
- [ ] CI checks all green
- [ ] No force pushes detected
- [ ] Branch up to date with target

## Post-Merge Verification

After merge completes:

```bash
# Step 1: Verify merge succeeded
git checkout develop  # or main
git pull origin develop
git log -1  # Check last commit

# Step 2: Verify build still works
cd src/client && npm run build
cd src/server && npm run build

# Step 3: Check no files lost
git diff HEAD~1 --name-status
# Look for 'D' (deleted) files - verify they should be deleted

# Step 4: Tag if it's a release
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3
```

## Recovery Procedures

### If Code is Lost

**Immediate action:**
```bash
# DO NOT PANIC - Git keeps everything for 90 days

# Step 1: Find the lost commit
git reflog  # Shows all recent commits
git log --all --oneline --graph

# Step 2: Create recovery branch
git checkout -b recovery-branch <lost-commit-sha>

# Step 3: Verify code is there
ls -la  # Check files

# Step 4: Cherry-pick or merge back
git checkout develop
git cherry-pick <lost-commit-sha>
# or
git merge recovery-branch
```

**If reflog doesn't show it:**
```bash
# Check backup references
git show-ref | grep backup

# Restore from backup
git checkout -b recovery refs/backup/TIMESTAMP-SHA
```

### If Wrong Merge Strategy Used

**To undo a merge:**
```bash
# Within 5 minutes of merge
git checkout develop
git reset --hard HEAD~1  # DANGER: Only if not pushed!

# If already pushed (safer)
git revert -m 1 HEAD  # Creates new commit undoing merge
git push
```

### If Force Push Happened

**Recovery:**
```bash
# Contact GitHub support for SHA recovery
# Or check CI logs for the lost SHA

# Once you have the SHA
git fetch origin
git checkout -b recovery <lost-sha>
git push origin recovery

# Then create PR to merge recovery back
```

## Best Practices

### DO ✅

- Always create PRs for changes
- Wait for CI checks to pass
- Get code review before merging
- Keep branches up to date
- Test locally before pushing
- Read the diff before merging
- Use descriptive commit messages
- Document why, not what
- Tag releases
- Clean up merged branches

### DON'T ❌

- Never force push to main/develop
- Never commit directly to protected branches
- Never merge with failing CI
- Never merge without review
- Never use `git push --force` (use `--force-with-lease` if needed)
- Never ignore large deletion warnings
- Never merge without understanding changes
- Never bypass branch protection
- Never commit secrets/credentials
- Never delete branches immediately (wait 7 days)

## Troubleshooting

See [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md) for:
- CI check failures
- Workflow errors
- Permission issues
- Build failures
- Merge conflicts
- Recovery procedures

## Quick Reference

```bash
# Create feature branch
git checkout -b claude/feature-name-SESSION_ID

# Keep up to date
git fetch origin develop
git rebase origin/develop

# Push feature
git push -u origin claude/feature-name-SESSION_ID

# After PR merged, cleanup
git checkout develop
git pull origin develop
git branch -d claude/feature-name-SESSION_ID
git push origin --delete claude/feature-name-SESSION_ID

# Emergency: Undo last commit (not pushed)
git reset --soft HEAD~1

# Emergency: Undo last commit (pushed)
git revert HEAD
git push
```

## Support

If you're unsure about a merge:
1. Ask for help before merging
2. Create a test PR to see CI results
3. Use `git merge --no-commit` to preview
4. Consult this document
5. When in doubt, DON'T merge - ask for review
