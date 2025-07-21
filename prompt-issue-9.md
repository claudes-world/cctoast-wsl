# 🎯 Task: Implement Milestone 8 - CI/CD & Release Pipeline (Issue #9)

## 📋 Quick Context
You're working on the **cctoast-wsl** project - a utility that enables Windows toast notifications from WSL for Claude Code hooks. This milestone focuses on setting up automated testing, building, and publishing infrastructure.

## 🔧 Setup Instructions

### 1. Git Worktree Setup (REQUIRED)
```bash
# Navigate to the main project directory
cd /home/liam/code/cctoast-wsl

# Create a new worktree for your work (avoid conflicts with other agents)
git worktree add worktree-issue9 main

# Switch to your worktree
cd worktree-issue9

# Create feature branch
git checkout -b feat/9-cicd-release-pipeline

# Update issue status to in-progress
gh issue edit 9 --remove-label "status: ready" --add-label "status: in-progress"

# Assign yourself to the issue
gh issue edit 9 --add-assignee @me
```

### 2. Project Familiarization
Read these key files to understand the project:
- `CLAUDE.md` - Project context and development guidelines
- `docs/PRD.md` - Sections 9 & 10 cover publishing, versioning, and CI requirements
- `docs/IMPLEMENTATION_PLAN.md` - Milestone 8 detailed tasks
- `docs/PROJECT_MANAGEMENT.md` - Git workflow and commit conventions
- `package.json` - Current project structure and existing scripts

## 🎯 Your Mission: Issue #9 - Milestone 8: CI/CD & Release Pipeline

**Goal**: Automated testing, building, and publishing infrastructure
**Duration**: 2 days  
**Priority**: Release Readiness

## ✅ Acceptance Criteria Checklist

### CI Workflow (.github/workflows/ci.yml)
- [ ] Trigger on PR and push to main branch
- [ ] Test matrix: Ubuntu Node 18/20, Windows Node 20
- [ ] Run all tests with coverage reporting
- [ ] Check coverage thresholds (fail if below 90%)
- [ ] Run lint and type checking (npm run lint, npm run typecheck)
- [ ] Verify build completes successfully
- [ ] Achieve <2 minute runtime

### Release Workflow (.github/workflows/release.yml)
- [ ] Trigger on version tags (v*.*.*)
- [ ] Build and test before publishing
- [ ] Generate npm provenance with --provenance flag
- [ ] Sign releases with GPG (if keys available)
- [ ] Publish to npm with --provenance
- [ ] Create GitHub release automatically
- [ ] Upload build artifacts to release

### Windows CI Testing
- [ ] Mock PowerShell module for testing (no actual BurntToast installation)
- [ ] Test toast command generation without execution
- [ ] Verify WSL path conversions work in CI
- [ ] Check execution policy handling
- [ ] Run integration smoke tests with mocked components
- [ ] Add performance benchmarks (optional)

### Release Automation Setup
- [ ] Configure conventional commits enforcement (if not already)
- [ ] Set up automatic CHANGELOG.md generation
- [ ] Implement version bumping based on commit types
- [ ] Create PR creation for releases (release-please)
- [ ] Manage git tags automatically
- [ ] Generate comprehensive release notes

### Documentation Site (Optional - if time allows)
- [ ] Auto-deploy to GitHub Pages on main branch push
- [ ] Support version documentation
- [ ] Add search functionality with Algolia/similar
- [ ] Ensure mobile responsive design
- [ ] Integrate analytics (Google Analytics)
- [ ] Set up custom domain (if available)

### Package Security
- [ ] Enable npm provenance in package.json
- [ ] Generate SLSA-3 attestation
- [ ] Document 2FA requirement for npm account
- [ ] Sign all git tags in workflow
- [ ] Create .github/SECURITY.md policy (if not exists)
- [ ] Configure Dependabot for dependency updates

## 📚 Key Requirements from PRD

### CI/CD Specifications (PRD Section 10)
- **Test Matrix**: Ubuntu Node 18/20 + Windows Node 20
- **Coverage**: Fail CI if below 90% threshold
- **Performance**: CI pipeline must complete in <2 minutes
- **Mocking**: Windows CI uses mocked BurntToast (no real PowerShell module installation)
- **Integration**: Smoke tests verify path conversions and command generation

### Publishing Requirements (PRD Section 9)
- **Package Name**: `@claudes-world/cctoast-wsl` (scoped)
- **Provenance**: npm publish with --provenance flag
- **Security**: SLSA-3 attestation, signed releases
- **Automation**: Conventional commits → automatic versioning
- **Branches**: main (stable) releases

## 🔄 Git Workflow (CRITICAL - Follow Exactly)

