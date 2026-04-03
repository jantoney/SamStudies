---
name: flashcard-creator
description: Create flashcards for spaced repetition learning in this workspace's canonical JSON deck format. Use when creating study flashcards, memory cards, active-recall decks, or spaced repetition materials from approved notes or topics. Triggers - create flashcards, flashcard deck, spaced repetition, memory cards, active recall, study deck.
---

# Flashcard Creator

Generate effective flashcards optimized for the JSON deck format used by this workspace and its study app.

## Workflow

```mermaid
flowchart LR
    A[Source Material] --> B[Identify Key Facts]
        B --> C[Create Single-Fact Cards]
        C --> D[Add Source Page Refs]
        D --> E[Assemble JSON Deck]
        E --> F[Validate Metadata]
```

---

## Step 1: Card Design Principles

1. **Understand before memorizing** - Never create cards for things you don't understand
2. **Minimum information** - Keep each card focused on ONE fact
3. **Use direct question-answer pairs** - This app expects explicit `front` and `back` fields
4. **Avoid sets/lists** - Break lists into individual cards
5. **Keep cards fast** - A learner should answer each card in under 10 seconds
6. **Anchor claims to pages** - Every card needs `source_page_refs` using printed book page numbers

---

## Step 2: Canonical Output Format

This workspace keeps exactly one flashcard artifact per chapter:

- `Generated Study Notes/<chapter> - Flashcards.json`

Do **not** generate parallel markdown or TSV/Anki exports unless the user explicitly asks for a separate export workflow.

The app currently consumes `flashcards_json` only.

### Required top-level structure

```json
{
    "schema_version": "1.0",
    "resource_type": "flashcard_set",
    "title": "01 - Example Chapter - Flashcards",
    "slug": "01-example-chapter-flashcards",
    "chapter": {
        "number": 1,
        "code": "01",
        "title": "Example Chapter",
        "status": "complete"
    },
    "description": "Short description of the deck.",
    "disclaimer": {
        "summary": "Third-party generated study aid.",
        "endorsement_notice": "Required disclaimer text.",
        "use_note": "Use these flashcards as revision support alongside the original source material."
    },
    "source_notes": [],
    "deck": {
        "deck_name": "Pathology::Chapter 01 - Example Chapter",
        "deck_slug": "pathology-chapter-01-example-chapter",
        "flashcard_format": "basic",
        "card_count": 0,
        "primary_method": "active_recall_and_spaced_repetition",
        "recommended_review_schedule": ["Day 1", "Day 2", "Day 4", "Day 7"],
        "topic_buckets": [],
        "design_note": "Cards are kept mostly single-fact and under one question per card for rapid recall.",
        "page_reference_style": "printed_book_page_numbers",
        "page_reference_note": "Use printed book page numbers, not PDF page positions."
    },
    "cards": []
}
```

### Required card structure

```json
{
    "number": 1,
    "card_id": "ch1-fc001",
    "type": "basic",
    "bucket": "Genome and epigenome",
    "topic": "Coding fraction of the genome",
    "front": "What proportion of the human genome encodes proteins?",
    "back": "About 1.5%. [1][2]",
    "source_page_refs": [1, 2],
    "tags": ["pathology", "chapter-01", "genome-and-epigenome"]
}
```

---

## Step 3: Card Templates by Subject

### Vocabulary/Terminology

```
Front: [Term]
Back: [Clear definition in one compact answer sentence.] [page refs]
```

### Formulas

```
Front: Formula for [concept]?
Back: [Formula]. [Very short explanation if needed.] [page refs]
```

### Processes/Sequences

```
Front: What is the key sequence in [process]?
Back: [Condensed sequence in one short answer.] [page refs]
```

### Dates/Events

```
Front: [Year]: What happened?
Back: [Event and significance.] [page refs]
```

---

## Step 4: Workspace Rules

1. Use approved sources only.
2. For this workspace, page references must use **printed book page numbers**.
3. Keep `type` as `basic` unless the app is explicitly updated to support more display modes.
4. Keep `front` and `back` plain, concise, and immediately reviewable.
5. Set `deck.card_count` to match the actual number of cards.

---

## Step 5: Batch Generation Template

When creating multiple cards from a chapter, produce one JSON deck with stable metadata:

```markdown
# [Chapter] Flashcards JSON Plan

**Total Cards:** [Number]
**Deck Name:** [Subject]::[Topic]
**Format:** flashcards_json
**Card Type:** basic
**Page Reference Style:** printed_book_page_numbers

---

## Cards

### Card 1
**card_id:** [chapter-card-id]
**front:** [Question/Prompt]
**back:** [Answer/Information with inline page refs]
**source_page_refs:** [[n], [n]]
**tags:** [tag1, tag2]

### Card 2
**card_id:** [chapter-card-id]
**front:** [Question/Prompt]
**back:** [Answer/Information with inline page refs]
**source_page_refs:** [[n]]
**tags:** [tag1, tag2]

[Continue...]
```

---

## Quality Checklist

- [ ] Each card tests ONE piece of information
- [ ] Cards can be answered in <10 seconds
- [ ] No ambiguous questions with multiple valid answers
- [ ] `front` and `back` are present for every card
- [ ] `source_page_refs` matches the inline page refs in `back`
- [ ] Page refs use printed book page numbers
- [ ] The deck is emitted as one `.json` file only
