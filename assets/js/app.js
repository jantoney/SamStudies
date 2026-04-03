const VIEW_ASSET_TYPES = {
  notes: "study_notes_markdown",
  questions: "exam_prep_questions_json",
  flashcards: "flashcards_json"
};

const state = {
  index: null,
  selectedChapterSlug: null,
  view: "overview",
  cache: new Map(),
  quiz: null,
  flashcards: null
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  elements.chapterList = document.getElementById("chapter-list");
  elements.chapterSummary = document.getElementById("chapter-summary");
  elements.modeNav = document.getElementById("mode-nav");
  elements.viewRoot = document.getElementById("view-root");
  elements.disclaimerSummary = document.getElementById("disclaimer-summary");

  initializeApp().catch((error) => {
    console.error(error);
    elements.viewRoot.innerHTML = `
      <div class="error-state">
        <h2>Unable to load the study content</h2>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  });
});

async function initializeApp() {
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      themeVariables: {
        primaryColor: "#f2e6d4",
        primaryTextColor: "#17253d",
        primaryBorderColor: "#2c6a62",
        lineColor: "#2c6a62",
        secondaryColor: "#fffaf3",
        tertiaryColor: "#e6f0ef"
      }
    });
  }

  state.index = await loadJson("Generated Study Notes/study-content-index.json");
  populateGlobalMeta();
  window.addEventListener("hashchange", () => applyRoute(window.location.hash));
  applyRoute(window.location.hash);
}

function populateGlobalMeta() {
  const { disclaimer } = state.index;
  elements.disclaimerSummary.textContent = disclaimer.use_note;
}

function getChapters() {
  return state.index?.chapters ?? [];
}

function getDefaultChapter() {
  return getChapters().find((chapter) => chapter.status === "complete") ?? getChapters()[0] ?? null;
}

function getChapterBySlug(slug) {
  return getChapters().find((chapter) => chapter.slug === slug) ?? null;
}

function getAsset(chapter, assetType) {
  return chapter?.assets?.find((asset) => asset.asset_type === assetType) ?? null;
}

function hasViewAsset(chapter, view) {
  return Boolean(getAsset(chapter, VIEW_ASSET_TYPES[view]));
}

function parseHash(hash) {
  const cleaned = hash.replace(/^#\/?/, "");
  const parts = cleaned.split("/").filter(Boolean);

  if (parts[0] === "chapter" && parts[1]) {
    return {
      slug: decodeURIComponent(parts[1]),
      view: parts[2] ?? null
    };
  }

  return {
    slug: getDefaultChapter()?.slug ?? null,
    view: null
  };
}

function buildHash(slug, view) {
  const encodedSlug = encodeURIComponent(slug);
  return view ? `#/chapter/${encodedSlug}/${view}` : `#/chapter/${encodedSlug}`;
}

function applyRoute(hash) {
  const parsed = parseHash(hash);
  const fallbackChapter = getDefaultChapter();
  const chapter = getChapterBySlug(parsed.slug) ?? fallbackChapter;

  if (!chapter) {
    elements.chapterList.innerHTML = "";
    elements.chapterSummary.innerHTML = `
      <div class="error-state">
        <h2>No chapters were found</h2>
        <p>The study-content index did not return any chapter entries.</p>
      </div>
    `;
    return;
  }

  const firstAvailable = Object.keys(VIEW_ASSET_TYPES).find(v => hasViewAsset(chapter, v)) ?? null;
  const requestedView = (parsed.view && Object.hasOwn(VIEW_ASSET_TYPES, parsed.view)) ? parsed.view : null;
  const safeView = (requestedView && hasViewAsset(chapter, requestedView)) ? requestedView : firstAvailable;
  const nextHash = buildHash(chapter.slug, safeView);

  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }

  const chapterChanged = state.selectedChapterSlug !== chapter.slug;
  state.selectedChapterSlug = chapter.slug;
  state.view = safeView;

  if (chapterChanged) {
    state.quiz = null;
    state.flashcards = null;
  }

  renderChapterList();
  renderChapterSummary(chapter);
  renderModeNav(chapter);
  renderView(chapter).catch((error) => {
    console.error(error);
    elements.viewRoot.innerHTML = `
      <div class="error-state">
        <h2>Unable to render this view</h2>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  });
}

function renderChapterList() {
  elements.chapterList.innerHTML = getChapters()
    .map((chapter) => {
      const description = chapter.website?.card_description ?? chapter.description ?? "Study assets pending.";
      const isActive = chapter.slug === state.selectedChapterSlug;
      const isComplete = chapter.status === "complete";

      return `
        <button
          class="chapter-button ${isActive ? "is-active" : ""} ${isComplete ? "" : "is-disabled"}"
          type="button"
          data-target-hash="${escapeHtml(buildHash(chapter.slug, "overview"))}"
        >
          <span class="chapter-button__top">
            <span class="chapter-button__code">Chapter ${escapeHtml(chapter.chapter_code)}</span>
            <span class="badge ${isComplete ? "" : "badge--planned"}">${isComplete ? "Ready" : "Planned"}</span>
          </span>
          <span class="chapter-button__title">${escapeHtml(chapter.title)}</span>
          <span class="chapter-button__desc">${escapeHtml(description)}</span>
        </button>
      `;
    })
    .join("");

  elements.chapterList.querySelectorAll("[data-target-hash]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = button.dataset.targetHash;
    });
  });
}

function renderChapterSummary(chapter) {
  const chapterTopics = chapter.topics?.length
    ? chapter.topics.map((topic) => `<span class="chip">${escapeHtml(topic)}</span>`).join("")
    : "";

  elements.chapterSummary.innerHTML = `
    <div class="chapter-summary__top">
      <div class="chapter-summary__copy">
        <p class="panel__eyebrow">Selected chapter</p>
        <h2>${escapeHtml(chapter.title)}</h2>
        <p>${escapeHtml(chapter.description ?? "No description available.")}</p>
      </div>
      <span class="badge ${chapter.status === "complete" ? "" : "badge--planned"}">
        ${chapter.status === "complete" ? "Complete" : "Planned"}
      </span>
    </div>
    ${chapterTopics ? `<div class="chapter-summary__topics">${chapterTopics}</div>` : ""}
    ${renderChapterReferences(chapter)}
  `;
}

function renderChapterReferences(chapter) {
  if (!chapter.sources_used?.length) return "";
  const registry = state.index?.source_registry ?? [];
  const sources = chapter.sources_used
    .map((id) => registry.find((s) => s.source_id === id))
    .filter(Boolean);
  if (!sources.length) return "";

  const items = sources.map((s) => {
    const meta = [s.edition, s.publication_year, s.publisher ?? s.organization].filter(Boolean).join(" · ");
    return `
      <li class="references-item">
        <span class="references-item__title">${escapeHtml(s.source_title)}</span>
        ${meta ? `<span class="references-item__meta">${escapeHtml(meta)}</span>` : ""}
      </li>`;
  }).join("");

  return `
    <details class="references-details">
      <summary class="references-summary">References</summary>
      <ul class="references-list">${items}</ul>
    </details>`;
}

function renderModeNav(chapter) {
  const modeButtons = [
    ["notes", "Study Notes", "Read the notes with page references highlighted."],
    ["questions", "Exam Questions", "Choose how many questions and when to see answers."],
    ["flashcards", "Flash Cards", "Tap to reveal, go back or forward, then reshuffle."]
  ];

  elements.modeNav.innerHTML = modeButtons
    .map(([view, title, description]) => {
      const disabled = !hasViewAsset(chapter, view);
      return `
        <button
          class="mode-button ${state.view === view ? "is-active" : ""} ${disabled ? "is-disabled" : ""}"
          type="button"
          data-target-hash="${escapeHtml(buildHash(chapter.slug, view))}"
          ${disabled ? "disabled" : ""}
        >
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(description)}</span>
        </button>
      `;
    })
    .join("");

  elements.modeNav.querySelectorAll("[data-target-hash]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled) {
        window.location.hash = button.dataset.targetHash;
      }
    });
  });
}

async function renderView(chapter) {
  if (!state.view) {
    elements.viewRoot.innerHTML = `
      <div class="empty-state">
        <h2>Study materials coming soon</h2>
        <p>Assets for this chapter are being prepared.</p>
      </div>
    `;
    return;
  }

  if (state.view === "notes") {
    await renderNotesView(chapter);
    return;
  }

  if (state.view === "questions") {
    await renderQuestionsView(chapter);
    return;
  }

  if (state.view === "flashcards") {
    await renderFlashcardsView(chapter);
  }
}

async function renderNotesView(chapter) {
  const notesAsset = getAsset(chapter, VIEW_ASSET_TYPES.notes);

  if (!notesAsset) {
    renderMissingView("Study Notes", "No markdown notes are listed for this chapter yet.");
    return;
  }

  elements.viewRoot.innerHTML = `
    <div class="empty-state">
      <h2>Loading study notes</h2>
      <p>Rendering markdown and building the contents menu.</p>
    </div>
  `;

  const markdown = await loadText(notesAsset.path);

  if (!window.marked) {
    throw new Error("The markdown renderer was not loaded.");
  }

  elements.viewRoot.innerHTML = `
    <div class="notes-layout">
      <div class="notes-main">
        <div>
          <p class="panel__eyebrow">Study notes</p>
          <h2>${escapeHtml(chapter.title)}</h2>
          <p class="notes-callout">
            Bracketed references from the markdown are shown as page pills where possible so source page references stay visible in the notes view.
          </p>
        </div>
        <article class="notes-content" id="notes-content"></article>
      </div>
      <aside class="toc-card">
        <p class="panel__eyebrow">In this chapter</p>
        <h3>Contents</h3>
        <div class="toc-list" id="toc-list"></div>
      </aside>
    </div>
  `;

  const notesContent = document.getElementById("notes-content");
  notesContent.innerHTML = window.marked.parse(markdown, {
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
  });

  hydrateRenderedNotes(notesContent);
  renderNotesToc(notesContent);
  await renderMermaidBlocks(notesContent);
}

function hydrateRenderedNotes(root) {
  root.querySelectorAll("h1, h2, h3, h4").forEach((heading) => {
    if (!heading.id) {
      heading.id = slugify(heading.textContent);
    }
  });

  root.querySelectorAll("pre > code.language-mermaid").forEach((codeBlock) => {
    const wrapper = document.createElement("div");
    wrapper.className = "mermaid";
    wrapper.textContent = codeBlock.textContent;
    codeBlock.parentElement.replaceWith(wrapper);
  });

  root.querySelectorAll("p, li, td, th, blockquote").forEach((node) => {
    node.innerHTML = node.innerHTML.replace(/\[(\d+)\]/g, '<span class="page-ref" title="Source page reference">p$1</span>');
  });
}

function renderNotesToc(root) {
  const tocList = document.getElementById("toc-list");
  const headings = [...root.querySelectorAll("h2, h3")];

  if (!headings.length) {
    tocList.innerHTML = "<p class=\"helper-text\">The notes did not contain section headings.</p>";
    return;
  }

  tocList.innerHTML = headings
    .map((heading) => {
      const indent = heading.tagName === "H3" ? " style=\"padding-left: 12px\"" : "";
      return `<button class="toc-link" type="button" data-heading-id="${escapeHtml(heading.id)}"${indent}>${escapeHtml(heading.textContent)}</button>`;
    })
    .join("");

  tocList.querySelectorAll("[data-heading-id]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.headingId)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

async function renderMermaidBlocks(root) {
  const mermaidBlocks = root.querySelectorAll(".mermaid");
  if (!mermaidBlocks.length || !window.mermaid) {
    return;
  }

  await window.mermaid.run({
    querySelector: ".mermaid"
  });
}

async function renderQuestionsView(chapter) {
  const questionsAsset = getAsset(chapter, VIEW_ASSET_TYPES.questions);

  if (!questionsAsset) {
    renderMissingView("Exam Questions", "No exam question set is listed for this chapter yet.");
    return;
  }

  const questionSet = await loadJson(questionsAsset.path);
  const sameChapterSession = state.quiz && state.quiz.chapterSlug === chapter.slug;

  if (!sameChapterSession) {
    state.quiz = null;
  }

  if (!state.quiz) {
    renderQuizSetup(chapter, questionSet, questionsAsset);
    return;
  }

  if (state.quiz.completed) {
    renderQuizSummary(questionSet);
    return;
  }

  renderQuizQuestion(questionSet);
}

function renderQuizSetup(chapter, questionSet, questionsAsset) {
  const totalQuestions = questionSet.questions.length;
  const defaultCount = Math.min(10, totalQuestions);

  elements.viewRoot.innerHTML = `
    <div class="section-stack">
      <div>
        <p class="panel__eyebrow">Exam questions</p>
        <h2>${escapeHtml(chapter.title)}</h2>
        <p>${escapeHtml(questionSet.description)}</p>
      </div>
      <form class="quiz-settings" id="quiz-settings-form">
        <div class="chapter-summary__meta">
          <span class="chip chip--secondary">${totalQuestions} available questions</span>
          <span class="chip">Randomized selection</span>
          <span class="chip">Page references included in answers</span>
        </div>
        <div class="quiz-settings__grid">
          <div>
            <label class="field-label" for="question-count">How many questions do you want to do?</label>
            <input
              class="text-input"
              id="question-count"
              name="questionCount"
              type="number"
              min="1"
              max="${totalQuestions}"
              value="${defaultCount}"
              inputmode="numeric"
            >
            <p class="helper-text">A random subset is drawn from the full question set each time.</p>
          </div>
          <div>
            <span class="field-label">When do you want to see answers?</span>
            <div class="radio-group">
              <label class="radio-card">
                <span><input type="radio" name="feedbackMode" value="immediate" checked> After each question</span>
                <span>Useful for guided revision.</span>
              </label>
              <label class="radio-card">
                <span><input type="radio" name="feedbackMode" value="summary"> At the end</span>
                <span>Useful for test-style practice.</span>
              </label>
            </div>
          </div>
        </div>
        <div class="inline-actions">
          <button class="button" type="submit">Start questions</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("quiz-settings-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const requestedCount = Number.parseInt(formData.get("questionCount"), 10);
    const questionCount = clampNumber(requestedCount, 1, totalQuestions);
    const feedbackMode = formData.get("feedbackMode") === "summary" ? "summary" : "immediate";
    const selectedQuestions = shuffle([...questionSet.questions]).slice(0, questionCount);

    state.quiz = {
      chapterSlug: chapter.slug,
      feedbackMode,
      questions: selectedQuestions,
      currentIndex: 0,
      answers: {},
      completed: false
    };

    renderQuizQuestion(questionSet);
  });
}

function renderQuizQuestion(questionSet) {
  const session = state.quiz;
  const question = session.questions[session.currentIndex];
  const savedAnswer = session.answers[question.question_id] ?? null;
  const isAnswered = Boolean(savedAnswer);
  const isImmediate = session.feedbackMode === "immediate";
  const progressValue = ((session.currentIndex + 1) / session.questions.length) * 100;

  elements.viewRoot.innerHTML = `
    <div class="section-stack">
      <div>
        <p class="panel__eyebrow">Exam questions</p>
        <h2>Question ${session.currentIndex + 1} of ${session.questions.length}</h2>
        <p class="quiz-card__meta">
          ${isImmediate ? "Answers are shown after each question." : "Answers will be shown in the final summary."}
        </p>
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-bar__fill" style="width: ${progressValue.toFixed(2)}%"></div>
        </div>
      </div>

      <form class="question-card" id="question-form">
        <div class="question-prompt">${escapeHtml(question.question)}</div>
        <div class="question-choices">
          ${question.choices.map((choice) => renderChoice(question, choice, savedAnswer)).join("")}
        </div>
        ${isImmediate && isAnswered ? renderImmediateFeedback(question, savedAnswer) : ""}
        <div class="inline-actions">
          ${
            !(isImmediate && isAnswered)
              ? `<button class="button" type="submit">${isImmediate ? "Lock answer" : session.currentIndex === session.questions.length - 1 ? "Finish quiz" : "Save and continue"}</button>`
              : ""
          }
          ${
            isImmediate && isAnswered
              ? `<button class="button" type="button" id="next-question-button">${session.currentIndex === session.questions.length - 1 ? "View results" : "Next question"}</button>`
              : ""
          }
          <button class="ghost-button" type="button" id="restart-quiz-button">Start over</button>
        </div>
      </form>
    </div>
  `;

  const questionForm = document.getElementById("question-form");
  questionForm.addEventListener("change", () => {
    questionForm.querySelectorAll(".question-choice").forEach((node) => {
      const input = node.querySelector("input");
      node.classList.toggle("is-selected", input.checked);
    });
  });

  questionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedChoiceKey = formData.get("selectedChoice");

    if (typeof selectedChoiceKey !== "string") {
      return;
    }

    session.answers[question.question_id] = {
      selectedChoiceKey,
      isCorrect: selectedChoiceKey === question.answer.correct_choice_key
    };

    if (session.feedbackMode === "immediate") {
      renderQuizQuestion(questionSet);
      return;
    }

    goToNextQuizStep(questionSet);
  });

  document.getElementById("restart-quiz-button").addEventListener("click", () => {
    const selectedChapter = getChapterBySlug(state.selectedChapterSlug);
    state.quiz = null;
    renderQuizSetup(selectedChapter, questionSet, getAsset(selectedChapter, VIEW_ASSET_TYPES.questions));
  });

  const nextButton = document.getElementById("next-question-button");
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      goToNextQuizStep(questionSet);
    });
  }
}

