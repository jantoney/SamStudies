const VIEW_ASSET_TYPES = {
  notes: "study_notes_markdown",
  questions: "exam_prep_questions_json",
  flashcards: "flashcards_json",
};

const state = {
  index: null,
  selectedChapterSlug: null,
  view: null,
  cache: new Map(),
  quiz: null,
  flashcards: null,
};

const elements = {};
let resizeFrame = 0;
let lastViewportSize = {
  width: 0,
  height: 0,
};
const HIDDEN_NOTE_SECTION_TITLES = new Set([
  "description",
  "source notes",
  "page reference convention",
  "disclaimer",
]);

document.addEventListener("DOMContentLoaded", () => {
  elements.chapterSelect = document.getElementById("chapter-select");
  elements.themeToggle = document.getElementById("theme-toggle");
  elements.immersiveThemeToggle = document.getElementById(
    "immersive-theme-toggle",
  );
  elements.immersiveBack = document.getElementById("immersive-back");
  elements.immersiveTitle = document.getElementById("immersive-title");
  elements.immersiveAction = document.getElementById("immersive-action");
  elements.chapterSummary = document.getElementById("chapter-summary");
  elements.modeNav = document.getElementById("mode-nav");
  elements.viewRoot = document.getElementById("view-root");
  elements.disclaimerSummary = document.getElementById("disclaimer-summary");

  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.immersiveThemeToggle.addEventListener("click", toggleTheme);

  elements.chapterSelect.addEventListener("change", () => {
    const slug = elements.chapterSelect.value;
    if (slug) {
      window.location.hash = buildHash(slug, null);
    }
  });

  elements.immersiveBack.addEventListener("click", () => {
    const chapter = getChapterBySlug(state.selectedChapterSlug);
    const backHash =
      chapter && hasViewAsset(chapter, "notes")
        ? buildHash(chapter.slug, "notes")
        : buildHash(state.selectedChapterSlug, null);
    window.location.hash = backHash;
  });

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
  initTheme();
  syncViewportMetrics();
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
        tertiaryColor: "#e6f0ef",
      },
    });
  }

  state.index = await loadJson(
    "Generated Study Notes/study-content-index.json",
  );
  populateGlobalMeta();
  window.addEventListener("hashchange", () => applyRoute(window.location.hash));
  window.addEventListener("resize", scheduleViewportRefresh, { passive: true });
  window.addEventListener("orientationchange", scheduleViewportRefresh, {
    passive: true,
  });
  applyRoute(window.location.hash);
}

function populateGlobalMeta() {
  // disclaimer is now shown inside the per-chapter Description & Disclaimer section
}

function getChapters() {
  return state.index?.chapters ?? [];
}

function getDefaultChapter() {
  return (
    getChapters().find((chapter) => chapter.status === "complete") ??
    getChapters()[0] ??
    null
  );
}

function getChapterBySlug(slug) {
  return getChapters().find((chapter) => chapter.slug === slug) ?? null;
}

function getAsset(chapter, assetType) {
  return (
    chapter?.assets?.find((asset) => asset.asset_type === assetType) ?? null
  );
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
      view: parts[2] ?? null,
    };
  }

  return {
    slug: getDefaultChapter()?.slug ?? null,
    view: null,
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
    elements.chapterSummary.innerHTML = `
      <div class="error-state">
        <h2>No chapters were found</h2>
        <p>The study-content index did not return any chapter entries.</p>
      </div>
    `;
    return;
  }

  const firstAvailable =
    Object.keys(VIEW_ASSET_TYPES).find((v) => hasViewAsset(chapter, v)) ?? null;
  const requestedView =
    parsed.view && Object.hasOwn(VIEW_ASSET_TYPES, parsed.view)
      ? parsed.view
      : null;
  const safeView =
    requestedView && hasViewAsset(chapter, requestedView)
      ? requestedView
      : firstAvailable;
  const nextHash = buildHash(chapter.slug, safeView);

  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }

  const previousView = state.view;
  const chapterChanged = state.selectedChapterSlug !== chapter.slug;
  state.selectedChapterSlug = chapter.slug;
  state.view = safeView;

  if (
    chapterChanged ||
    (previousView === "questions" && safeView !== "questions")
  ) {
    state.quiz = null;
  }

  if (chapterChanged) {
    state.flashcards = null;
  }

  updateImmersiveState();
  renderChapterSelect();
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

