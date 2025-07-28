How to write concise yet informationally-dense and useful docs for guiding 
LLM AI Agents.

Guide for crafting token-efficient docs for LLM agents, serving
as guidelines, frameworks, memories, processes, cheatsheets, etc.

**WHEN:** Whenever documentation is primarily meant for consumption by LLM agents (or developers).

Applies to standalone documents, sections within larger guides, prompt templates, workflow updates, or any agent-facing documentation. 

Maximize density, utility, and adaptability; 
minimize fluff, ambiguity, cognitive load, and token waste.

Use judgment: Verbosity for rich examples/context is good if it clarifies without waste. Headers/sections aid organization if strategic (e.g., for nesting or scannability)—not mandatory.

- Avoid unnecessary characters in tables. Eg
Good:
| Here is a table | With a header |
|---|---|
| Column 1 | Column 2 |
| Row 2 | Row 2 |


Bad:
| Here is a table | With a header |
|-----------------|---------------|
| Column 1        | Column 2      |
| Row 2           | Row 2         |



**What has worked well:**

1. Front-loaded context: Started with the essential context (GitHub CLI doesn't have native milestone commands, use gh api to manage milestones)
2. Command-first approach: Showed the actual commands people need, with brief explanatory comments
3. Practical examples: Used real project data (the actual milestone numbers and names)
4. Grouped logically: Commands are in logical order (list → create → view → update → delete → assign)
5. Minimal but sufficient explanation: Each command has just enough context to understand when/why to use it
6. Quick reference section: The current milestones table for immediate context


Principles for ultra-concise but dense documentation:

1. Context Compression

- Lead with the minimum viable context needed
- Skip obvious explanations 
- Focus on "what you need to know that isn't obvious"

2. Command-First Philosophy

- Show the actual commands people will copy/paste
- Comments should be action-oriented ("List all...", "Create milestone...")
- Include examples with real/realistic data

3. Information Layering

- Essential commands first
- Edge cases and warnings inline but brief
- Reference data (like project milestones) at bottom

4. Semantic Density

- Every word should serve a purpose
- Use technical shorthand where appropriate
- Group related operations together

5. Scannable Structure

- Use consistent comment patterns
- Group by operation type or workflow

- Include just enough whitespace for readability

6. Context-Aware Examples

I'll focus on creating documentation that provides meaningful, practical examples. Real project data brings documentation to life, showing not just syntax but actual use cases. By including both typical scenarios and potential pitfalls, I can help users understand nuanced application of commands and APIs.

7. Progressive Enhancement

Documentation should guide users from basic operations to more advanced techniques. Start with fundamental commands that solve immediate needs, then gradually introduce more sophisticated workflows. Power-user shortcuts become the final layer, allowing experienced users to optimize their processes.

8. Cognitive Load Optimization

Minimize mental overhead by creating predictable, consistent documentation. Each line or block should communicate a single concept clearly. Maintain uniform naming conventions and structure across similar documents, helping users quickly understand and apply the information.

9. Zero Fluff Policy

Strip away unnecessary verbiage. Documentation should be a direct, efficient transfer of critical information. Eliminate introductory language, avoid stating the obvious, and remove redundant explanations that don't add value.

10. Future-Proof Brevity

I'll prioritize stable patterns over transient implementation details. Include just enough context for users to adapt commands across different environments. Only mention version-specific information when it's absolutely crucial for understanding.

The goal is creating documentation that's dense, clear, and immediately useful across different contexts.


---


# Ultra-Dense Documentation Framework for AI Agents

Framework for writing maximum information density docs that minimize token usage while maximizing utility.

## The 15-70-15 Rule

- **15% Constraint/Problem** - Lead with what doesn't work (1-2 sentences max)
- **70% Commands** - Copy-pasteable code with inline technical annotations
- **15% Reference** - Current project state and essential gotchas

## 5 Core Writing Rules

### 1. Constraint-First Opening
Lead with the limitation, then show the solution:
```
"GitHub CLI doesn't have native milestone commands. Use `gh api`..."
```

### 2. Command-Centric Content
```bash
# List (GET) all milestones with key info
gh api repos/:owner/:repo/milestones --jq '.[] | {number, title}'

# Create (POST) milestone with due date  
gh api repos/:owner/:repo/milestones --method POST \
  --field title="1.0 - Release" \
  --field due_on="2025-03-31T23:59:59Z"
```

### 3. Real Data Over Examples
Use actual project data: `milestone 1` not `milestone N`
Include current state: our 4 milestones with real dates

### 4. Technical Precision Inline
- HTTP methods: `# (GET)`, `# (POST)`, `# (PATCH)`, `# (DELETE)`
- Warnings: `# careful - removes from all issues`
- Exit codes and error conditions

### 5. Zero Ceremony
No "Introduction" or "Overview" headers. Jump straight to utility.

## Quality Gates

- **Copy-pasteable**: Can developers immediately use every command?
- **Real data**: Uses actual project numbers/names instead of placeholders?
- **Integrated details**: Technical info inline with commands, not separate?
- **Deletability test**: Could you remove any section without losing essential info?

## Example: Before/After

**Before (verbose):**
```
## Introduction
This document explains how to manage GitHub milestones...

## Overview
Milestones are a way to track progress...
```

**After (dense):**
```
GitHub CLI doesn't have native milestone commands. Use `gh api`.

# List (GET) all milestones
gh api repos/:owner/:repo/milestones
```

Every word must earn its token cost.