function renderChoice(question, choice, savedAnswer) {
  const answerState = savedAnswer
    ? savedAnswer.selectedChoiceKey === choice.key
      ? savedAnswer.isCorrect
        ? "is-correct"
        : "is-incorrect"
      : choice.key === question.answer.correct_choice_key
        ? "is-correct"
        : ""
    : "";

  return `
    <label class="question-choice ${answerState}">
      <span class="question-choice__top">
        <span class="choice-key">${escapeHtml(choice.key)}</span>
        <span>
          <input
            type="radio"
            name="selectedChoice"
            value="${escapeHtml(choice.key)}"
            ${savedAnswer ? "disabled" : ""}
            ${savedAnswer?.selectedChoiceKey === choice.key ? "checked" : ""}
          >
          ${escapeHtml(choice.text)}
        </span>
      </span>
    </label>
  `;
}

function renderImmediateFeedback(question, savedAnswer) {
  return `
    <div class="result-banner ${savedAnswer.isCorrect ? "" : "is-incorrect"}">
      <strong>${savedAnswer.isCorrect ? "Correct" : `Incorrect. Correct answer: ${escapeHtml(question.answer.correct_choice_key)}`}</strong>
      <div class="result-banner__reason">${escapeHtml(question.answer.reason)}</div>
      ${renderPageRefList(question.answer.source_page_refs)}
    </div>
  `;
}

