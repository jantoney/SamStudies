# SamStudies

Static GitHub Pages site for the generated pathology study assets in this repository.

## What is included

- Root-level `index.html` single-page app for GitHub Pages
- Responsive study notes reader
- Interactive flash cards with reveal, previous, next, and reshuffle
- Interactive exam questions with random subset selection and answer timing options
- The generated source assets in `Generated Study Notes/`
- The JSON schema files used for the generated content index and exam question format

## Publishing

Use GitHub Pages from the `main` branch root. The app fetches the tracked markdown and JSON files directly from the repository, so the generated study assets stay as the source of truth.

## Repo hygiene

The `.gitignore` keeps local source textbooks, scratch folders, and editor noise out of the remote while preserving the generated study notes, flashcards, questions, and schemas.
