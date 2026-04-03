---
name: frontend-design
description: Use this skill when the user asks to build, redesign, restyle, or polish a frontend interface such as a website, landing page, dashboard, application shell, marketing page, React component, HTML/CSS layout, visual artifact, or web-based interactive experience. Maintain a distinctive, production-grade design direction and avoid generic AI-looking UI.
---

Create distinctive, production-grade frontend interfaces in code. Keep the original product intent, but raise the design quality, cohesion, and finish.

## Use This Skill

Use this skill when the task is primarily about frontend UI design or visual implementation.

Typical triggers:
- Build a new page, component, or interface
- Redesign or restyle an existing frontend
- Improve visual quality, layout, typography, motion, or polish
- Create a web-based artifact such as a poster, promo page, microsite, dashboard, or app shell

Do not use this skill for:
- Backend-only work
- Pure refactors with no user-facing visual change
- Copywriting-only requests unless the copy is part of a UI you are implementing

## Working Style

Follow Codex defaults first:
1. Inspect the existing codebase, framework, and design patterns before editing.
2. Respect repo instructions from `AGENTS.md` and preserve established system behavior.
3. If the product already has a visual language, extend it rather than replacing it arbitrarily.
4. If the request is underspecified but low risk, make reasonable assumptions and build a working result.
5. Deliver working code, not a mockup or a design essay.

For larger UI changes, briefly state:
- the chosen design direction
- the main visual device
- what "done" means for this implementation

## Design Direction

Choose one clear aesthetic direction before writing code. Be specific and commit to it.

Useful extremes:
- brutally minimal
- editorial
- art deco
- retro-futurist
- luxury
- playful
- industrial
- brutalist
- organic
- maximalist

Pick the direction that best fits the product and audience, then execute it consistently. The interface should feel intentionally designed, not averaged out.

Define:
- **Purpose**: what the interface is for and who uses it
- **Tone**: the visual mood and degree of restraint or intensity
- **Differentiator**: the memorable idea that gives the design identity
- **Constraints**: framework, accessibility, performance, responsiveness, and existing system boundaries

## Design Contract

The result should be:
- distinctive and memorable
- production-grade and functional
- cohesive across typography, color, spacing, and motion
- responsive on desktop and mobile
- accessible enough to ship responsibly within the project context

Prefer strong, intentional choices over safe defaults.

Avoid generic AI aesthetics:
- overused default sans stacks
- purple-on-white gradients by default
- interchangeable hero sections and card grids
- timid palettes with no hierarchy
- filler motion with no visual purpose

## Implementation Rules

Build directly in the target stack: HTML/CSS/JS, React, Vue, or the project's existing frontend framework.

Use these rules while implementing:
- inspect and reuse existing patterns before inventing new ones
- use design tokens or CSS variables for color, type, spacing, radii, shadows, and motion
- choose typography with character; avoid generic defaults unless the codebase already requires them
- use asymmetry, overlap, framing, negative space, or density deliberately
- make backgrounds carry atmosphere through gradients, textures, shapes, or patterning when appropriate
- use motion sparingly but intentionally; prioritize page-load sequencing, reveal choreography, and hover/focus states with purpose
- keep the UI complete enough to run and evaluate, not just visually suggestive

## Complexity Match

Match the code depth to the design direction.

- For maximal or expressive directions, support the visuals with the necessary layout, layering, and interaction detail.
- For restrained or minimalist directions, focus on precision, spacing, typography, and subtle finish.
- Do not add ornamental complexity that the concept does not justify.

## Verification

Before finishing:
1. Check the layout at desktop and mobile sizes.
2. Check that the visual hierarchy is clear.
3. Check that colors, type, and spacing feel internally consistent.
4. Run the repo's available preview, build, or test flow when practical.
5. Confirm the output is implemented code and not just design intent.

## Output Bias

When using this skill, bias toward shipping a real interface with a clear point of view. Keep explanations short and let the code carry the design.
