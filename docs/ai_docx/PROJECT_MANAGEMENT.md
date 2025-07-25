# Project Management Guide for LLM Development

This document provides comprehensive guidance for LLM developers (like Claude Code) working on the cctoast-wsl project. Follow these workflows to ensure consistent, traceable, and high-quality development.

## 🎯 Overview

The cctoast-wsl project uses **GitHub Issues → Feature Branches → Pull Requests → Main Branch** workflow with milestone tracking and comprehensive labeling.

### Key Principles
1. **All work starts with an issue** - Never code without a corresponding GitHub issue
2. **One feature per branch** - Keep branches focused and small
3. **Descriptive commits** - Use conventional commits for automatic versioning
4. **Comprehensive testing** - Maintain 90% test coverage
5. **Documentation updates** - Update docs with code changes

---

## 📋 Issue Management Workflow

### Before Starting Any Work

#### 1. Issue Selection & Search
```bash
# View all open issues
gh issue list

# Find available work (not assigned and ready)
gh issue list --assignee "" --state open

# View issues by milestone
gh issue list --milestone "Foundation & Build System"

# Check what's currently being worked on
gh issue list --assignee "@me"
```

#### 2. **MANDATORY**: Git Worktree Setup
**CRITICAL**: LLM agents MUST use git worktrees to avoid branch conflicts

```bash
# Navigate to main project directory
cd /path/to/cctoast-wsl

# Get the absolute latest code from remote
git fetch origin

# Create isolated worktree from latest remote main
git worktree add worktree-issue<NUMBER> origin/main

# Switch to your worktree
cd worktree-issue<NUMBER>

# Example for Issue #8:
git fetch origin
git worktree add worktree-issue8 origin/main
cd worktree-issue8
```

#### 3. Issue Assignment & Status Management
```bash
# Assign issue to yourself
gh issue edit <issue-number> --add-assignee @me

# Example:
gh issue edit 8 --add-assignee @me
```

#### 4. Issue Analysis
Read the issue completely and verify:
- [ ] Acceptance criteria are clear
- [ ] Dependencies are understood
- [ ] Required documentation is available
- [ ] Effort estimate aligns with available time
- [ ] No other agent is working on this (check assignee)

### Issue Status Tracking

Update issue status by commenting:
```bash
# Mark as in progress
gh issue comment <issue-number> --body "🚧 **Status Update**: Starting work on this milestone

**Current Task**: Project Directory Structure
**ETA**: 2 hours
**Dependencies**: None"

# Progress updates
gh issue comment <issue-number> --body "✅ **Progress Update**: 
- [x] Create directories
- [x] Move show-toast.sh to scripts/
- [ ] Create placeholder files
- [ ] Verify directory structure"

# Completion
gh issue comment <issue-number> --body "✅ **Completed**: All acceptance criteria met
**Next**: Ready for code review
**Testing**: All tests passing
**Docs**: Updated as needed"
```

---

## 🌿 Feature Branching Strategy (Within Worktree)

### Branch Naming Convention
```
<type>/<issue-number>-<short-description>

Types:
- feat/     - New features (milestone implementations)
- fix/      - Bug fixes
- docs/     - Documentation updates
- test/     - Test additions/improvements
- chore/    - Maintenance tasks
```

### Starting a Feature (After Worktree Setup)

#### 1. Create Feature Branch in Your Worktree
```bash
# You're already in worktree-issue<NUMBER> directory
# Create feature branch from main
git checkout -b feat/<issue-number>-<description>

# Example for Issue #8 (already in worktree-issue8/):
git checkout -b feat/8-documentation-user-experience

# Example for a bug fix in worktree-issue15/:
git checkout -b fix/15-powershell-escaping-issue
```

#### 2. Link Branch to Issue
```bash
# Comment on issue to link branch
gh issue comment <issue-number> --body "🌿 **Branch Created**: \`feat/<issue>-<description>\`
**Worktree**: \`worktree-issue<number>\`
Starting development on this issue."

# Example:
gh issue comment 8 --body "🌿 **Branch Created**: \`feat/8-documentation-user-experience\`
**Worktree**: \`worktree-issue8\`
Starting development on this milestone."
```

### Branch Management Rules
1. **Keep branches small** - Target 1-3 days of work maximum
2. **One milestone per branch** - Don't mix milestones
3. **Regular commits** - Commit frequently with descriptive messages
4. **Stay current** - Regularly rebase on main if long-running