function goToNextQuizStep(questionSet) {
  const session = state.quiz;
  if (session.currentIndex >= session.questions.length - 1) {
    session.completed = true;
    renderQuizSummary(questionSet);
    return;
  }

  session.currentIndex += 1;
  renderQuizQuestion(questionSet);
}

function renderQuizSummary(questionSet) {
  const session = state.quiz;
  const score = session.questions.reduce((total, question) => {
    return total + (session.answers[question.question_id]?.isCorrect ? 1 : 0);
  }, 0);

  elements.viewRoot.innerHTML = `
    <div class="section-stack">
      <div class="summary-card">
        <p class="panel__eyebrow">Quiz complete</p>
        <h2>Results</h2>
        <p class="summary-card__score">${score} / ${session.questions.length}</p>
        <p>${session.feedbackMode === "summary" ? "Answers and rationales are listed below." : "You can review the questions again below."}</p>
        <div class="inline-actions">
          <button class="button" type="button" id="retry-quiz-button">Try another set</button>
        </div>
      </div>
      <div class="section-stack">
        ${session.questions.map((question, index) => renderResultCard(question, index)).join("")}
      </div>
    </div>
  `;

  document.getElementById("retry-quiz-button").addEventListener("click", () => {
    const selectedChapter = getChapterBySlug(state.selectedChapterSlug);
    state.quiz = null;
    renderQuizSetup(selectedChapter, questionSet, getAsset(selectedChapter, VIEW_ASSET_TYPES.questions));
  });
}

