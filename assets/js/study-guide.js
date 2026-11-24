/**
 * Motor compartilhado dos Guias de Estudos (ADS Study Hub)
 * - Highlight de sintaxe multi-linguagem (SQL, C, e extensível para novas linguagens)
 * - Navegação de abas e sub-abas
 * - Motor unificado de Quiz comentado
 * Compatível com GitHub Pages (https://) e abertura direta local (file://).
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ====== REGISTRO DE LINGUAGENS PARA SYNTAX HIGHLIGHT ======
  const LANGUAGES = {
    sql: {
      regex:
        /(--[^\n]*)|('[^']*')|\b(SELECT|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+OUTER\s+JOIN|CROSS\s+JOIN|JOIN|ON\s+DELETE\s+SET\s+NULL|ON\s+DELETE\s+CASCADE|ON\s+DELETE|ON|AS|AND|OR|NOT\s+IN|NOT\s+NULL|NOT|IS\s+NULL|IS|IN|BETWEEN|ILIKE|LIKE|COUNT|SUM|AVG|MAX|MIN|DISTINCT|CREATE\s+TABLE|INSERT\s+INTO|VALUES|UPDATE|SET|DELETE\s+FROM|BEGIN|COMMIT|ROLLBACK|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|UNIQUE|CHECK|DEFAULT|RESTRICT|NO\s+ACTION|INT|SERIAL|CHAR|VARCHAR|DECIMAL|DATE|BOOLEAN)\b|\b(NULL)\b|\b(\d+(?:\.\d+)?)\b/gi,
      mapGroups(match) {
        const [, com, str, kw, nul, num] = match;
        if (com) return 'sql-com';
        if (str) return 'sql-str';
        if (kw) return 'sql-kw';
        if (nul) return 'sql-null';
        if (num) return 'sql-num';
        return '';
      },
    },
    c: {
      regex:
        /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("[^"]*")|\b(typedef|struct|if|else|while|for|return|sizeof|exit|const|malloc|free|perror)\b|\b(void|int|float|char|No|Lista|EXIT_FAILURE)\b|\b(NULL)\b|\b(\d+)\b/g,
      mapGroups(match) {
        const [, com, str, kw, typ, nul, num] = match;
        if (com) return 'c-com';
        if (str) return 'c-str';
        if (kw) return 'c-kw';
        if (typ) return 'c-type';
        if (nul) return 'c-null';
        if (num) return 'c-num';
        return '';
      },
    },
    js: {
      regex:
        /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`[^`]*`|"[^"]*"|'[^']*')|\b(const|let|var|function|return|if|else|for|while|class|extends|import|from|export|default|new|this|typeof)\b|\b(Number|String|Boolean|Array|Object|JSON|console|document|window|localStorage|customElements|HTMLElement|useState)\b|\b(true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g,
      mapGroups(match) {
        const [, com, str, kw, typ, nul, num] = match;
        if (com) return 'tok-com';
        if (str) return 'tok-str';
        if (kw) return 'tok-kw';
        if (typ) return 'tok-type';
        if (nul) return 'tok-null';
        if (num) return 'tok-num';
        return '';
      },
    },
    json: {
      regex: /("[^"]*")|\b(true|false|null)\b|\b(-?\d+(?:\.\d+)?)\b/g,
      mapGroups(match) {
        const [, str, nul, num] = match;
        if (str) return 'tok-str';
        if (nul) return 'tok-null';
        if (num) return 'tok-num';
        return '';
      },
    },
    html: {
      regex: /(<!--[\s\S]*?-->)|("[^"]*"|'[^']*')|(<\/?[a-zA-Z0-9-]+|\/?>)/g,
      mapGroups(match) {
        const [, com, str, tag] = match;
        if (com) return 'tok-com';
        if (str) return 'tok-str';
        if (tag) return 'tok-kw';
        return '';
      },
    },
  };

  function registerLanguage(name, config) {
    if (name && config && config.regex instanceof RegExp && typeof config.mapGroups === 'function') {
      LANGUAGES[String(name).toLowerCase()] = config;
    }
  }

  function highlightCode(raw, lang) {
    const spec = LANGUAGES[String(lang || '').toLowerCase()];
    if (!spec) return escapeHtml(raw);

    let out = '';
    let lastIndex = 0;
    spec.regex.lastIndex = 0;
    let match;
    while ((match = spec.regex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        out += escapeHtml(raw.slice(lastIndex, match.index));
      }
      const cls = spec.mapGroups(match);
      const escaped = escapeHtml(match[0]);
      out += cls ? `<span class="${cls}">${escaped}</span>` : escaped;
      lastIndex = spec.regex.lastIndex;
    }
    if (lastIndex < raw.length) {
      out += escapeHtml(raw.slice(lastIndex));
    }
    return out;
  }

  function resolveBlockLang(el, fallbackLang) {
    const own = el.dataset.lang;
    if (own) return own;
    const parentWithLang = el.closest('[data-lang]');
    if (parentWithLang && parentWithLang.dataset.lang) return parentWithLang.dataset.lang;
    if (fallbackLang) return fallbackLang;
    return (document.body && document.body.dataset.lang) || '';
  }

  function highlightAllBlocks(root = document, options = {}) {
    const force = Boolean(options.force);
    const defaultLang = options.lang || state.lang;
    root.querySelectorAll('.code-block code').forEach((el) => {
      if (!force && el.dataset.highlighted === '1') return;
      const lang = resolveBlockLang(el, defaultLang);
      if (!LANGUAGES[String(lang).toLowerCase()]) return;
      el.innerHTML = highlightCode(el.textContent, lang);
      el.dataset.highlighted = '1';
    });
  }

  // ====== NAVEGAÇÃO DE ABAS E SUB-ABAS ======
  function showTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
  }

  function showSubtab(parentId, subId, btn) {
    const parent = document.getElementById(parentId);
    if (!parent) return;
    parent.querySelectorAll('.subpanel').forEach((p) => p.classList.remove('active'));
    parent.querySelectorAll('.subtab-btn').forEach((b) => b.classList.remove('active'));
    const target = document.getElementById(subId);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
  }

  // ====== QUIZ ENGINE ======
  const state = {
    lang: '',
    quizQuestions: [],
    quizAnswers: {},
    currentQuizFilter: 'all',
    quizSubtitle: '',
  };

  function getQuestions() {
    if (Array.isArray(state.quizQuestions) && state.quizQuestions.length > 0) {
      return state.quizQuestions;
    }
    if (Array.isArray(global.quizQuestions)) {
      return global.quizQuestions;
    }
    return [];
  }

  function buildQuestionCardInner(q, idx, total) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const answeredIdx = state.quizAnswers[q.id];
    const isAnswered = answeredIdx !== undefined;
    const isCorrect = answeredIdx === q.correct;

    let optsHtml = '<div class="quiz-options">';
    q.options.forEach((optText, optIdx) => {
      let cls = 'opt-btn';
      if (isAnswered) {
        if (optIdx === q.correct) cls += ' correct';
        else if (optIdx === answeredIdx) cls += ' wrong';
      }
      optsHtml += `<button class="${cls}" ${isAnswered ? 'disabled' : ''} onclick="answerQuiz('${q.id}', ${optIdx})">
          <span class="opt-letter">${letters[optIdx]})</span>
          <span>${optText}</span>
        </button>`;
    });
    optsHtml += '</div>';

    let fbHtml = '';
    if (isAnswered) {
      const wrongList = Object.entries(q.wrongReasons || {})
        .map(([, txt]) => `<li>${txt}</li>`)
        .join('');

      if (isCorrect) {
        fbHtml = `<div class="feedback show certo">
            <strong>✅ Na mosca!</strong> ${q.correctExplain}
            <details class="fb-details">
              <summary>Ver por que as outras estão erradas</summary>
              <div class="wrong-reasons"><ul>${wrongList}</ul></div>
            </details>
          </div>`;
      } else {
        fbHtml = `<div class="feedback show errado">
            <strong>❌ Aqui escapou! A certa é a ${letters[q.correct]}.</strong> ${q.correctExplain}
            <div class="wrong-reasons">
              <h5>Por que cada errada não cola:</h5>
              <ul>${wrongList}</ul>
            </div>
          </div>`;
      }
    }

    const numStr = String(idx + 1).padStart(2, '0');
    return `
        <div class="quiz-q-header">
          <span class="q-num">Questão ${numStr} de ${total}</span>
          <span class="q-topic">${q.topic}</span>
        </div>
        <div class="q-text">${q.title}</div>
        ${q.extraHtml || ''}
        ${optsHtml}
        ${fbHtml}
        ${isAnswered ? `<div class="q-actions"><button class="redo-btn" onclick="redoQuestion('${q.id}')">↺ Refazer esta</button></div>` : ''}
      `;
  }

  function renderQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const questions = getQuestions();
    const total = questions.length;
    container.innerHTML = '';

    questions.forEach((q, idx) => {
      if (state.currentQuizFilter !== 'all' && q.topic !== state.currentQuizFilter) return;

      const card = document.createElement('div');
      card.className = 'quiz-q';
      card.id = q.id;
      card.innerHTML = buildQuestionCardInner(q, idx, total);
      container.appendChild(card);
    });

    highlightAllBlocks(container);
    updateScore();
  }

  function refreshQuestionCard(qId) {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    const questions = getQuestions();
    const idx = questions.findIndex((q) => q.id === qId);
    if (idx === -1) return;
    const card = Array.from(container.children).find((el) => el.id === qId);
    if (!card) {
      renderQuiz();
      return;
    }
    card.innerHTML = buildQuestionCardInner(questions[idx], idx, questions.length);
    highlightAllBlocks(card);
    updateScore();
  }

  function answerQuiz(qId, optIdx) {
    if (state.quizAnswers[qId] !== undefined) return;
    state.quizAnswers[qId] = optIdx;
    refreshQuestionCard(qId);
  }

  function redoQuestion(qId) {
    delete state.quizAnswers[qId];
    refreshQuestionCard(qId);
  }

  function resetQuiz() {
    Object.keys(state.quizAnswers).forEach((k) => delete state.quizAnswers[k]);
    renderQuiz();
  }

  function filterQuiz(topic, btn) {
    state.currentQuizFilter = topic;
    document.querySelectorAll('#quiz-filters .subtab-btn').forEach((b) => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderQuiz();
  }

  function updateScore() {
    const questions = getQuestions();
    const total = questions.length;
    const answeredCount = Object.keys(state.quizAnswers).length;
    const hits = questions.filter((q) => state.quizAnswers[q.id] === q.correct).length;

    const scoreEl = document.getElementById('scoreDisplay');
    const subEl = document.getElementById('scoreSubtitle');
    const fillEl = document.getElementById('progressFill');

    if (scoreEl) scoreEl.textContent = `${hits}/${total}`;
    if (subEl) {
      const suffix = state.quizSubtitle || subEl.dataset.subtitle || '';
      subEl.textContent = suffix
        ? `${answeredCount} de ${total} respondidas · ${suffix}`
        : `${answeredCount} de ${total} respondidas`;
    }
    if (fillEl) {
      fillEl.style.width = total > 0 ? `${(answeredCount / total) * 100}%` : '0%';
    }
  }

  function init(options = {}) {
    if (options.lang) state.lang = options.lang;
    if (Array.isArray(options.quizQuestions)) {
      state.quizQuestions = options.quizQuestions;
    } else if (Array.isArray(global.quizQuestions)) {
      state.quizQuestions = global.quizQuestions;
    }
    if (typeof options.quizSubtitle === 'string') {
      state.quizSubtitle = options.quizSubtitle;
    }
    state.currentQuizFilter = 'all';

    highlightAllBlocks(document, { lang: state.lang });
    renderQuiz();
  }

  // Exposição em namespace + aliases globais para compatibilidade com atributos onclick
  global.StudyGuide = {
    init,
    registerLanguage,
    highlightCode,
    highlightAllBlocks,
    showTab,
    showSubtab,
    renderQuiz,
    answerQuiz,
    redoQuestion,
    resetQuiz,
    filterQuiz,
    updateScore,
  };

  global.escapeHtml = escapeHtml;
  global.highlightAllBlocks = highlightAllBlocks;
  global.showTab = showTab;
  global.showSubtab = showSubtab;
  global.renderQuiz = renderQuiz;
  global.answerQuiz = answerQuiz;
  global.redoQuestion = redoQuestion;
  global.resetQuiz = resetQuiz;
  global.filterQuiz = filterQuiz;
  global.updateScore = updateScore;
})(window);
