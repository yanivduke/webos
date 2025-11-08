# CI/CD Quick Start Guide

## 🚀 For New Developers

### Your First PR - Step by Step

```bash
# 1. Clone and setup
git clone <repo-url>
cd webos
cd src/client && npm install
cd ../server && npm install

# 2. Create feature branch
cd ../..  # Back to root
git checkout -b claude/my-feature-SESSION_ID

# 3. Make your changes
# ... edit files ...

# 4. Test locally
cd src/client
npm run type-check  # Must pass
npm run build       # Must succeed

cd ../server
npm run build       # Should succeed

# 5. Commit
git add .
git commit -m "feat: Add awesome feature"

# 6. Push
git push -u origin claude/my-feature-SESSION_ID

# 7. Create PR in GitHub
# - Base: main (or develop)
# - Wait for CI checks (green ✅)
# - Request review
# - Merge when approved
```

### What CI Checks Do

When you create a PR, these run automatically:

1. **Client Build** - Ensures your Vue/TypeScript code compiles
2. **Server Build** - Ensures your Node.js code works
3. **Type Check** - Catches TypeScript errors
4. **Security Audit** - Checks for vulnerable dependencies
5. **Merge Simulation** - Tests if merge will work
6. **Code Preservation** - Warns if code might be lost

**All must be ✅ green before merging!**

### Reading CI Results

**✅ All green** - Good to merge!
```
Client Build & Type Check  ✅
Server Build & Validation  ✅
Security Audit             ✅
Merge Conflict Check       ✅
```

**❌ Some red** - Fix before merging!
```
Client Build & Type Check  ❌  ← Click to see error
Server Build & Validation  ✅
```

Click the ❌ to see:
- Error message
- Which file failed
- Line number
- How to fix

### Common Fixes

**"Type checking failed"**
```bash
cd src/client
npm run type-check  # See errors locally
# Fix the type errors shown
git commit -am "fix: Type errors"
git push  # CI will re-run
```

**"Build failed"**
```bash
cd src/client
npm run build  # See what fails
# Fix the build error
git commit -am "fix: Build error"
git push
```

**"Merge conflicts"**
```bash
git fetch origin main
git merge origin/main
# Fix conflicts in editor
git commit -am "fix: Merge conflicts"
git push
```

## 🔧 For Experienced Developers

### Advanced Workflows

**Keep branch updated:**
```bash
git fetch origin main
git rebase origin/main  # Cleaner than merge
git push --force-with-lease  # Safe force push
```

**Test merge locally:**
```bash
git fetch origin main
git merge --no-commit --no-ff origin/main
# Review merged state
git merge --abort  # Undo test
```

**Run CI checks locally:**
```bash
# Install act (GitHub Actions locally)
brew install act  # macOS
# or: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Run workflows
act pull_request
act pull_request -j client-validation  # Specific job
```

### Merge Strategies

**For feature PRs:** Use "Squash and merge"
- ✅ Clean history
- ✅ One commit per feature
- ✅ Easy to revert

**For release PRs:** Use "Merge commit"
- ✅ Preserves history
- ✅ Shows all features
- ✅ Better for debugging

**Avoid:** "Rebase and merge"
- ⚠️ Rewrites history
- ⚠️ Can lose commits
- ⚠️ Only use if you know what you're doing

### Performance Tips

**Cache dependencies locally:**
```bash
# Use npm ci in CI, npm install locally
cd src/client && npm ci  # Faster, uses lock file
```

**Split large PRs:**
- Keep PRs under 400 lines changed
- One feature per PR
- Easier to review
- Faster CI runs

**Parallel development:**
```bash
# Work on multiple features
git checkout -b claude/feature-a-ID
# ... work ...
git push -u origin claude/feature-a-ID

git checkout main
git checkout -b claude/feature-b-ID
# ... work ...
git push -u origin claude/feature-b-ID

# Both PRs can run CI in parallel!
```

## 👨‍💼 For Repository Admins

### Initial Setup (One Time)

**1. Enable branch protection:**
- Settings > Branches
- Add rule for `main`
- Require status checks:
  - Client Build & Type Check
  - Server Build & Validation
  - Merge Simulation
- Require 1 approval
- Disable force push
- Save

**2. Configure GitHub Actions:**
- Settings > Actions > General
- Workflow permissions: "Read and write"
- Allow GitHub Actions to create PRs: Enable
- Save

**3. Add collaborators:**
- Settings > Collaborators
- Add team members
- Set appropriate permissions

**4. Optional - Add CODEOWNERS:**
```bash
cat > .github/CODEOWNERS << EOF
# Global
* @your-team

# Client
/src/client/** @frontend-team

# Server
/src/server/** @backend-team
EOF
git add .github/CODEOWNERS
git commit -m "Add CODEOWNERS"
```

