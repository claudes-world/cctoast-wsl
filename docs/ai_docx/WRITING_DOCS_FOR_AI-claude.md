# Guidelines for Writing LLM-Facing Documentation

Guidelines for writing docs that are primarily LLM-facing (read by AI agents) that are well organized, informationally dense, and efficient.

This is a thinking framework, not a rulebook. It provides mental models and principles to help you create reference material that enables LLMs to understand context quickly, act appropriately, and avoid predictable errors. Apply these guidelines with judgment, adapting them to your specific needs.

## 1. Guiding Principles

These five principles govern all decisions when writing for LLM consumption:

1. **Intentionality First**: Define your goal before you write (Constrain, Guide, or Explore). Your intent shapes everything else. A technical API doc constrains behavior for consistency. A design guide provides heuristics while allowing judgment. A research brief explores possibilities. Know which you're creating.

2. **Strategic Information Density**: Every token must earn its place through value, not brevity. Dense ≠ short. A detailed example that prevents a critical error is worth 50 tokens. A generic introduction paragraph provides zero value. Judge each element by its utility-to-token ratio.

3. **Navigation Over Ceremony**: Headers exist for findability. Delete "Introduction" and "Overview" sections. Replace ceremonial headers with functional ones: "Authentication Requirements" not "Getting Started". Every structural element should help an LLM locate relevant information quickly.

4. **Progressive Disclosure**: Layer information by necessity - basic needs first, sophistication follows. Start with the 80% use case. Add complexity only when the simpler approach is mastered. This reduces cognitive load and prevents overwhelming the context with edge cases before fundamentals are established.

5. **Context Primacy**: The most critical constraint or purpose always comes first. If there's one thing that changes everything else - a breaking limitation, a required prerequisite, a governing principle - it must be the opening statement. Never bury the lede.

## 2. The Core Architecture: Fractal Information Units

The fundamental building block of LLM-facing documentation is the **Information Unit** - a simple three-part pattern that scales fractally:

### The Universal Pattern

1. **Context** (The "Why"): The goal, constraint, or situation that necessitates this information
2. **Directives** (The "How"): The actionable content - rules, code, steps, or questions  
3. **Clarification** (The "What Else"): Edge cases, examples, gotchas, or references

### Fractal Application

This same pattern applies at every scale:

```
+--------------------------------------------------+
| DOCUMENT (Information Unit)                      |
| Context: Overall document purpose                |
| Directives:                                      |
|   +----------------------------------------------+
|   | SECTION (Information Unit)                   |
|   | Context: Section goal                        |
|   | Directives: Core content                     |
|   | Clarification: Section-specific edge cases   |
|   +----------------------------------------------+
|   +----------------------------------------------+
|   | SECTION (Information Unit)                   |
|   | Context: Different section goal              |
|   | Directives: Different core content           |
|   | Clarification: Different edge cases          |
|   +----------------------------------------------+
| Clarification: Global references, exceptions     |
+--------------------------------------------------+
```

**Real Example - This Guide:**
```
Context: "Guidelines for writing LLM-facing documentation"
Directives: [Sections 1-8: Principles through Examples]
Clarification: "Break guidelines consciously, not accidentally"
    |
    └── Section Example:
        Context: "Three Intent Modes section explains when to constrain vs guide vs explore"
        Directives: [Detailed explanation of each mode with techniques]
        Clarification: "Choose intent consciously - it shapes everything else"
```

The power lies in the self-similarity. Once an LLM recognizes this pattern, it can efficiently parse information at any level of detail.

## 3. Defining Success (From the LLM's Perspective)

> **Mission**: Enable an LLM to understand context, act correctly, and avoid predictable errors while building on successes and learning from failures.

Success means the LLM can:
- **Extract** relevant information quickly without parsing unnecessary content
- **Apply** guidance correctly in the appropriate context
- **Navigate** to specific sections based on situational needs
- **Avoid** predictable errors through proactive warnings and edge case handling
- **Adapt** to new situations by understanding underlying principles
- **Learn** from what has worked well and avoid repeating documented mistakes

This isn't about creating perfect documentation - it's about creating documentation that fails gracefully and improves over time.

## 4. Three Intent Modes

Your documentation's intent fundamentally shapes its structure and content. Choose consciously:

### Mode 1: CONSTRAIN (Reduce Ambiguity)

**Purpose**: Ensure consistent, predictable outcomes across all uses  
**When to Use**: Technical documentation, API references, compliance procedures, safety-critical processes  

**Techniques**:
- Imperative commands: "Set timeout to 30 seconds"
- Explicit conditionals: "IF status = 'pending' THEN wait 5 minutes"  
- Comprehensive error handling: "On 403 error, refresh auth token"
- Exact specifications: "Temperature must be 18-22°C"