### Commit Conventions
Use **conventional commits** for automatic versioning:
```bash
# Feature commits
git commit -m "feat: add comprehensive CI workflow with test matrix

- Implement GitHub Actions workflow for PR and push triggers
- Add Ubuntu Node 18/20 and Windows Node 20 test matrix
- Configure coverage thresholds with 90% requirement
- Include lint, typecheck, and build verification steps

Refs #9"

# CI/DevOps commits  
git commit -m "ci: implement automated release pipeline

- Add release workflow triggered by version tags
- Configure npm publishing with provenance
- Set up GitHub release creation with artifacts
- Integrate conventional commits for automatic versioning

Refs #9"
```

### Testing Before Commits
```bash
# Run existing project checks (adapt as needed)
npm run lint
npm run typecheck

# Test your workflow files (if tools available)
# GitHub CLI can validate workflows
gh workflow view ci.yml --repo .

# Verify package.json changes don't break builds
npm run build
```

### Progress Tracking
Update the issue regularly:
```bash
gh issue comment 9 --body "📋 **Progress Update**:
- [x] Created CI workflow with test matrix
- [x] Added coverage enforcement
- [ ] Working on release workflow
- [ ] Next: Windows CI mocking setup

**ETA**: On track for 2-day estimate"
```

## 🔧 Technical Implementation Guidance

### GitHub Actions Workflow Structure
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [18.x, 20.x]
        exclude:
          # Only test Windows on Node 20
          - os: windows-latest
            node-version: 18.x
```

### Package.json Integration
Ensure these scripts exist or add them:
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "build": "npm run build:prod"
  }
}
```

### Windows PowerShell Mocking Strategy
- Mock BurntToast module checks (don't install actual module)
- Test command generation without execution
- Verify path conversion logic works in Windows CI environment
- Use environment variables to detect CI and skip actual PowerShell calls

## 🧪 Testing Protocol

### Workflow Testing
```bash
# Test CI workflow (after pushing)
gh run list --workflow=ci.yml

# Test release workflow (create test tag)
git tag v0.0.1-test
git push origin v0.0.1-test

# Monitor workflow runs
gh run watch
```

### Local Validation
```bash
# Validate GitHub Actions syntax (if act is installed)
act -l  # List available workflows

# Test build process locally
npm run build
npm test
```

## 🚨 Important Notes

- **Don't install BurntToast in CI**: Use mocking/environment detection
- **Conventional Commits**: Required for automatic versioning to work
- **Security**: No secrets in workflow files, use GitHub secrets for sensitive data
- **Performance**: Keep CI under 2 minutes total runtime
- **Testing**: Windows CI should verify path conversion logic without actually calling PowerShell

## ✅ Success Criteria

### Performance Metrics
- **CI runtime**: <2 minutes total
- **Test coverage**: Maintains 90% threshold
- **Build verification**: All environments pass
- **Release automation**: Tags trigger automatic npm publish

### Quality Gates
- **All tests pass**: Including mocked Windows scenarios
- **Coverage maintained**: CI fails if below 90%
- **Lint clean**: Zero warnings/errors
- **Type safe**: No TypeScript errors
- **Security**: Provenance and attestation working

## ✅ Completion Criteria

When you've completed all tasks:

1. **Test thoroughly** with actual workflow runs
2. **Update issue** with completion status and change label to "status: under-review"
3. **Create PR** using this template:
   ```bash
   gh pr create --title "ci: CI/CD & Release Pipeline (Milestone 8)" --body "$(cat <<'EOF'
   ## 📋 Summary  
   Implements Milestone 8: Complete CI/CD pipeline with automated testing, building, and publishing
   
   ## 🎯 Closes Issues
   Closes #9
   
   ## ✅ All Acceptance Criteria Met
   [List completed items with checkboxes]
   EOF
   )"
   ```
4. **Tag for review** and notify team

## 🔗 References
- [PRD Section 9: Publishing & Versioning](docs/PRD.md#9--publishing--versioning)  
- [PRD Section 10: Testing & CI](docs/PRD.md#10--testing--ci)
- [Implementation Plan Milestone 8](docs/IMPLEMENTATION_PLAN.md#milestone-8-cicd--release-pipeline)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm provenance documentation](https://docs.npmjs.com/generating-provenance-statements)

## 🎯 Success Metrics
- CI pipeline runs in <2 minutes
- Automated releases work from version tags
- Windows CI properly mocks PowerShell/BurntToast
- Coverage enforcement prevents quality regression
- Security attestation and provenance working

---

**Ready to start? Follow the setup instructions above, then dive into creating the CI/CD workflows!**