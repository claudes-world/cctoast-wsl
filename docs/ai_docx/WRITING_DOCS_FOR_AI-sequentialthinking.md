# Writing Documentation for AI Agents

Framework for creating token-efficient, informationally dense documentation that AI agents can quickly understand and apply. This is a thinking tool to empower judgment, not rigid rules.

**Goal**: Enable LLMs to extract context, act correctly, and avoid predictable errors while maximizing information density per token.

## The 15-70-15 Framework

### Structure Rule
- **15% Context/Constraints** - Lead with what doesn't work, key limitations
- **70% Actionable Content** - Commands, examples, core techniques
- **15% Clarification** - Edge cases, quality gates, exceptions

### Information Units (Fractal Pattern)
Every documentation unit follows: **Context → Directives → Clarification**

```
+--------------------------------------------------+
| DOCUMENT (Information Unit)                      |
| Context: Overall constraint/purpose              |
| Directives:                                      |
|   +----------------------------------------------+
|   | SECTION (Information Unit)                   |
|   | Context: Section-specific goal               |
|   | Directives: Core actionable content          |
|   | Clarification: Section edge cases            |
|   +----------------------------------------------+
| Clarification: Global exceptions, references    |
+--------------------------------------------------+
```

## Three Intent Modes

Choose your intent consciously - it shapes everything:

### CONSTRAIN (Reduce Ambiguity)
**When**: API docs, compliance, safety-critical processes
**Techniques**: Imperative commands, exact specifications, comprehensive error handling

```bash
# GitHub API rate limits: 5000/hour authenticated users
curl -H "Authorization: token TOKEN" https://api.github.com/rate_limit

# Response headers (required):
# X-RateLimit-Remaining: [number]  
# X-RateLimit-Reset: [unix timestamp]

# When limit reached:
# - Returns 403 status code
# - Retry after X-RateLimit-Reset time
# - Do NOT retry immediately (risks ban)
```

### GUIDE (Provide Heuristics)  
**When**: Style guides, best practices, design principles
**Techniques**: Principles with rationale, Do/Don't patterns, flexible boundaries

```
Error Message Guidelines

Principle: Help users recover, don't just report failures.

✓ "Payment declined. Try a different card or contact your bank."
  Why: Provides actionable next steps

✗ "Transaction failed. Error code 1045."  
  Why: Technical codes don't help users

Exception: Include error codes in technical logs for debugging.
```

### EXPLORE (Stimulate Thinking)
**When**: Research briefs, strategy docs, innovation challenges  
**Techniques**: Open questions, productive constraints, analogies, perspective shifts

```
Product Innovation: Reimagining User Onboarding

Current constraint: Users abandon during 5-step signup.

Explore:
1. What if signup happened gradually during first use?
2. How do video games onboard without forms?
3. If we could only ask ONE question, what would it be?

Success: 3 radically different approaches, not iterations.
```

## Core Writing Techniques

### Command-First Approach
Show copy-pasteable code with inline technical annotations:

```bash
# List (GET) all milestones with key info
gh api repos/:owner/:repo/milestones --jq '.[] | {number, title}'

# Create (POST) milestone with due date
gh api repos/:owner/:repo/milestones --method POST \
  --field title="1.0 - Release" \
  --field due_on="2025-03-31T23:59:59Z"  # ISO 8601 format

# Update (PATCH) milestone state  
gh api repos/:owner/:repo/milestones/1 --method PATCH \
  --field state="closed"  # careful - affects all assigned issues
```

### Real Data Over Examples
Use actual project data: `milestone 1` not `milestone N`
Include current state: our 4 milestones with real dates
Show realistic scenarios: `/home/user/.claude/settings.json`

### Strategic Verbosity Balance

| High-Value Detail | Low-Value Fluff |
|---|---|
| Multiple edge case examples: "Refund: damaged (full), didn't like (store credit), wrong size (exchange)" | Restating same point: "It's important to handle refunds properly. Proper refund handling is essential." |
| Specific technical details: "Timeout 30s, retry 3x: 1s, 2s, 4s exponential backoff" | Vague instructions: "Implement appropriate error handling." |
| Error prevention context: "WARNING: Deletes all user data permanently. No recovery possible." | Generic statements: "Follow best practices when implementing." |

### Zero Ceremony Principles
- No "Introduction" or "Overview" headers
- Lead with constraints, not background theory
- Use functional headers: "Authentication Requirements" not "Getting Started"
- Jump straight to utility

### Handling Updates
Mark changes clearly:
```
## API Authentication (BREAKING CHANGE - 2025-07-27)

Before: API key in URL parameter
GET https://api.example.com/data?key=YOUR_KEY

**After: API key in Authorization header**  
GET https://api.example.com/data
Headers: Authorization: Bearer YOUR_KEY

Migration deadline: 2025-09-01
```

## Quality Gates

Before finalizing, verify:

- [ ] **Copy-pasteable**: Can developers immediately use every command?
- [ ] **Intent clarity**: Is the intent (constrain/guide/explore) clear from first sentence?
- [ ] **Real data**: Uses actual project numbers/names instead of placeholders?
- [ ] **Token value**: Does every token either enable action or prevent failure?
- [ ] **Integrated details**: Technical info inline with commands, not separate?
- [ ] **Navigation speed**: Can LLM find relevant sections in <10 seconds?
- [ ] **Deletability test**: Could you remove any section without losing essential info?

## When to Break Guidelines

Break consciously, not accidentally:

- **Legal/Compliance**: May require ceremonial sections for regulatory approval
- **Multi-audience docs**: Human-friendly introductions when both LLMs and humans read
- **Legacy system integration**: Match existing patterns to avoid confusion

Key principle: Document why you're breaking the guideline so future updaters understand the exception.

## Examples Gallery

### Technical Reference (CONSTRAIN)
```
Context: Payment processing endpoint. PCI compliance required.

POST /api/v1/payments

Required Headers:
- Authorization: Bearer [token]
- Content-Type: application/json  
- X-Idempotency-Key: [unique UUID]

Request Body:
{
  "amount": 1000,      // cents, min: 50, max: 999999
  "currency": "USD",   // ISO 4217: USD, EUR, GBP
  "card_token": "tok_..." // from Stripe.js
}

Error Responses:
- 400: Invalid parameters (check "errors" field)
- 402: Card declined (check "decline_code")  
- 429: Rate limited (see X-RateLimit headers)
```

### Process Guide (GUIDE)
```
Context: Empower agents to resolve at first contact when possible.

Standard Authority:
- Refunds up to $500
- Service credits up to 3 months
- Shipping upgrades to expedited

Escalate When:
- Customer requests manager (always honor)
- Amount exceeds authority limit
- Legal threats mentioned
- Third failed resolution attempt

Techniques:
✓ "I understand your frustration and want to make this right"
✗ "That's not my department"
```

---

*This guide demonstrates its own principles: Guide intent, 15-70-15 structure, Context-Directives-Clarification at multiple levels, command-first examples with real data, and strategic verbosity where examples prevent errors. Every token earned its place. Updated 2025-07-27.*