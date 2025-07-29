---
allowed-tools: Bash(gh issues list:*), Bash(gh issues view:*), Bash(gh label list:*), Bash(gh pr list:*), Bash(gh pr view:*), Bash(git worktree add:*), Bash(git worktree list:*), Bash(git branch:*), Bash(git checkout:*)
description: Start a worktree branch for an issue.
argument-hint: Issue number to initialize a worktree for. Example: `#1234`
---

Read gh issue $ARGUMENTS and all the comments, associated issues, and PRs associated with it.

Check is there is already an active branch for this issue. And check if we have a local worktree for this issue.

If there isn't a local worktree setup for this issue, create one inside the `worktrees` directory.

Make sure to follow the feat/fix/chore/refactor/docs/test/style/perf/build/ci/etc. naming convention, and include the issue number in the branch name. Example: `feat/1234-add-new-feature`

If there is already a local worktree setup for this issue, check if the active branch is the same as the issue branch. Then checkout the worktree branch and pull the remote branch. 

Check if the worktree branch is fully synced with origin main. If it is not, as the user if they want to merge the remote main into the worktree branch. If they do, make sure to merge without committing. The manually review and state the merged changes.

Once the local worktree is setup think about the next steps. From reviewing the gh issues, comments, and PRs, and git activity, what should we do next? Plan out the next steps (and outline anything that has already been done). Write this plan out in a markdown file called `next-steps-<issue-number>.md` in the `worktrees` directory.

Once the planning docs is done, give the user a quick status update. Tell them:
- Worktree <name> is now setup.
- It is located in <path>
- It is <n> commits behind and <m> commits ahead of origin main.
- A short summary of the work already done and last things completed
- A short summary of the remaining work. And a list of the next steps.
- A recommendation of what you think the user should do next.
- Link to the planning `next-steps-<issue-number>.md` file.
> Reminder 

