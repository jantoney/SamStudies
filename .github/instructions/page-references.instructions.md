---
description: "Use when adding, reviewing, or generating any page references or source citations in study notes, flashcards, exam prep questions, or any other generated learning content in this workspace."
name: "Page Reference Convention"
applyTo: "Generated Study Notes/**"
---

# Page Reference Convention

All page citations in generated study content MUST use the **printed book page number**, not the PDF page position.

## The Rule

> `[n]` always means the number printed on that page in the physical textbook, visible in the running header or footer of the page.

## Why This Matters

Each chapter is stored as a separate PDF file. The PDF viewer always shows page 1 for the first page of whichever chapter file you open. **This is NOT the book page number.**

Examples from Robbins Basic Pathology, 10th Edition:

| Chapter   | PDF page 1 = book page   |
| --------- | ------------------------ |
| Chapter 1 | 1 (they happen to match) |
| Chapter 2 | 31                       |
| Chapter 3 | 57                       |

If you use PDF page position for Chapter 2, you will write `[1]` when you mean book page `[31]`.

## How to Find the Printed Book Page Number

1. Open the chapter PDF.
2. Look at the **running header or footer** on the page — it shows the printed book page number (e.g., `"32"` or `"CHAPTER 2 Cell Injury, Cell Death, and Adaptations 32"`).
3. Use that number, not the PDF page counter shown in your PDF viewer.

## Required Format in Each File Type

| File type                   | Required citation format                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Markdown study notes `.md`  | `[n]` inline, e.g. `[31]`                                                            |
| JSON flashcards `.json`     | `"source_page_refs": [31]` and `[31]` in back text                                   |
| Markdown flashcards `.md`   | `- Printed book pages: [31]` and `[31]` in back text                                 |
| Anki TSV `.tsv`             | `[31]` in the answer column                                                          |
| Exam prep questions `.json` | `"source_page_refs": [31]` and `"page_reference_style": "printed_book_page_numbers"` |

## Document-Level Declaration

Every generated document that contains page references MUST include a section or field that:

- States that citations are **printed book page numbers**
- States which book pages the chapter occupies (e.g., "Chapter 2 occupies book pages 31–56")

For Markdown files, add a `## Page Reference Convention` section near the top (after Source Notes).
For JSON files, add a `"page_reference_style": "printed_book_page_numbers"` field and a `"page_reference_note"` field in the deck/format metadata object.

## Verification Checklist

Before finalising any generated content:

- [ ] Open the chapter PDF and confirm the printed page number on the first page
- [ ] Confirm the printed page number on the last page
- [ ] Cross-check at least three in-text citations against actual page content
- [ ] Ensure no citation number exceeds the last page of the chapter
- [ ] Ensure the document-level declaration is present