function renderResultCard(question, index) {
  const answer = state.quiz.answers[question.question_id];
  const selectedLabel = answer?.selectedChoiceKey
    ? `${answer.selectedChoiceKey} - ${getChoiceLabel(question, answer.selectedChoiceKey)}`
    : "No answer";
  const correctLabel = `${question.answer.correct_choice_key} - ${getChoiceLabel(question, question.answer.correct_choice_key)}`;

  return `
    <article class="result-card">
      <div class="result-card__header">
        <div>
          <h3>Question ${index + 1}</h3>
        </div>
        <span class="badge ${answer?.isCorrect ? "" : "badge--planned"}">
          ${answer?.isCorrect ? "Correct" : "Needs review"}
        </span>
      </div>
      <div class="question-prompt">${escapeHtml(question.question)}</div>
      <p><strong>Your answer:</strong> ${escapeHtml(selectedLabel)}</p>
      <p><strong>Correct answer:</strong> ${escapeHtml(correctLabel)}</p>
      <p>${escapeHtml(question.answer.reason)}</p>
      ${renderPageRefList(question.answer.source_page_refs)}
    </article>
  `;
}

async function renderFlashcardsView(chapter) {
  const flashcardsAsset = getAsset(chapter, VIEW_ASSET_TYPES.flashcards);

  if (!flashcardsAsset) {
    renderMissingView("Flash Cards", "No flashcard deck is listed for this chapter yet.");
    return;
  }

  const flashcardSet = await loadJson(flashcardsAsset.path);

  if (!state.flashcards || state.flashcards.chapterSlug !== chapter.slug) {
    state.flashcards = createFlashcardSession(chapter.slug, flashcardSet.cards.length);
  }

  const session = state.flashcards;
  const currentCard = flashcardSet.cards[session.order[session.currentIndex]];

  elements.viewRoot.innerHTML = `
    <div class="section-stack">
      <div>
        <p class="panel__eyebrow">Flash cards</p>
        <h2>${escapeHtml(flashcardSet.deck.deck_name)}</h2>
        <p>${escapeHtml(flashcardSet.description)}</p>
      </div>

      <div class="flashcard-controls">
        <span class="chip chip--secondary">Card ${session.currentIndex + 1} of ${flashcardSet.cards.length}</span>
        <span class="chip">${escapeHtml(currentCard.topic)}</span>
      </div>

      <article class="flashcard-card">
        <div class="flashcard-inner">
          <div class="flashcard-face" id="flashcard-surface" tabindex="0" role="button" aria-pressed="${session.showingBack}">
            <span class="flashcard-face__label">${session.showingBack ? "Answer" : "Question"}</span>
            <div class="flashcard-face__text">${formatMultiline(session.showingBack ? currentCard.back : currentCard.front)}</div>
            ${session.showingBack ? renderPageRefList(currentCard.source_page_refs) : ""}
          </div>
          <div class="flashcard-footer">
            <div class="flashcard-meta">Tap the card or use the button to flip between question and answer.</div>
            <div class="inline-actions">
              <button class="ghost-button" type="button" id="flashcard-prev-button" ${session.currentIndex === 0 ? "disabled" : ""}>Previous</button>
              <button class="button" type="button" id="flashcard-flip-button">${session.showingBack ? "Show question" : "Show answer"}</button>
              <button class="ghost-button" type="button" id="flashcard-next-button" ${session.currentIndex === flashcardSet.cards.length - 1 ? "disabled" : ""}>Next</button>
            </div>
          </div>
        </div>
      </article>

      <div class="inline-actions">
        <button class="ghost-button" type="button" id="flashcard-shuffle-button">Shuffle deck</button>
      </div>
    </div>
  `;

  const toggleFlip = () => {
    session.showingBack = !session.showingBack;
    renderFlashcardsView(chapter);
  };

  document.getElementById("flashcard-surface").addEventListener("click", toggleFlip);
  document.getElementById("flashcard-surface").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  });

  document.getElementById("flashcard-flip-button").addEventListener("click", toggleFlip);
  document.getElementById("flashcard-prev-button").addEventListener("click", () => {
    session.currentIndex = Math.max(0, session.currentIndex - 1);
    session.showingBack = false;
    renderFlashcardsView(chapter);
  });
  document.getElementById("flashcard-next-button").addEventListener("click", () => {
    session.currentIndex = Math.min(flashcardSet.cards.length - 1, session.currentIndex + 1);
    session.showingBack = false;
    renderFlashcardsView(chapter);
  });
  document.getElementById("flashcard-shuffle-button").addEventListener("click", () => {
    state.flashcards = createFlashcardSession(chapter.slug, flashcardSet.cards.length);
    renderFlashcardsView(chapter);
  });
}

