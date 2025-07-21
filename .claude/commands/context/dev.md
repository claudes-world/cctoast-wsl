---
allowed-tools: Bash(gh issues list:*), Bash(gh issues view:*)
description: Load in developer context.
argument-hint:
---

READ THESE FILES IN PARALLEL:

@docs/ARCHITECTURE.md
@docs/DEVELOPER_WORKFLOW.md
@docs/IMPLEMENTATION_PLAN.md
@docs/PRD.md


gh label create "milestone" --description "Major milestone tracking" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "documentation" --description "Documentation" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "bug" --description "Bug" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "enhancement" --description "Enhancement" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "good first issue" --description "Good first issue" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "help wanted" --description "Help wanted" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "question" --description "Question" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "wontfix" --description "Won't fix" --color "0052cc" --repo "claudes-world/cctoast-wsl"
gh label create "wip" --description "Work in progress" --color "0052cc" --repo "claudes-world/cctoast-wsl"