---

## 💻 Development Workflow

### 1. Task Breakdown
For milestone issues, work through tasks in order:
```bash
# Update issue with current task
gh issue comment 2 --body "📋 **Current Task**: TypeScript Configuration
**Status**: In Progress
**Files**: tsconfig.json, package.json"
```

### 2. Commit Strategy
Use conventional commits for automatic versioning:
```bash
# Feature commits
git commit -m "feat: add TypeScript configuration with strict mode

- Enable strict type checking flags
- Configure ES2022 target
- Set up source maps for debugging
- Add path mapping for clean imports

Refs #2"

# Fix commits
git commit -m "fix: resolve PowerShell parameter escaping issue

Special characters in toast messages were causing PowerShell 
command execution to fail. Added proper escaping function.

Closes #15"

# Documentation commits  
git commit -m "docs: update installation guide with new directory structure

Added section for scripts/ directory organization
Updated file paths throughout guide

Refs #12"
```

### 3. Testing Requirements
Before any commit:
```bash
# Run all checks
npm run lint
npm run typecheck
npm test
npm run test:coverage

# Check coverage meets requirements (90%)
# If coverage drops, add tests before committing
```

### 4. Documentation Updates
Update relevant documentation:
- **CLAUDE.md** - For LLM context changes
- **README.md** - For user-facing changes
- **Architecture docs** - For design changes
- **API docs** - For interface changes

---

## 🔄 Pull Request Process

### Creating Pull Requests

#### 1. Pre-PR Checklist
```bash
# Ensure branch is up to date
git fetch origin
git rebase origin/main

# Final testing
npm run check:all

# Verify all acceptance criteria met
# Review issue and ensure all tasks completed
```

#### 2. Create Pull Request
```bash
# Create PR linking to issue
gh pr create --title "feat: Foundation & Build System (Milestone 1)" --body "$(cat <<'EOF'
## 📋 Summary
Implements Milestone 1: Foundation & Build System establishing TypeScript project structure with proper build tooling.

## 🎯 Closes Issues
Closes #2

## ✅ Acceptance Criteria Met
- [x] Project directories created per PRD specifications
- [x] TypeScript configuration with strict mode
- [x] esbuild setup with <1s build time and <100KB bundle
- [x] Development tooling (ESLint, Prettier, ShellCheck, Husky)
- [x] Package.json configured as scoped package

## 🧪 Testing
- [x] All existing tests pass
- [x] New tests added for new functionality
- [x] Coverage remains above 90%
- [x] Lint and type checking pass

## 📚 Documentation
- [x] CLAUDE.md updated with new structure
- [x] README.md reflects new setup
- [x] Architecture docs updated

## 🔍 Review Focus
- TypeScript configuration strictness
- Build system performance
- Directory structure compliance with PRD

## 📋 Post-Merge Tasks
- [ ] Verify CI passes on main
- [ ] Update project board status
- [ ] Begin next milestone
EOF
)"

# MANDATORY: Add @mcorrig4 as reviewer for all PRs
gh pr edit --add-reviewer mcorrig4
```

#### 3. **MANDATORY**: Request Review from @mcorrig4
**CRITICAL**: All PRs must be reviewed by @mcorrig4 as the development partner

```bash
# Always tag @mcorrig4 as reviewer when creating PRs
gh pr edit --add-reviewer mcorrig4

# Comment on PR to notify reviewer
gh pr comment --body "Hey @mcorrig4! 👋

This PR is ready for your review when you have time.

**What's Changed**: [Brief summary of key changes]
**Testing Status**: [Brief status of testing completed]
**Review Focus**: [Key areas that need attention]

Thanks for taking a look! 🙏"
```

### PR Review Process

#### Self-Review Checklist
Before requesting review:
- [ ] All acceptance criteria from issue are met
- [ ] Code follows project style guidelines
- [ ] Tests are comprehensive and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] No secrets or sensitive data committed
- [ ] Performance impact is acceptable

#### Handling Review Feedback
```bash
# Make requested changes
git add .
git commit -m "fix: address PR review feedback

- Update error handling per reviewer suggestion
- Add additional test cases
- Improve JSDoc documentation

Refs #2"

# Push changes
git push origin feat/2-foundation-build-system
```

### Merging Strategy