function renderChapterSelect() {
  elements.chapterSelect.innerHTML = getChapters()
    .map((chapter) => {
      const label = `Chapter ${chapter.chapter_code} — ${chapter.title}`;
      return `<option value="${escapeHtml(chapter.slug)}" ${chapter.slug === state.selectedChapterSlug ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function renderChapterSummary(chapter) {
  elements.chapterSummary.innerHTML = `
    <div class="chapter-summary__header">
      <div>
        <span class="chapter-summary__label">Chapter</span>
        <h2 class="chapter-summary__title">${escapeHtml(chapter.title)}</h2>
      </div>
    </div>
  `;
}

function renderModeNav(chapter) {
  const modeButtons = [
    ["notes", "Study Notes"],
    ["questions", "Exam Questions"],
    ["flashcards", "Flash Cards"],
  ];

  elements.modeNav.innerHTML = modeButtons
    .map(([view, title]) => {
      const disabled = !hasViewAsset(chapter, view);
      return `
        <button
          class="mode-button ${state.view === view ? "is-active" : ""} ${disabled ? "is-disabled" : ""}"
          type="button"
          data-target-hash="${escapeHtml(buildHash(chapter.slug, view))}"
          ${disabled ? "disabled" : ""}
        >${escapeHtml(title)}</button>
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
    renderMissingView(
      "Study Notes",
      "No markdown notes are listed for this chapter yet.",
    );
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
        <article class="notes-content" id="notes-content"></article>
      </div>
      <aside class="toc-card">
        <p class="panel__eyebrow">In this chapter</p>
        <h3>Contents</h3>
        <div class="toc-list" id="toc-list"></div>
      </aside>
    </div>
    <button class="notes-top-button" type="button" id="notes-top-button" aria-label="Return to the top of the page">TOP ^</button>
  `;

  const notesContent = document.getElementById("notes-content");
  notesContent.innerHTML = window.marked.parse(markdown, {
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
  });

  hydrateRenderedNotes(notesContent);
  renderNotesToc(notesContent);
  await renderMermaidBlocks(notesContent);

  document.getElementById("notes-top-button")?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

function hydrateRenderedNotes(root) {
  // Suppress the first h1 — it repeats the chapter title shown in the summary panel
  const firstH1 = root.querySelector("h1");
  if (firstH1) firstH1.remove();

  removeHiddenNoteSections(root);

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
    node.innerHTML = node.innerHTML.replace(
      /\[(\d+)\]/g,
      '<span class="page-ref" title="Source page reference">Page $1</span>',
    );
  });
}

function removeHiddenNoteSections(root) {
  const headings = [...root.querySelectorAll("h2")].filter((heading) =>
    HIDDEN_NOTE_SECTION_TITLES.has(heading.textContent.trim().toLowerCase()),
  );

  headings.forEach((heading) => {
    let current = heading;

    while (current) {
      const next = current.nextElementSibling;
      current.remove();

      if (!next || next.tagName === "H2") {
        break;
      }

      current = next;
    }
  });
}

function renderNotesToc(root) {
  const tocList = document.getElementById("toc-list");
  const headings = [...root.querySelectorAll("h2, h3")];

  if (!headings.length) {
    tocList.innerHTML =
      '<p class="helper-text">The notes did not contain section headings.</p>';
    return;
  }

  tocList.innerHTML = headings
    .map((heading) => {
      const indent =
        heading.tagName === "H3" ? ' style="padding-left: 12px"' : "";
      return `<button class="toc-link" type="button" data-heading-id="${escapeHtml(heading.id)}"${indent}>${escapeHtml(heading.textContent)}</button>`;
    })
    .join("");

  tocList.querySelectorAll("[data-heading-id]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.headingId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
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
    querySelector: ".mermaid",
  });
}

async function renderQuestionsView(chapter) {
  const questionsAsset = getAsset(chapter, VIEW_ASSET_TYPES.questions);

  if (!questionsAsset) {
    renderMissingView(
      "Exam Questions",
      "No exam question set is listed for this chapter yet.",
    );
    return;
  }

  const questionSet = await loadJson(questionsAsset.path);
  const sameChapterSession =
    state.quiz && state.quiz.chapterSlug === chapter.slug;

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
  setViewRootScrollable(true);
  updateImmersiveTitle("Exam questions");
  updateImmersiveAction(null);

  elements.viewRoot.innerHTML = `
    <div class="section-stack quiz-screen quiz-screen--setup">
      <form class="quiz-settings" id="quiz-settings-form">
        <p class="quiz-settings__summary">Questions will be randomized from (${totalQuestions}) total available questions.</p>
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

  document
    .getElementById("quiz-settings-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const requestedCount = Number.parseInt(formData.get("questionCount"), 10);
      const questionCount = clampNumber(requestedCount, 1, totalQuestions);
      const feedbackMode =
        formData.get("feedbackMode") === "summary" ? "summary" : "immediate";
      const selectedQuestions = shuffle([...questionSet.questions]).slice(
        0,
        questionCount,
      );

      state.quiz = {
        chapterSlug: chapter.slug,
        feedbackMode,
        questions: selectedQuestions,
        currentIndex: 0,
        answers: {},
        completed: false,
      };

      renderQuizQuestion(questionSet);
    });

  const questionCountInput = document.getElementById("question-count");
  questionCountInput.addEventListener("focus", () => {
    questionCountInput.select();
  });
}

function renderQuizQuestion(questionSet) {
  const session = state.quiz;
  const question = session.questions[session.currentIndex];
  const savedAnswer = session.answers[question.question_id] ?? null;
  const isAnswered = Boolean(savedAnswer);
  const isImmediate = session.feedbackMode === "immediate";
  const isSummaryMode = session.feedbackMode === "summary";
  const hasSelectedChoice = Boolean(savedAnswer?.selectedChoiceKey);
  const progressValue =
    ((session.currentIndex + 1) / session.questions.length) * 100;
  const primaryButtonLabel = isImmediate
    ? "Check Answer"
    : session.currentIndex === session.questions.length - 1
      ? "View Results"
      : "Next Question";
  setViewRootScrollable(isSummaryMode);
  updateImmersiveTitle(
    `Q: ${session.currentIndex + 1} of ${session.questions.length}`,
  );
  updateImmersiveAction({
    label: "Start Over",
    ariaLabel: "Start exam over",
    onClick: () => {
      const selectedChapter = getChapterBySlug(state.selectedChapterSlug);
      state.quiz = null;
      renderQuizSetup(
        selectedChapter,
        questionSet,
        getAsset(selectedChapter, VIEW_ASSET_TYPES.questions),
      );
    },
  });

  elements.viewRoot.innerHTML = `
    <div class="section-stack quiz-screen quiz-screen--question ${isSummaryMode ? "quiz-screen--scroll" : ""}">
      <div class="quiz-progress-row">
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-bar__fill" style="width: ${progressValue.toFixed(2)}%"></div>
        </div>
      </div>

      <form class="question-card ${isSummaryMode ? "question-card--scroll" : ""}" id="question-form">
        <div class="question-prompt">${escapeHtml(question.question)}</div>
        <div class="question-choices">
          ${getVisibleChoices(question, savedAnswer, isImmediate)
            .map((choice) => renderChoice(question, choice, savedAnswer))
            .join("")}
        </div>
        ${isImmediate && isAnswered ? renderImmediateFeedback(question, savedAnswer) : ""}
        <div class="inline-actions question-actions">
          ${
            !(isImmediate && isAnswered)
              ? `<button class="button" type="submit" id="question-submit-button" ${hasSelectedChoice ? "" : "disabled"}>${primaryButtonLabel}</button>`
              : ""
          }
          ${
            isImmediate && isAnswered
              ? `<button class="button" type="button" id="next-question-button">${session.currentIndex === session.questions.length - 1 ? "View Results" : "Next Question"}</button>`
              : ""
          }
        </div>
      </form>
    </div>
  `;

  const questionForm = document.getElementById("question-form");
  const submitButton = document.getElementById("question-submit-button");
  questionForm.addEventListener("change", () => {
    questionForm.querySelectorAll(".question-choice").forEach((node) => {
      const input = node.querySelector("input");
      node.classList.toggle("is-selected", input.checked);
    });

    if (submitButton) {
      submitButton.disabled = !questionForm.querySelector(
        'input[name="selectedChoice"]:checked',
      );
    }
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
      isCorrect: selectedChoiceKey === question.answer.correct_choice_key,
    };

    if (session.feedbackMode === "immediate") {
      renderQuizQuestion(questionSet);
      return;
    }

    goToNextQuizStep(questionSet);
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

function getVisibleChoices(question, savedAnswer, isImmediate) {
  if (!savedAnswer || !isImmediate) {
    return question.choices;
  }

  const visibleKeys = new Set([question.answer.correct_choice_key]);
  if (!savedAnswer.isCorrect) {
    visibleKeys.add(savedAnswer.selectedChoiceKey);
  }

  return question.choices.filter((choice) => visibleKeys.has(choice.key));
}

function renderImmediateFeedback(question, savedAnswer) {
  return `
    <div class="result-banner ${savedAnswer.isCorrect ? "" : "is-incorrect"}">
      <strong>${savedAnswer.isCorrect ? `Correct answer: ${escapeHtml(question.answer.correct_choice_key)}` : `Incorrect. Correct answer: ${escapeHtml(question.answer.correct_choice_key)}`}</strong>
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
  setViewRootScrollable(true);
  updateImmersiveTitle(`${score} / ${session.questions.length} correct`);
  updateImmersiveAction(null);

  elements.viewRoot.innerHTML = `
    <div class="section-stack quiz-screen quiz-screen--summary">
      <div class="summary-card">
        <div class="summary-card__row">
          <p class="summary-card__score">${score} / ${session.questions.length} correct</p>
          <button class="button" type="button" id="retry-quiz-button">Try another set</button>
        </div>
      </div>
      ${session.questions.map((question, index) => renderResultCard(question, index)).join("")}
    </div>
  `;

  document.getElementById("retry-quiz-button").addEventListener("click", () => {
    const selectedChapter = getChapterBySlug(state.selectedChapterSlug);
    state.quiz = null;
    renderQuizSetup(
      selectedChapter,
      questionSet,
      getAsset(selectedChapter, VIEW_ASSET_TYPES.questions),
    );
  });
}

function renderResultCard(question, index) {
  const answer = state.quiz.answers[question.question_id];
  const selectedLabel = answer?.selectedChoiceKey
    ? `${answer.selectedChoiceKey} - ${getChoiceLabel(question, answer.selectedChoiceKey)}`
    : "No answer";
  const correctLabel = `${question.answer.correct_choice_key} - ${getChoiceLabel(question, question.answer.correct_choice_key)}`;
  const passed = Boolean(answer?.isCorrect);

  return `
    <article class="result-card">
      <div class="result-card__header">
        <div>
          <h3>Question ${index + 1}</h3>
        </div>
        <span class="badge result-status ${passed ? "" : "badge--fail"}">
          <span class="result-status__icon" aria-hidden="true">${passed ? "✓" : "✕"}</span>
          ${passed ? "Pass" : "Fail"}
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
  setViewRootScrollable(false);

  if (!flashcardsAsset) {
    renderMissingView(
      "Flash Cards",
      "No flashcard deck is listed for this chapter yet.",
    );
    return;
  }

  const flashcardSet = await loadJson(flashcardsAsset.path);

  if (!state.flashcards || state.flashcards.chapterSlug !== chapter.slug) {
    state.flashcards = createFlashcardSession(
      chapter.slug,
      flashcardSet.cards.length,
    );
  }

  const session = state.flashcards;
  if (session.completed) {
    renderFlashcardSummary(chapter);
    return;
  }

  const currentCard = flashcardSet.cards[session.order[session.currentIndex]];
  updateImmersiveTitle(
    `Card ${session.currentIndex + 1} of ${flashcardSet.cards.length}`,
  );
  updateImmersiveAction(null);

  elements.viewRoot.innerHTML = `
    <div class="section-stack">
      <div class="flashcard-controls">
        <span class="chip chip--secondary">Card ${session.currentIndex + 1} of ${flashcardSet.cards.length}</span>
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
            <div class="inline-actions flashcard-actions">
              <button class="ghost-button" type="button" id="flashcard-prev-button" ${session.currentIndex === 0 ? "disabled" : ""}>Previous</button>
              <button class="button" type="button" id="flashcard-primary-button" ${session.showingBack && session.currentIndex === flashcardSet.cards.length - 1 ? "disabled" : ""}>${session.showingBack ? "Next" : "Show answer"}</button>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;

  const toggleFlip = () => {
    session.showingBack = !session.showingBack;
    renderFlashcardsView(chapter);
  };

  document
    .getElementById("flashcard-surface")
    .addEventListener("click", toggleFlip);
  document
    .getElementById("flashcard-surface")
    .addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFlip();
      }
    });

  document
    .getElementById("flashcard-prev-button")
    .addEventListener("click", () => {
      session.currentIndex = Math.max(0, session.currentIndex - 1);
      session.showingBack = false;
      renderFlashcardsView(chapter);
    });
  document
    .getElementById("flashcard-primary-button")
    .addEventListener("click", () => {
      if (!session.showingBack) {
        toggleFlip();
        return;
      }

      goToNextFlashcard(chapter, flashcardSet.cards.length);
    });
}

function renderFlashcardSummary(chapter) {
  const session = state.flashcards;
  setViewRootScrollable(false);
  updateImmersiveTitle("Deck complete");
  updateImmersiveAction(null);

  elements.viewRoot.innerHTML = `
    <div class="section-stack flashcard-summary-screen">
      <div class="summary-card">
        <p class="panel__eyebrow">Flash cards</p>
        <h2>Deck complete</h2>
        <p class="summary-card__score">${session.order.length} / ${session.order.length}</p>
        <p>You have seen every card in this randomized run. Choose what to do next.</p>
        <div class="inline-actions flashcard-summary-actions">
          <button class="ghost-button" type="button" id="flashcard-summary-notes">Study Notes</button>
          <button class="ghost-button" type="button" id="flashcard-summary-questions">Exam Questions</button>
          <button class="button" type="button" id="flashcard-summary-reshuffle">Reshuffle Deck</button>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("flashcard-summary-reshuffle")
    .addEventListener("click", () => {
      state.flashcards = createFlashcardSession(
        chapter.slug,
        session.cardCount,
      );
      renderFlashcardsView(chapter);
    });

  document
    .getElementById("flashcard-summary-notes")
    .addEventListener("click", () => {
      window.location.hash = buildHash(chapter.slug, "notes");
    });

  document
    .getElementById("flashcard-summary-questions")
    .addEventListener("click", () => {
      window.location.hash = buildHash(chapter.slug, "questions");
    });
}

function goToNextFlashcard(chapter, cardCount) {
  const session = state.flashcards;
  const hasFutureHistory = session.currentIndex < session.order.length - 1;

  if (hasFutureHistory) {
    session.currentIndex += 1;
    session.showingBack = false;
    renderFlashcardsView(chapter);
    return;
  }

  if (!session.remaining.length) {
    session.completed = true;
    renderFlashcardSummary(chapter);
    return;
  }

  const nextPosition = Math.floor(Math.random() * session.remaining.length);
  const [nextCardIndex] = session.remaining.splice(nextPosition, 1);
  session.order.push(nextCardIndex);
  session.currentIndex = session.order.length - 1;
  session.showingBack = false;
  if (session.order.length >= cardCount && !session.remaining.length) {
    renderFlashcardsView(chapter);
    return;
  }

  renderFlashcardsView(chapter);
}

function createFlashcardSession(chapterSlug, cardCount) {
  const allIndexes = [...Array(cardCount).keys()];
  const firstPosition = Math.floor(Math.random() * allIndexes.length);
  const [firstCardIndex] = allIndexes.splice(firstPosition, 1);

  return {
    chapterSlug,
    cardCount,
    order: [firstCardIndex],
    remaining: allIndexes,
    currentIndex: 0,
    showingBack: false,
    completed: false,
  };
}

function renderMissingView(title, message) {
  setViewRootScrollable(false);
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
      ${pageRefs.map((page) => `<span class="page-ref" title="Source page reference">Page ${escapeHtml(String(page))}</span>`).join("")}
    </div>
  `;
}

function getChoiceLabel(question, choiceKey) {
  return (
    question.choices.find((choice) => choice.key === choiceKey)?.text ?? ""
  );
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

function setViewRootScrollable(isScrollable) {
  if (elements.viewRoot) {
    elements.viewRoot.classList.toggle("view-root--scrollable", isScrollable);
  }
}

function encodeAttribute(value) {
  return encodeURI(value).replaceAll('"', "%22");
}

function toTitleCase(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.innerHTML = isDark ? sunSvg : moonSvg;
    btn.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  });
}

function updateImmersiveState() {
  const isImmersive = state.view === "questions" || state.view === "flashcards";
  document.body.classList.toggle("is-immersive", isImmersive);
  if (!isImmersive) {
    setViewRootScrollable(false);
    updateImmersiveTitle("");
    updateImmersiveAction(null);
  }

  if (state.view !== "flashcards") {
    updateImmersiveAction(null);
  }
}

function updateImmersiveTitle(title) {
  if (elements.immersiveTitle) {
    elements.immersiveTitle.textContent = title;
  }
}

function updateImmersiveAction(config) {
  if (!elements.immersiveAction) {
    return;
  }

  elements.immersiveAction.replaceWith(
    elements.immersiveAction.cloneNode(false),
  );
  elements.immersiveAction = document.getElementById("immersive-action");

  if (!config) {
    elements.immersiveAction.hidden = true;
    elements.immersiveAction.textContent = "";
    elements.immersiveAction.removeAttribute("aria-label");
    return;
  }

  elements.immersiveAction.hidden = false;
  elements.immersiveAction.textContent = config.label;
  elements.immersiveAction.setAttribute(
    "aria-label",
    config.ariaLabel ?? config.label,
  );
  elements.immersiveAction.addEventListener("click", config.onClick);
}

function scheduleViewportRefresh() {
  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
  }

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;

    if (shouldPreserveFocusedInput()) {
      syncViewportMetrics();
      return;
    }

    const viewportChanged = syncViewportMetrics();
    if (!viewportChanged) {
      return;
    }

    const chapter = getChapterBySlug(state.selectedChapterSlug);
    if (!chapter || !state.view) {
      return;
    }

    updateImmersiveState();
    renderView(chapter).catch((error) => {
      console.error(error);
    });
  });
}

function shouldPreserveFocusedInput() {
  const activeElement = document.activeElement;
  if (!activeElement) {
    return false;
  }

  if (!(activeElement instanceof HTMLElement)) {
    return false;
  }

  const tagName = activeElement.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function syncViewportMetrics() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  document.documentElement.style.setProperty(
    "--viewport-height",
    `${height}px`,
  );

  const changed =
    width !== lastViewportSize.width || height !== lastViewportSize.height;
  lastViewportSize = { width, height };
  return changed;
}
