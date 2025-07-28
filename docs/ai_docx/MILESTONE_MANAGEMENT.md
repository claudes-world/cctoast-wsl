# Milestone Management with GitHub CLI

GitHub CLI doesn't have native milestone commands. Use `gh api` to manage milestones via the GitHub REST API.

## Commands

```bash
# List (GET) all milestones with key info
gh api repos/:owner/:repo/milestones --jq '.[] | {number, title, due_on, open_issues, closed_issues}'

# Create milestone (POST) with due date
gh api repos/:owner/:repo/milestones --method POST \
  --field title="1.0 - Initial Release" \
  --field description="Core functionality" \
  --field state="open" \
  --field due_on="2025-03-31T23:59:59Z"

# View (GET) specific milestone details
gh api repos/:owner/:repo/milestones/1

# Update (PATCH) milestone description or due date
gh api repos/:owner/:repo/milestones/1 --method PATCH \
  --field description="Updated description"

# Close (PATCH) milestone when complete
gh api repos/:owner/:repo/milestones/1 --method PATCH \
  --field state="closed"

# Delete (DELETE) milestone (careful - removes from all issues)
gh api repos/:owner/:repo/milestones/1 --method DELETE

# Assign issue to milestone by title
gh issue edit 5 --milestone "1.0 - Initial Release"

# Remove issue from milestone
gh issue edit 5 --milestone ""

# List all issues in specific milestone
gh issue list --milestone "1.0 - Initial Release"

# Generate progress report for all milestones
gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title): \(.closed_issues)/\(.open_issues + .closed_issues) complete"'
```

## Current Project Milestones

- **1**: 1.0 - Initial WSL Release (2025-03-31)
- **2**: 1.1 - WSL Enhancements (2025-06-30) 
- **3**: 2.0 - macOS Support (2025-09-30)
- **4**: 2.1 - Linux Desktop Support (2025-12-31)

## Notes

- Use ISO 8601 format for dates: `YYYY-MM-DDTHH:MM:SSZ`
- Milestone numbers persist even after deletion
- Always test with `--dry-run` when available