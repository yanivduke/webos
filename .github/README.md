# WebOS CI/CD Documentation

## 📁 Directory Contents

### Workflows (`.github/workflows/`)

Automated CI/CD pipelines that run on GitHub Actions:

- **`pr-validation.yml`** - Validates all pull requests
  - Client build & type checking
  - Server build & validation
  - Security audits
  - Merge conflict detection

- **`safe-merge.yml`** - Advanced merge safety checks
  - Pre-merge validation
  - Code preservation checks
  - Merge simulation
  - Integration testing
  - Generates safety reports

- **`main-ci.yml`** - Main branch continuous integration
  - Post-merge validation
  - Build artifact creation
  - Code integrity checks

### Documentation

- **`CI_CD_QUICKSTART.md`** ⭐ **START HERE**
  - Quick start guide for developers
  - Step-by-step PR workflow
  - Common tasks and fixes

- **`MERGE_STRATEGY.md`** 📖 **MUST READ**
  - Complete merge strategy guide
  - Branch structure and workflows
  - Conflict resolution
  - Recovery procedures

- **`branch-protection.md`** 🔒
  - Branch protection configuration
  - GitHub settings guide
  - Enforcement levels

- **`CI_CD_TROUBLESHOOTING.md`** 🔧
  - Common issues and solutions
  - Debugging workflows
  - Emergency procedures

## 🚀 Quick Start

### For First-Time Contributors

1. Read: [CI_CD_QUICKSTART.md](./CI_CD_QUICKSTART.md)
2. Create feature branch: `git checkout -b claude/my-feature-SESSION_ID`
3. Make changes and test locally
4. Push and create PR
5. Wait for CI checks to pass ✅
6. Get review and merge

### For Understanding Merge Strategy

1. Read: [MERGE_STRATEGY.md](./MERGE_STRATEGY.md)
2. Understand branch structure
3. Learn merge workflows
4. Know conflict resolution

### For Troubleshooting

1. Check: [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md)
2. Find your error message
3. Follow solution steps
4. Ask for help if stuck

### For Repository Admins

1. Configure: [branch-protection.md](./branch-protection.md)
2. Set up branch protection rules in GitHub
3. Enable required status checks
4. Monitor CI/CD health

## 🎯 CI/CD Philosophy

### Zero Code Loss

Every workflow is designed to prevent code loss:
- ✅ Pre-merge validation
- ✅ Code preservation checks
- ✅ Merge simulations
- ✅ Backup references
- ✅ Large deletion warnings
- ✅ Missing file detection

### Safety First

Multiple layers of protection:
1. **Automated checks** - CI validates every change
2. **Branch protection** - Prevents accidental force pushes
3. **Required reviews** - Human verification
4. **Merge simulation** - Test before actual merge
5. **Post-merge validation** - Verify integrity

### Fast Feedback

CI designed for quick feedback:
- ⚡ Parallel job execution
- ⚡ Dependency caching
- ⚡ Early failure detection
- ⚡ Clear error messages

## 📊 Workflow Overview

```
Feature Development:
  Developer creates branch (claude/feature-ID)
    ↓
  Makes changes
    ↓
  Pushes to GitHub
    ↓
  CI runs PR validation
    ├─ Client build ✅
    ├─ Server build ✅
    ├─ Type checking ✅
    ├─ Security audit ✅
    ├─ Merge simulation ✅
    └─ Code preservation ✅
    ↓
  All checks pass
    ↓
  Review & approval
    ↓
  Merge to main
    ↓
  Main CI runs
    ├─ Build & test ✅
    ├─ Post-merge validation ✅
    └─ Create artifacts ✅
```

## 🔍 CI Check Reference

### Required Checks (Must Pass)

| Check | What It Does | Failure = |
|-------|--------------|-----------|
| Client Build | Compiles Vue/TS code | Build errors exist |
| Type Check | Validates TypeScript | Type errors exist |
| Server Build | Compiles Node.js code | Server issues exist |
| Merge Simulation | Tests merge success | Conflicts exist |
| Code Preservation | Detects code loss | Potential data loss |

### Advisory Checks (Warning Only)

| Check | What It Does | Failure = |
|-------|--------------|-----------|
| Security Audit | Scans dependencies | Vulnerabilities found |
| Large Deletions | Detects big changes | Review recommended |

## 🛠️ Maintenance

### Weekly

- [ ] Review failed CI runs
- [ ] Check dependency updates
- [ ] Clean up merged branches

### Monthly

- [ ] Update workflow actions versions
- [ ] Run security audits
- [ ] Review merge strategy effectiveness
- [ ] Update documentation

### As Needed

- [ ] Add new CI checks for new features
- [ ] Update branch protection rules
- [ ] Optimize workflow performance
- [ ] Add troubleshooting cases

## 📞 Support

### Before Asking for Help

1. ✅ Read [CI_CD_QUICKSTART.md](./CI_CD_QUICKSTART.md)
2. ✅ Check [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md)
3. ✅ Review workflow logs in GitHub Actions tab
4. ✅ Try reproducing locally

### When Asking for Help

Include:
- Link to PR or workflow run
- Error message (full text)
- What you've tried
- Expected vs actual behavior

### Emergency Contact

For critical production issues:
1. Revert the problematic merge immediately
2. Notify team
3. Fix in hotfix branch
4. Follow emergency procedures in troubleshooting guide

## 🎓 Learning Resources

### Internal

- [MERGE_STRATEGY.md](./MERGE_STRATEGY.md) - Our merge strategy
- [CI_CD_QUICKSTART.md](./CI_CD_QUICKSTART.md) - Getting started
- [CI_CD_TROUBLESHOOTING.md](./CI_CD_TROUBLESHOOTING.md) - Problem solving
- [branch-protection.md](./branch-protection.md) - Protection setup

### External

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitFlow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

### Tools

- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- [actionlint](https://github.com/rhysd/actionlint) - Lint workflow files
- [gh CLI](https://cli.github.com/) - GitHub CLI tool

## 📈 Metrics & Goals

### Current Targets

- **CI Success Rate**: > 95%
- **Average CI Time**: < 5 minutes
- **Time to Merge**: < 24 hours
- **Code Loss Incidents**: 0

### Monitoring

Check GitHub Actions tab for:
- Recent workflow runs
- Success/failure rates
- Run duration trends
- Resource usage

## ✅ Success Criteria

You know CI/CD is working when:

- ✅ All PRs have passing checks before merge
- ✅ No code lost during merges
- ✅ Build failures caught before main
- ✅ Developers confident in the process
- ✅ Quick feedback on changes
- ✅ Easy to troubleshoot issues

## 📝 Version History

- **2025-11-08**: Initial CI/CD implementation
  - PR validation workflow
  - Safe merge workflow
  - Main branch CI
  - Complete documentation
  - Branch protection guide

## 🤝 Contributing to CI/CD

To improve these workflows:

1. Create feature branch
2. Edit workflow files
3. Test with `act` locally
4. Create PR with description
5. Get review from DevOps team
6. Merge and monitor

**Remember:** Changes to workflows affect everyone. Test thoroughly!

---

**Questions?** Check the docs above or ask the team!