**Example Structure**:
```
GitHub API rate limits: 5000 requests/hour for authenticated users.

Check remaining quota:
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/rate_limit

Response headers:
X-RateLimit-Remaining: [number]
X-RateLimit-Reset: [unix timestamp]

When limit reached:
- Returns 403 status code
- Retry after X-RateLimit-Reset time
- Do NOT retry immediately (risks ban)
```

### Mode 2: GUIDE (Provide Heuristics)

**Purpose**: Build judgment while maintaining quality standards  
**When to Use**: Style guides, best practices, design principles, cultural documents  

**Techniques**:
- Principles with rationale: "Prefer clarity over cleverness because..."
- Do/Don't patterns: Show good and bad examples side by side
- Flexible boundaries: "Generally X, except when Y"
- Contextual rules: "In customer emails, formal; in chat, conversational"

**Example Structure**:
```
Error Message Guidelines

Principle: Help users recover, don't just report failures.

✓ DO: "Payment declined. Try a different card or contact your bank."
   Why: Provides clear next steps

✗ DON'T: "Transaction failed. Error code 1045."
   Why: Technical codes don't help users

Exception: Include error codes in technical logs for debugging.
```

### Mode 3: EXPLORE (Stimulate Thinking)

**Purpose**: Generate novel solutions or perspectives  
**When to Use**: Research briefs, strategy documents, creative challenges, innovation workshops  

**Techniques**:
- Open-ended questions: "What if we removed this constraint?"
- Productive constraints: "Design a solution using only..."
- Analogies: "How would nature solve this problem?"
- Perspective shifts: "From the competitor's view, what's our weakness?"

**Example Structure**:
```
Product Innovation Brief: Reimagining User Onboarding

Current constraint: New users abandon during the 5-step signup.

Explore these angles:
1. What if signup happened gradually during first use?
2. How do video games onboard without forms?
3. If we could only ask ONE question, what would it be?
4. What would "anti-onboarding" look like?

Success: 3 radically different approaches, not iterations on current flow.
```

## 5. The Pattern Library: Practical Techniques

### The Verbosity Balance

Strategic verbosity means including detail that adds value, not words:

| High-Value Detail | Low-Value Fluff |
|---|---|
| Multiple examples showing edge cases: "Refund scenarios: damaged (full), didn't like (store credit), wrong size (exchange)" | Restating the same point: "It's important to handle refunds properly. Proper refund handling is essential." |
| Step-by-step breakdowns for complex processes: "1. Export CSV 2. Remove PII columns 3. Validate format 4. Upload to S3" | Academic theory for practical tasks: "The theoretical foundation of customer service derives from..." |
| Context preventing errors: "WARNING: This deletes all user data permanently. No recovery possible." | Generic statements: "Follow best practices when implementing." |
| Specific technical details: "Timeout after 30 seconds, retry 3x with exponential backoff: 1s, 2s, 4s" | Vague instructions: "Implement appropriate error handling." |

**Example - Variable Naming**:
```javascript
// ❌ Bad (vague, 35 tokens, no value):
// "It's important to consider various factors when naming variables. 
// Good naming conventions enhance code readability and maintenance."

// ✓ Good (specific, 45 tokens, high value):
// Variable names must capture intent:
userAuthToken        // clear purpose
isPaymentProcessing  // boolean intent obvious  
calculateTotalWithTax()  // verb for functions
// Never use: strName (Hungarian), data (generic), x (except loops)
```

### Handling Updates and Revisions

Make changes visible and contextual:

**Timestamp Significant Changes**:
```
## Refund Policy (Updated 2025-07-27)

Previous: All refunds within 30 days
**NEW: Digital goods - 14 days, Physical goods - 30 days**
Reason: Aligned with EU consumer protection laws
```

**Use Clear Markers**:
- `NEW:` for additions
- `DEPRECATED:` for phase-outs  
- `BREAKING:` for incompatible changes
- `MOVED:` for relocated content

**Show Before/After for Breaking Changes**:
```
## API Authentication (BREAKING CHANGE - 2025-07-27)

Before: API key in URL parameter
GET https://api.example.com/data?key=YOUR_KEY

**After: API key in Authorization header**
GET https://api.example.com/data
Headers: Authorization: Bearer YOUR_KEY

Migration deadline: 2025-09-01
```

### Writing Effective Prompt Templates

Structure templates for clarity and completeness:

```
[Role + Context]
You are a financial analyst specializing in SaaS metrics, preparing a board presentation for a Series B startup.

[Capabilities/Knowledge]
You excel at: 
- Calculating and interpreting key metrics (CAC, LTV, MRR growth)
- Creating executive-level visualizations
- Identifying trends and anomalies in financial data

You have deep knowledge of:
- SaaS business models and unit economics
- Investor expectations for Series B companies
- Industry benchmarks for B2B SaaS

[Constraints/Guidelines]
- Use only provided data; do not invent numbers
- Highlight both positive trends and areas of concern
- Keep slides to 10 maximum
- Focus on metrics that matter for next funding round

[Output Preferences]
Format: Slide titles with 3-4 bullet points each
Tone: Professional but accessible, confident but honest
Length: Executive summary + 10 slides
```

