---
name: ui-copy-generator
description: 'Generate or rewrite product UI copy, microcopy, error messages, empty states, success messages, headings, button labels, and plan messaging in this product''s existing voice. Use when UI wording needs to be created, tightened, reviewed, or made more human and action-oriented.'
argument-hint: 'What UI surface needs copy, what happened, and should the result be new copy, a rewrite, or several options?'
---

# UI Copy Generator

Write product UI copy that matches this repository's established voice: clear, concise, human, and action-oriented.

This is a workspace skill. Use it when the task is specifically about wording, labels, messages, or tone, not when the request is general implementation work.

## When to Use

- The user wants new UI copy for a page, dialog, empty state, banner, toast, form, or report surface.
- Existing copy sounds too technical, too formal, too vague, or too long.
- Error, loading, or success messaging needs to be rewritten in plain language.
- A feature or plan message must explain access, limits, or next steps without backend language.
- Several wording options are useful for review.

## Product Voice

- Match the product's existing voice.
- Write clear, concise, human copy.
- Help the user understand what happened or what to do next.
- Prefer plain, direct wording over formal or verbose phrasing.
- Avoid technical or internal language such as APIs, status codes, backend terms, authorization jargon, or implementation details.

## Examples

Good

- "We were unable to load your reports at this time. Please try again later."
- "Your changes have been saved."
- "Your current subscription does not include access to these reporting features"
- "What’s included in your {PLAN_NAME} plan"

Bad

- "API call failed with status 500."
- "Unauthorized access."
- "These reporting capabilities are active for the current subscription tier."

## Inputs to Confirm

- Surface: page, modal, toast, form field, table empty state, section heading, CTA, or other UI element
- Situation: success, error, empty, loading, blocked access, confirmation, onboarding, or informational
- Audience: role or user type if it materially changes wording
- Desired output: single recommendation, rewrite, short list of options, or full copy set
- Constraints: character limits, button width, localization sensitivity, required terms, or plan names

If one of these is missing and it matters, ask briefly. If not, choose a pragmatic default and state it.

## Procedure

1. Identify the user-facing outcome.
   - Determine what happened, what the user needs to know, and whether a next step should be stated.
   - Strip out implementation detail that does not help the user act.

2. Choose the right message shape.
   - Use short labels for buttons, tabs, and field names.
   - Use one or two sentences for empty, success, and error states.
   - Use headings to orient the user quickly, not to restate internal feature names.

3. Draft in plain language.
   - Prefer common verbs such as load, save, view, try again, continue, and contact support when needed.
   - Name the user impact before the system detail.
   - If action is possible, state it directly.

4. Remove product-hostile wording.
   - Replace technical phrases with plain-language equivalents.
   - Remove status codes, internal service names, permission jargon, and backend framing.
   - Avoid passive, abstract, or legalistic phrasing unless the product context requires it.

5. Tighten the copy.
   - Remove filler words, duplicate ideas, and throat-clearing.
   - Keep only the information needed to orient or unblock the user.
   - Prefer one strong default option over many weak variants unless the user asked for choices.

6. Validate against the quality bar.
   - The wording should sound natural in the product.
   - The message should be understandable without technical context.
   - The user should know what happened, what it means, or what to do next.
   - The copy should be concise enough for the UI surface.

## Decision Rules

- If the message is an error: explain the user-visible problem first, then add the next step if there is one.
- If the message is a blocked-access or plan message: be direct about availability without sounding punitive or technical.
- If the copy is for a CTA: use a concrete verb and avoid vague labels like "Submit" when a more specific action exists.
- If the copy is for a heading: orient the user to the content, not the internal implementation.
- If several tones are plausible: default to the clearest, most neutral option that fits the existing product.

## Output Patterns

- Single recommendation: give the best final wording with a short note on why it fits.
- Rewrite set: show original and revised copy.
- Option set: provide 2 to 4 options with brief tradeoffs.
- Full surface pass: cover heading, supporting text, CTA, empty state, and error copy together when requested.

## Completion Check

Before finishing, confirm that the copy:

- sounds like product language, not engineering language
- is easy to scan quickly
- tells the user what happened or what to do next
- avoids unnecessary jargon and verbosity
- fits the requested UI surface and constraints