#### Ready to Merge
```bash
# Squash and merge preferred for clean history
gh pr merge --squash

# Alternative: Merge commit for complex features
gh pr merge --merge

# Update issue after merge
gh issue comment 2 --body "✅ **Merged**: PR #X merged successfully
**Status**: Complete
**Next**: Ready to start Milestone 2"

# Close issue
gh issue close 2
```

#### Merge Requirements
- [ ] All CI checks passing
- [ ] At least one approval (if required)
- [ ] All conversations resolved
- [ ] Branch up to date with main
- [ ] Tests passing with required coverage

---

## 📊 Progress Tracking

### Issue Progress Updates
Regular updates help maintain visibility:

```bash
# Daily progress update
gh issue comment 2 --body "📈 **Daily Update**: Day 2 of Milestone 1

**Completed Today**:
- ✅ TypeScript configuration
- ✅ Build system setup

**In Progress**:
- 🔄 Development tooling setup (ESLint, Prettier)

**Next**:
- 📋 Package.json configuration

**Blockers**: None
**ETA**: On track for 2-day estimate"
```

### Milestone Completion
```bash
# Milestone completion summary
gh issue comment 2 --body "🎉 **Milestone 1 Complete**

**Duration**: 1.5 days (ahead of 2-day estimate)
**Quality Metrics**:
- ✅ Build time: 0.8s (target: <1s)
- ✅ Bundle size: 85KB (target: <100KB)
- ✅ Test coverage: 92% (target: 90%)
- ✅ Zero lint warnings

**Deliverables**:
- Complete project structure
- TypeScript strict mode configuration  
- esbuild pipeline
- Development tooling suite
- Package configuration

**Lessons Learned**:
- esbuild configuration needed platform-specific adjustments
- Husky setup required additional npm script configuration

**Next Milestone**: Ready to start Milestone 2 (Core CLI Framework)"
```

---

## 🧪 Collaborative Testing Protocol

### When to Request User Testing

Before closing milestones that include interactive or system-dependent features, create a `PLEASE-TEST-<issue-number>.md` file for user validation.

#### Features Requiring User Testing:
- Interactive prompts (@clack/prompts)
- TTY detection logic  
- Signal handling (Ctrl+C)
- Color output
- Terminal-specific behaviors
- Cross-platform compatibility
- Features that behave differently in CI vs interactive environments

#### Testing File Creation Process:

```bash
# Create test file for issue #3
# File: PLEASE-TEST-3.md

# Include in the file:
# 1. Environment requirements (WSL, interactive terminal, etc.)
# 2. Pre-test setup commands
# 3. Numbered test cases with expected behaviors
# 4. Visual quality assessment criteria
# 5. Clear reporting format (✅/❌ for each test)
```

#### Test File Template Structure:
```markdown
# 🧪 PLEASE TEST: Issue #X - [Feature Name]

## Environment Requirements
- Specific environment needed (WSL, Windows, terminal type)

## Pre-Test Setup  
- Commands to prepare for testing

## Test Cases
### ✅ Test N: [Test Name]
**Command:** `command to run`
**Expected Behavior:** What should happen
**Report:** ✅/❌ [Question to answer]

## Reporting Results
- Clear format for user to provide feedback
```

### User Testing Workflow

1. **LLM Creates Test File**: When feature is "implementation complete"
2. **Request User Testing**: Comment on issue with link to test file
3. **User Performs Testing**: Follow test file instructions
4. **User Reports Results**: Comment with ✅/❌ results and feedback
5. **LLM Addresses Issues**: Fix any problems found
6. **Milestone Closure**: Only close when user testing passes

### Example Test Request Comment:

```bash
gh issue comment 3 --body "Hey @mcorrig4! 👋

Could you please review and test the interactive CLI features when you have a few minutes? 

**What I need**: Your validation of the interactive mode in a real terminal environment

**Test File**: [PLEASE-TEST-3.md](./PLEASE-TEST-3.md) - Contains detailed test cases with step-by-step instructions

**Why needed**: Interactive prompts, TTY detection, and Ctrl+C handling can't be fully tested in my development environment

**What to expect**: [Brief description of what they'll be testing - estimated time]

**Environment**: [Specific environment requirements]

Just follow the test file instructions and comment back with ✅/❌ results for each test case. No rush - whenever you have time! 

Thanks for helping validate this milestone! 🙏"
```

### Partner Collaboration Protocol

