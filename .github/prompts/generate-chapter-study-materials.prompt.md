---
description: "Generate complete study materials for one or more Robbins pathology chapters: study notes (Markdown), exam-prep questions (JSON), and flashcards (JSON), then update the content index. Use when generating chapter study content, creating chapter notes, making chapter flashcards, or building exam questions for a chapter."
name: "Generate Chapter Study Materials"
argument-hint: "Chapter number(s), e.g. 2  or  3,4,5"
agent: "agent"
---

## Before You Begin – MANDATORY CHECKS

**Step 1 – Validate the chapter argument.**
The user MUST supply one or more chapter numbers. If the argument is missing or empty, stop immediately and ask:

> "Which chapter number(s) do you want to generate study materials for? (e.g. `2` or `3,4,5`)"
> Do not proceed until a chapter number is provided.

**Step 2 – Resolve chapter details.**
For each chapter number supplied, look up the matching PDF in `Robbins Basic Pathology - Tenth Edition - Chapters/`.
The files are named with the pattern `NN - Chapter Title.pdf` (two-digit zero-padded number).
If no matching PDF is found, tell the user and stop.

**Step 3 – Check for existing files before overwriting.**
For each chapter, check whether any of the three output files already exist in `Generated Study Notes/`:

- `NN - <Chapter Title> - Study Notes.md`
- `NN - <Chapter Title> - Exam Prep Questions.json`
- `NN - <Chapter Title> - Flashcards.json`

If any output file already exists for a chapter, stop and ask:

> "Study materials for Chapter NN already exist. Do you want to overwrite them?"
> Only proceed when the user confirms.

---

## Instructions

Process **each requested chapter** in order, completing all four tasks before moving to the next chapter.

---

## Source Rules (apply to every task)

**Read:**

- The single chapter PDF: `Robbins Basic Pathology - Tenth Edition - Chapters/NN - <Title>.pdf`
- All files under `Trusted Sources From The College/`

**Do NOT read:**

- Anything inside `External Douments/` — treat as unverified
- `Robbins Basic Pathology - Tenth Edition.pdf` (the full-book combined PDF)

Follow [no-external-documents instructions](.github/instructions/no-external-documents.instructions.md).

---

## Task 1 – Study Notes (Markdown)

> **Required Skill:** `study-notes-creator` — load `.agents/skills/study-notes-creator/SKILL.md` before starting this task.

**Output file:** `Generated Study Notes/NN - <Chapter Title> - Study Notes.md`

Requirements:

- Base notes primarily on the chapter PDF; use Trusted Sources only where relevant for emphasis, framing, or exam alignment.
- Organize with clear headings, subheadings, summary tables, and ASCII/Mermaid diagrams where useful.
- Exam-focused but complete enough for revision.
- Include concise explanations of key concepts, mechanisms, and high-yield distinctions.
- Follow [page-references instructions](.github/instructions/page-references.instructions.md):
  - Use **printed book page numbers** only (number visible on the physical page), never the PDF page index.
  - Format as `[xx]` at the end of the relevant sentence or paragraph.

---

## Task 2 – Exam-Prep Questions (JSON)

> **Required Skill:** `exam-prep` — load `.agents/skills/exam-prep/SKILL.md` before starting this task.

**Output file:** `Generated Study Notes/NN - <Chapter Title> - Exam Prep Questions.json`

Requirements:

- Mirror the style, structure, tone, and difficulty distribution of `Trusted Sources From The College/BPS 2026 Mock Exam.questions.json`.
- Validate output against the schema: `Generated Study Notes/exam-questions.schema.json`.
- Use printed book page numbers in any page-reference fields.
- Study Chapter 1's existing exam-prep questions JSON as a precedent for format and depth:
  `Generated Study Notes/01 - The Cell as a Unit of Health and Disease - Exam Prep Questions.json`

---

## Task 3 – Flashcards (JSON)

> **Required Skill:** `flashcard-creator` — load `.agents/skills/flashcard-creator/SKILL.md` before starting this task.

**Output file:** `Generated Study Notes/NN - <Chapter Title> - Flashcards.json`

Requirements:

- Use the study notes and exam questions you just generated, plus the chapter PDF and trusted sources.
- Follow the exact format established by Chapter 1's flashcard deck as precedent:
  `Generated Study Notes/01 - The Cell as a Unit of Health and Disease - Flashcards.json`
- Page references go in the dedicated JSON key (e.g. `"page_reference"`), **not** in the answer text.
- Use printed book page numbers only.
- Make flashcards exam-focused but complete enough for revision.

---

## Task 4 – Update the Content Index

**File to update:** `Generated Study Notes/study-content-index.json`

Requirements:

- Validate updates against: `Generated Study Notes/study-content-index.schema.json`
- For each chapter processed:
  - If a chapter entry already exists: update its `status`, `assets` array, and any other stale fields.
  - If no chapter entry exists: add a new entry following the same structure as the Chapter 1 entry.
  - Record accurate `card_count`, `question_count`, file paths, and asset metadata.
  - Set `status` to `"complete"` once all three assets are created.
- Update `content_status.chapter_count_complete` accordingly.

---

## Document Format Precedents

Always check these files for schema and format before writing:

- [exam-questions.schema.json](Generated%20Study%20Notes/exam-questions.schema.json)
- [study-content-index.schema.json](Generated%20Study%20Notes/study-content-index.schema.json)
- [Chapter 1 Study Notes](Generated%20Study%20Notes/01%20-%20The%20Cell%20as%20a%20Unit%20of%20Health%20and%20Disease%20-%20Study%20Notes.md) — precedent for Markdown format
- [Chapter 1 Exam Questions](Generated%20Study%20Notes/01%20-%20The%20Cell%20as%20a%20Unit%20of%20Health%20and%20Disease%20-%20Exam%20Prep%20Questions.json) — precedent for question JSON
- [Chapter 1 Flashcards](Generated%20Study%20Notes/01%20-%20The%20Cell%20as%20a%20Unit%20of%20Health%20and%20Disease%20-%20Flashcards.json) — precedent for flashcard JSON