### Managing Pull Requests

**Review checklist:**
- [ ] CI checks all green
- [ ] Code reviewed for quality
- [ ] No security issues
- [ ] Tests added if needed
- [ ] Documentation updated
- [ ] No large unexplained deletions
- [ ] Approval given

**Merge order:**
1. Oldest approved PRs first
2. Critical fixes take priority
3. Large refactors last

**After merge:**
- Delete source branch (unless needed)
- Check main branch CI passes
- Monitor for issues

### Troubleshooting Admin

**CI not running:**
```bash
# Check workflow syntax
yamllint .github/workflows/*.yml

# Check branch patterns match
cat .github/workflows/pr-validation.yml | grep branches -A 3

# Manual trigger
# Actions tab > Select workflow > Run workflow
```

**Permissions issue:**
```bash
# Settings > Actions > General
# Workflow permissions: Read and write
# Allow GitHub Actions to create PRs: ✅
```

**Storage full (artifacts):**
```bash
# Settings > Actions > General
# Artifact retention: 7 days (default is 90)
```

## 📊 Monitoring & Maintenance

### Weekly Tasks

**Check CI health:**
```bash
# View recent runs
gh run list --limit 20

# Check failure rate
gh run list --status failure
```

**Update dependencies:**
```bash
cd src/client
npm outdated  # See what's outdated
npm audit     # Check security

cd ../server
npm outdated
npm audit
```

**Clean up branches:**
```bash
# List merged branches
git branch --merged main

# Delete local merged branches
git branch --merged main | grep -v "^\*" | xargs git branch -d

# Delete remote merged branches (careful!)
git remote prune origin
```

### Monthly Tasks

**Review workflows:**
- Check avg CI time (should be < 5 min)
- Review failed runs
- Update actions to latest versions

**Security:**
```bash
cd src/client && npm audit fix
cd ../server && npm audit fix
```

**Documentation:**
- Update this guide if process changes
- Add new troubleshooting cases
- Review merge strategy effectiveness

## 🆘 Emergency Procedures

### Production is Broken After Merge

**Immediate action:**
```bash
# 1. Revert the merge (safest)
git checkout main
git pull origin main
git revert -m 1 HEAD  # Creates revert commit
git push origin main

# 2. Verify it worked
# Check production, run tests

# 3. Fix issue in separate PR
git checkout -b claude/hotfix-ID
# ... fix ...
git push -u origin claude/hotfix-ID
# Create PR, wait for CI, merge
```

### CI Completely Down

**Temporary bypass:**
```bash
# Admin only!
# Settings > Branches > Edit main rule
# Uncheck "Require status checks"
# Merge PR
# RE-ENABLE immediately after!
```

**Better approach:**
```bash
# Test locally first
git checkout main
git pull origin main
git merge --no-ff feature-branch
npm run build  # All checks
git push origin main
```

### Lost Code Recovery

```bash
# Find the lost commit
git reflog  # Shows all recent commits
git log --all --oneline --graph

# Recover
git checkout -b recovery <lost-commit-sha>
git cherry-pick <lost-commit-sha>

# Or check backup refs
git show-ref | grep backup
git checkout -b recovery refs/backup/TIMESTAMP
```

## 📚 Resources

**Documentation:**
- [MERGE_STRATEGY.md](./MERGE_STRATEGY.md) - Detailed merge strategy
- [branch-protection.md](./branch-protection.md) - Branch protection config
- [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md) - Troubleshooting guide

**External:**
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)

**Tools:**
- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- [actionlint](https://github.com/rhysd/actionlint) - Lint workflows
- [gh CLI](https://cli.github.com/) - GitHub from terminal

## 💡 Tips & Tricks

**Better commit messages:**
```bash
feat: Add user authentication
fix: Resolve race condition in file save
docs: Update API documentation
refactor: Simplify window management code
test: Add tests for drag and drop
chore: Update dependencies
```

**Useful git aliases:**
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --oneline --graph --all'
```

**Protect yourself:**
```bash
# Before risky operations
git tag backup-$(date +%s)  # Create backup tag

# Before force push
git push --force-with-lease  # Safer than --force

# Before merge
git merge --no-commit --no-ff  # Preview first
```

## ✅ Summary

**For every PR:**
1. Create feature branch
2. Make changes
3. Test locally
4. Push and create PR
5. Wait for CI ✅
6. Get review
7. Merge

**CI must be green before merge - no exceptions!**

Questions? See:
- [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md)
- [MERGE_STRATEGY.md](./MERGE_STRATEGY.md)
- Ask team in Slack/Discord