function createFlashcardSession(chapterSlug, cardCount) {
  return {
    chapterSlug,
    order: shuffle([...Array(cardCount).keys()]),
    currentIndex: 0,
    showingBack: false
  };
}

function renderMissingView(title, message) {
  elements.viewRoot.innerHTML = `
    <div class="empty-state">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

async function loadJson(path) {
  if (state.cache.has(path)) {
    return state.cache.get(path);
  }

  const response = await fetch(encodeURI(path));
  if (!response.ok) {
    throw new Error(`Unable to load ${path}.`);
  }

  const data = await response.json();
  state.cache.set(path, data);
  return data;
}

async function loadText(path) {
  if (state.cache.has(path)) {
    return state.cache.get(path);
  }

  const response = await fetch(encodeURI(path));
  if (!response.ok) {
    throw new Error(`Unable to load ${path}.`);
  }

  const text = await response.text();
  state.cache.set(path, text);
  return text;
}

function renderPageRefList(pageRefs) {
  if (!Array.isArray(pageRefs) || !pageRefs.length) {
    return "";
  }

  return `
    <div class="page-ref-list">
      ${pageRefs.map((page) => `<span class="page-ref" title="Source page reference">p${escapeHtml(String(page))}</span>`).join("")}
    </div>
  `;
}

function getChoiceLabel(question, choiceKey) {
  return question.choices.find((choice) => choice.key === choiceKey)?.text ?? "";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatMultiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function clampNumber(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function shuffle(items) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function encodeAttribute(value) {
  return encodeURI(value).replaceAll('"', "%22");
}
