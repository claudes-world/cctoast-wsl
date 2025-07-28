Guidelines for Writing LLM-Facing DocumentationThis is a framework for writing documentation that is primarily read by AI agents. Our goal is to create reference material that is well-organized, context-rich, and token-efficient, enabling agents to think, act, and create with clear intent. This is a thinking tool to empower judgment, not a rigid set of rules to enforce compliance.1. Guiding PrinciplesThese five principles govern all decisions when writing for LLM consumption:Intentionality First: Define your goal before you write: to Constrain, Guide, or Explore. A technical API doc constrains behavior for consistency. A design guide provides heuristics while allowing judgment. A research brief explores possibilities. Know which you're creating.Strategic Information Density: Every token must earn its place through value, not brevity. A detailed example that prevents a critical error is worth 50 tokens; a generic introduction provides zero value. Judge each element by its utility-to-token ratio. Dense ≠ short.Navigation Over Ceremony: Headers exist for findability. Delete "Introduction" and "Overview." Replace ceremonial headers with functional ones: "Authentication Requirements" not "Getting Started." Every structural element should help an LLM locate relevant information quickly.Progressive Disclosure: Layer information by necessity. Start with the 80% use case, then add complexity. This reduces cognitive load and prevents overwhelming the context with edge cases before fundamentals are established.Context Primacy: The most critical constraint or purpose always comes first. If there's one thing that changes everything else—a breaking limitation, a required prerequisite, a governing principle—it must be the opening statement. Never bury the lede.2. The Core Architecture: Fractal Information UnitsThe fundamental building block of LLM-facing documentation is the Information Unit—a simple three-part pattern that scales fractally.The Universal PatternContext (The "Why"): The goal, constraint, or situation that necessitates this information.Directives (The "How"): The actionable content—rules, code, steps, or questions.Clarification (The "What Else"): Edge cases, examples, gotchas, or references.Fractal ApplicationThis same pattern applies at every scale, making the structure predictable.Document Level:Context: "This guide helps customer service agents handle refunds consistently."
Directives: [Main sections with policies and procedures for different refund types.]
Clarification: "Exception: Fraud cases always escalate to the security team."
Section Level:Context: "Digital goods refunds within 30 days are processed differently than physical goods."
Directives: [Specific steps for digital refund processing.]
Clarification: "Note: Subscription refunds are prorated to the day of cancellation."
Paragraph Level:Context: "When a customer claims non-receipt of a digital good:"
Directives: "Check delivery logs, verify the email address, and resend if confirmed."
Clarification: "If delivery fails 3 times, escalate to technical support."
3. Defining Success (From the LLM's Perspective)Mission: To enable an LLM to understand context, act correctly, avoid predictable errors, and learn from both successes and failures.Success means the LLM can:Extract relevant information quickly without parsing unnecessary content.Apply guidance correctly in the appropriate context.Navigate to specific sections based on situational needs.Avoid predictable errors through proactive warnings and edge case handling.Adapt to new situations by understanding underlying principles.Learn from what has worked well and avoid repeating documented mistakes.4. Three Intent ModesYour documentation's intent fundamentally shapes its structure and content. Choose consciously.Mode 1: CONSTRAIN (Reduce Ambiguity)Purpose: Ensure consistent, predictable outcomes across all uses.When: Technical documentation, API references, compliance procedures, safety-critical processes.Techniques: Imperative commands, explicit conditionals (IF/THEN), comprehensive error handling, exact specifications.Example Structure:GitHub API rate limits: 5000 requests/hour for authenticated users.

Check remaining quota:
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit

Response headers to check:
- X-RateLimit-Remaining: [number]
- X-RateLimit-Reset: [unix timestamp]

When limit is reached:
- Returns 403 status code.
- Retry after the time specified in X-RateLimit-Reset.
- Do NOT retry immediately (risks temporary ban).
Mode 2: GUIDE (Provide Heuristics)Purpose: Build judgment while maintaining quality standards.When: Style guides, best practices, design principles, cultural documents.Techniques: Principles with rationale, Do/Don't patterns, flexible boundaries, contextual rules.Example Structure:## Error Message Guidelines

Principle: Help users recover, don't just report failures.

✓ DO: "Payment declined. Please try a different card or contact your bank."
    Why: Provides clear, actionable next steps for the user.

✗ DON'T: "Transaction failed. Error code 1045."
    Why: Technical codes are meaningless to most users and cause frustration.

Exception: Include specific error codes in technical logs for debugging purposes.
Mode 3: EXPLORE (Stimulate Thinking)Purpose: Generate novel solutions or perspectives.When: Research briefs, strategy documents, creative challenges, innovation workshops.Techniques: Open-ended questions, productive constraints, analogies, perspective shifts.Example Structure:## Product Innovation Brief: Reimagining User Onboarding

Current constraint: New users abandon our product during the 5-step signup process.

Explore these angles:
1. What if signup happened gradually during the first use, not all at once?
2. How do modern video games onboard new players without using forms?
3. If we could only ask ONE question to sign a user up, what would it be?
4. What would "anti-onboarding" look like (i.e., giving total access immediately)?

Success: 3 radically different approaches, not just small iterations on the current flow.
5. The Pattern Library: Practical TechniquesThe Verbosity BalanceHigh-Value Detail (Good Verbosity)Low-Value Fluff (Bad Verbosity)Multiple examples showing edge casesRestating the same pointStep-by-step breakdowns for complex processesAcademic theory for practical tasksContext preventing errors: "WARNING: This deletes all user data permanently."Generic statements: "Follow best practices."Specific technical details: "Timeout after 30s, retry 3x with exponential backoff."Vague instructions: "Implement error handling."Handling Updates and RevisionsTimestamp Significant Changes: ## Refund Policy (Updated 2025-07-27)Use Clear Markers: NEW:, DEPRECATED:, BREAKING:, MOVED:.Show Before/After for Breaking Changes:## API Authentication (BREAKING CHANGE - 2025-07-27)

Before: API key in URL parameter (`?key=YOUR_KEY`)
**After: API key in Authorization header (`Authorization: Bearer YOUR_KEY`)**

Reason: Aligns with modern security best practices.
Migration deadline: 2025-09-01.
Writing Effective Prompt Templates[Role + Context]
You are a financial analyst specializing in SaaS metrics, preparing a board presentation.

[Capabilities/Knowledge]
You excel at: Calculating and interpreting CAC, LTV, MRR growth.
You have deep knowledge of: SaaS business models, investor expectations for Series B.

[Constraints/Guidelines]
- Use only provided data; do not invent numbers.
- Highlight both positive trends and areas of concern.
- Keep slides to a 10-slide maximum.

[Output Preferences]
Format: Slide titles with 3-4 bullet points each.
Tone: Professional, confident, and direct.
6. Quality Heuristics[ ] Intent Clarity: Is the intent (constrain/guide/explore) clear from the first sentence?[ ] Quick Navigation: Can an LLM find the relevant section in seconds?[ ] Token Value: Does every token either enable action or prevent failure?[ ] Inline Context: Are edge cases addressed alongside the main directive?[ ] Unique Value: Would deleting any section lose unique, essential information?[ ] Structure Match: Does the format (e.g., rigid list vs. open questions) support the intent?7. When to Break These GuidelinesBreak guidelines consciously, not accidentally.Legal/Compliance: May require ceremonial sections for regulatory approval.Training Materials: Redundancy can be beneficial for human learning.Multi-Audience Docs: May need a human-friendly introduction.Key Principle: Document why you're breaking the guideline so future updaters understand the exception.8. Examples GalleryTechnical API Reference (CONSTRAIN Intent)## Payment Processing Endpoint

POST /api/v1/payments
Processes credit card transactions. PCI compliance required.

Required Headers:
- Authorization: Bearer [token]
- Content-Type: application/json
- X-Idempotency-Key: [unique UUID]

Request Body:
{
  "amount": 1000,      // In cents. Integer. Min: 50, Max: 999999
  "currency": "USD",   // ISO 4217. Supported: USD, EUR, GBP
  "card_token": "tok_...", // From Stripe.js/Braintree
  "metadata": {}         // Optional. Max 20 keys.
}

Success Response (200):
{ "id": "pay_...", "status": "succeeded", "amount": 1000 }

Error Responses:
- 400: Invalid parameters (check "errors" field in response body)
- 401: Invalid authorization token
- 402: Card declined (check "decline_code" in response body)
- 429: Rate limited (see X-RateLimit headers)

Idempotency: Using the same key within 24h returns the original response without re-processing.
Customer Service Escalation (GUIDE Intent)## Escalation Decision Framework

Principle: Empower agents to resolve issues at first contact when possible.

Standard Resolution Authority:
- Refunds up to $500
- Service credits up to 3 months
- Shipping upgrades to expedited

Escalate When:
- Customer requests a manager (always honor this request immediately).
- Refund exceeds your authority limit.
- Legal threats or safety concerns are mentioned.
- This is the third failed attempt to resolve the same issue.

De-escalation Techniques:
✓ DO: "I understand your frustration and I want to make this right for you."
✓ DO: "Let me see what options I have available to solve this."
✗ DON'T: "That's not my department."
✗ DON'T: "There's nothing more I can do."

Edge Cases:
- VIP customers (diamond tier): Transfer directly to the senior support queue.
- Press inquiries: Transfer immediately to the PR team. Do not comment.
Brand Voice Exploration (EXPLORE Intent)## Reimagining Our Brand Voice

Current voice: Professional, authoritative, formal.
Challenge: Connect with a Gen Z audience without losing our credibility.

Exploration Prompts:

1.  **Channel Mixing**: What if our error messages talked like a helpful friend, but our legal documents remained formal? Provide examples.
2.  **Personality Spectrum**: Plot our voice on these scales:
    - Serious ←—→ Playful
    - Expert ←—→ Peer
    - Polished ←—→ Raw
    Where are we today? Where could we move? Justify your choices.
3.  **Unexpected Inspiration**:
    - How would a favorite science teacher explain our product?
    - What would our brand sound like as a podcast host?
    - If our app could only use five emojis, which five would tell our story?
4.  **Constraint Exercise**: Rewrite our homepage copy using only questions.

Success: Three distinct voice samples that feel fresh but still authentically "us."
Meta NoteThis guide demonstrates its own principles. Its primary Intent is to Guide you in building judgment about writing for LLMs. It uses a fractal structure with Context-Directives-Clarification at multiple levels, employs strategic verbosity where examples add value, and uses progressive disclosure to move from principles to practice. Updated 2025-07-27, 8:19 PM EDT, Toronto, ON, to incorporate the why/how/what else mental model and richer practical examples.