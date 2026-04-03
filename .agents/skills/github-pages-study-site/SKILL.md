---
name: github-pages-study-site
description: Assess whether a study website fits GitHub Pages, choose between plain static files, Jekyll, and a custom GitHub Actions workflow, and identify when requirements exceed static hosting. Use when planning or scoping notes, flash-card, quiz, revision-question, or other content-driven study sites built from Markdown, JSON, YAML, CSV, schema files, or Anki-style content for deployment on GitHub Pages.
---

# GitHub Pages Study Site

## Assess The Fit

Treat GitHub Pages as static hosting.

Assume these capabilities are in scope:
- Serve HTML, CSS, JavaScript, images, fonts, and other static assets.
- Publish output generated from Markdown, JSON, YAML, CSV, or prebuilt HTML.
- Run browser-side interactivity for flash cards, quizzes, filtering, randomisation, reveal or hide answers, and short-lived progress state.
- Apply custom layouts, styling, navigation, custom domains, and HTTPS.

Reject or escalate requirements that depend on:
- Server-side code running on GitHub Pages itself.
- Database writes handled by the site backend.
- Authenticated backend logic owned by the Pages site.
- Runtime APIs that must be hosted by the Pages site.

If the site can be published as finished static files and all interactivity can run in the browser, GitHub Pages is usually a strong fit.

## Choose The Build Model

Pick the simplest model that keeps the published output fully static.

### Plain Static Files

Choose this when:
- The source files already map cleanly to final pages.
- Lightweight JavaScript is enough for flash cards and question sessions.
- Minimal tooling matters more than authoring convenience.

Expect:
- The simplest deployment shape.
- The least framework lock-in.
- More manual templating as the site grows.

### Jekyll

Choose this when:
- Markdown-first authoring is the core workflow.
- Layouts, includes, front matter, collections, permalinks, and data files fit the content model.
- Notes, glossaries, topic indexes, and deck or question pages can be expressed with Jekyll conventions.

Expect:
- A strong fit for content-heavy study sites.
- Good support for notes plus data-backed pages.
- Restrictions if the plan depends on unsupported Jekyll plugins or unusual build behavior.

### Custom GitHub Actions Workflow

Choose this when:
- The site needs preprocessing, validation, or transforms before publication.
- The content pipeline mixes Markdown with JSON, CSV, schemas, or imported study material.
- The site uses a non-Jekyll static-site generator.
- The branch-based Pages build would be too restrictive.

Expect:
- The most flexibility.
- A slightly more complex repository workflow.
- A better fit when study content must be normalized or validated before shipping.

## Map The Study Content

Map inputs by content role, not by filename.

### Notes

Treat notes as canonical reading and revision pages.

Good fits:
- Jekyll pages or collections.
- Generated static pages from another static-site generator.
- Prebuilt HTML consumed directly by the published site.

### Flash Cards

Treat flash cards as structured prompt and answer data.

Good fits:
- JSON, YAML, CSV, or transformed Markdown consumed by browser code.
- Jekyll collections or data files rendered into deck pages.
- Build-time conversion from Anki-style source into browser-friendly data.

### Revision Questions

Treat revision questions as a structured question bank.

Good fits:
- JSON or other static data files loaded client-side.
- Build-time validation against schemas.
- Browser-side logic for question selection, answer reveal, scoring, and summaries.

### Schema Files

Treat schemas as build-time validation and normalization rules, not as published runtime infrastructure.

Use schemas to:
- Validate note, card, or question inputs before deployment.
- Catch malformed content before publishing.
- Drive transforms into simpler static assets.

## Apply The Decision Rules

Answer these questions before implementation:

1. Is the published output fully static once built?
2. Can all interactivity run in browser-side JavaScript?
3. Are Markdown layouts and simple data files enough, or is preprocessing required?
4. Are Jekyll collections, front matter, and data files sufficient?
5. Do schema validation or content transforms justify a custom GitHub Actions workflow?
6. Does any requirement imply a backend, database, or server-owned user state?

Use this default guidance:
- Prefer plain static files when the content model is already simple.
- Prefer Jekyll when Markdown-first publishing is the main job.
- Prefer a custom GitHub Actions workflow when ingestion, transformation, validation, or non-Jekyll tooling is important.

## Respect The Important Boundaries

Keep these constraints in mind:
- Publish a finished static site.
- Do not assume GitHub Pages can host arbitrary backend behavior.
- Do not assume branch-based Jekyll builds can use unsupported plugins.
- Do not assume branch publishing is safe when the repository contains symbolic links.
- Re-check current limits before promising scale, bandwidth, or build characteristics.

## Verify Before Promising Details

Read [official-docs.md](./references/official-docs.md) when exact behavior, limits, publishing modes, or Jekyll constraints matter.

Use source priority in this order:
1. GitHub Pages official docs.
2. Jekyll docs.
3. Framework or build-tool docs for the chosen custom workflow.

## Operating Summary

Use GitHub Pages when the study site can ship as a static website, use Jekyll when Markdown-first content is enough, move to a custom GitHub Actions workflow when transforms or non-Jekyll tooling are needed, and verify exact platform details from current GitHub and Jekyll documentation before implementation.