**Always tag @mcorrig4** as your development partner when requesting testing or validation:
- Use friendly, conversational tone
- Clearly explain what you need from them
- Provide direct links to test files
- Set clear expectations (time, environment, reporting format)
- Thank them for their collaboration
- Never pressure - always "when convenient"

### Post-Testing Actions

```bash
# After successful testing
gh issue comment 3 --body "✅ **User Testing Complete** - All test cases passed
Ready to close milestone"

# If issues found
gh issue comment 3 --body "🔧 **Issues Found in Testing** 
Will address the following problems:
- [List issues found]
- [ETA for fixes]"
```

---

## 🚨 Error Handling and Recovery

### When Issues Are Blocked
```bash
# Mark as blocked
gh issue comment 15 --body "🚫 **Status**: Blocked

**Blocker**: Waiting for BurntToast module documentation
**Impact**: Cannot complete PowerShell integration testing
**Workaround**: Proceeding with mock implementation
**Resolution Needed**: Official BurntToast API documentation
**ETA**: Unknown - external dependency"

# Add blocked label
gh issue edit 15 --add-label "blocked"
```

### When Features Need to be Cancelled
```bash
# Cancel feature
gh issue comment 20 --body "❌ **Feature Cancelled**

**Reason**: Requirement changed during development
**Work Completed**: 60% implementation done
**Disposition**: Code archived in branch \`feat/20-cancelled-feature\`
**Impact**: No impact on current milestone timeline"

# Close issue
gh issue close 20 --reason "not planned"
```

### When PRs Need to be Rejected
```bash
# Close PR without merging
gh pr close 25 --comment "❌ **PR Closed Without Merge**

**Reason**: Architecture approach doesn't align with project goals
**Action Required**: New implementation needed with different approach
**Issue Status**: Reopened for alternative solution"

# Reopen related issue if needed
gh issue reopen 18
```

---

## 🎨 Labels and Organization

### Applying Labels During Development
```bash
# Add labels to track work
gh issue edit 2 --add-label "milestone,P0-critical,foundation,M"

# Update labels as work progresses
gh issue edit 2 --add-label "in-progress"
gh issue edit 2 --remove-label "P0-critical" --add-label "P1-high"
```

### Label Usage Guidelines
- **Priority**: Always set P0-P3 based on current urgency
- **Component**: Tag with relevant system component
- **Type**: Specify work type (feature, enhancement, bug, docs)
- **Effort**: Estimate using XS, S, M, L, XL
- **Status**: Use in-progress, blocked, review-needed as appropriate

---

## 📋 Quick Reference Commands

### Daily Workflow
```bash
# Check assigned issues
gh issue list --assignee @me

# Start new feature
git checkout -b feat/<issue>-<description>
gh issue comment <issue> --body "🚧 Starting work"

# Regular progress update  
gh issue comment <issue> --body "📈 Progress update: [details]"

# Create PR when ready
gh pr create --title "feat: <description>" --body "<template>"

# Merge and cleanup
gh pr merge --squash
gh issue close <issue>
git branch -d feat/<branch-name>
```

### Issue Management
```bash
# View milestones
gh issue list --milestone "Milestone Name"

# Filter by priority
gh issue list --label "P0-critical"

# Search issues
gh issue list --search "BurntToast"

# Update issue
gh issue edit <number> --add-label "label" --add-assignee @me
```

### Branch Management
```bash
# Create feature branch
git checkout -b feat/<issue>-<description>

# Keep branch current
git fetch origin
git rebase origin/main

# Clean up after merge
git branch -d <branch-name>
git remote prune origin
```

---

## 🎯 Success Metrics

Track these metrics to ensure healthy development:

### Development Velocity
- **Issues completed per week**: Target 2-3 milestone issues
- **PR merge time**: Target <2 days from creation to merge
- **Branch lifetime**: Target <3 days active development

### Quality Metrics
- **Test coverage**: Maintain >90%
- **Build success rate**: Target 100% on main branch
- **Documentation completeness**: All features documented

### Process Metrics
- **Issue resolution time**: Track time from assignment to closure
- **PR review cycles**: Target 1-2 review cycles per PR
- **Milestone completion**: Track actual vs estimated duration

---

This guide ensures consistent, traceable development while maintaining high quality standards. Always prioritize clear communication through GitHub issues and comprehensive testing before merging code.