### Common Application Scenarios

**Writing Complete Documents**: 
1. Define intent (Constrain/Guide/Explore)
2. Write document-level Context
3. Outline major sections as Directives
4. Add document-level Clarifications
5. Recurse: Apply same pattern to each section

**Adding to Existing Docs**:
1. Match surrounding style and tone
2. Use consistent header hierarchy
3. Apply Information Unit pattern within existing structure
4. Mark additions with (NEW: ) if significant
5. Preserve document's overall intent

**Creating Reference Libraries**:
- Establish consistent patterns across all documents
- Use same header structure for similar content types
- Create a master index with intent labels
- Standardize metadata (last updated, version, scope)

## 6. Quality Heuristics

Before finalizing, check your work:

- [ ] **Intent Clarity**: Is the intent (constrain/guide/explore) clear from the first sentence?
- [ ] **Quick Navigation**: Can an LLM navigate to relevant sections in <10 seconds?
- [ ] **Token Value**: Does every token either enable action or prevent failure?
- [ ] **Inline Context**: Are common edge cases addressed inline with relevant content?
- [ ] **Unique Value**: Would deleting any section lose unique information?
- [ ] **Structure Match**: Does the structure support the stated intent?

## 7. When to Break These Guidelines

Break guidelines consciously, not accidentally:

- **Legal/Compliance Documents**: May require ceremonial sections for regulatory approval
- **Training Materials**: Beneficial redundancy helps learning through repetition
- **Multi-Audience Docs**: Human-friendly introductions when LLMs and humans both read
- **Legacy Systems**: Match existing patterns to avoid confusion
- **Gradual Migration**: Phase in new patterns rather than wholesale rewrites

Key principle: Document why you're breaking the guideline so future updaters understand the exception.

## 8. Examples Gallery

### Technical API Reference (CONSTRAIN Intent)

```
Context: Payment processing endpoint. PCI compliance required.

Directives:
POST /api/v1/payments

Required Headers:
- Authorization: Bearer [token]
- Content-Type: application/json
- X-Idempotency-Key: [unique UUID]

Request Body:
{
  "amount": 1000,      // cents, min: 50, max: 999999
  "currency": "USD",   // ISO 4217, supported: USD, EUR, GBP
  "card_token": "tok_...",  // from Stripe.js
  "metadata": {}       // optional, max 20 keys
}

Success Response (200):
{
  "id": "pay_...",
  "status": "succeeded",
  "amount": 1000
}

Clarification:
- 400: Invalid parameters (check "errors" field)
- 401: Invalid authorization token  
- 402: Card declined (check "decline_code")
- 429: Rate limited (see X-RateLimit headers)
- Idempotency: Same key within 24h returns original response
```

### Customer Service Escalation (GUIDE Intent)

```
Context: Empower agents to resolve issues at first contact when possible.

Directives:
Standard Resolution Authority:
- Refunds up to $500
- Service credits up to 3 months  
- Shipping upgrades to expedited

Escalate When:
- Customer requests manager (always honor)
- Refund exceeds authority limit
- Legal threats or safety concerns
- Third failed resolution attempt

De-escalation Techniques:
✓ "I understand your frustration and want to make this right"
✓ "Let me see what options I have available"
✗ "That's not my department"
✗ "There's nothing I can do"

Clarification:
- VIP customers (diamond tier): Direct to senior support
- Press inquiries: Transfer to PR team immediately
- Technical issues beyond scope: Warm transfer to engineering
```

### Brand Voice Exploration (EXPLORE Intent)

```
Context: Current voice is professional/formal. Need to connect with Gen Z without losing credibility.

Directives:
1. Channel Mixing: What if error messages talked like a helpful friend, but legal docs stayed formal?

2. Personality Spectrum: Plot our voice on these scales:
   - Serious ←→ Playful
   - Expert ←→ Peer
   - Polished ←→ Raw
   Where today? Where could we move?

3. Unexpected Inspiration: 
   - How would a favorite teacher explain our product?
   - What would our brand sound like as a podcast host?
   - If our app could only use emojis, which five tell our story?

4. Constraint Exercise: Rewrite our homepage with:
   - Only questions
   - No adjectives
   - Like explaining to a smart 10-year-old

Clarification:
Success = Three distinct voice samples that feel fresh but still "us"
```

## Meta Note

This guide demonstrates its own principles: clear Guide intent helping you build judgment about writing for LLMs, fractal structure with Context-Directives-Clarification at multiple levels, strategic verbosity where examples add value, and progressive disclosure from principles to practice. Headers aid navigation, not ceremony. Every token earned its place. Updated 2025-07-27 to incorporate the why/how/what else mental model for intuitive understanding of Information Units.