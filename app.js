// ====================================================================
// שאלון חוזקות VIA - לוגיקת האפליקציה
// ====================================================================

(function () {
  "use strict";

  // --- אלמנטים ---
  const screens = {
    intro:   document.getElementById("screen-intro"),
    quiz:    document.getElementById("screen-quiz"),
    results: document.getElementById("screen-results"),
  };
  const questionsList = document.getElementById("questions-list");
  const form          = document.getElementById("quiz-form");
  const quizError     = document.getElementById("quiz-error");
  const progressFill  = document.getElementById("progress-fill");
  const progressText  = document.getElementById("progress-text");
  const resultsList   = document.getElementById("results-list");
  const developList   = document.getElementById("develop-list");
  const emailForm     = document.getElementById("email-form");
  const emailInput    = document.getElementById("email-input");
  const emailBtn      = document.getElementById("email-btn");
  const emailStatus   = document.getElementById("email-status");

  // שומר את התוצאות האחרונות לצורך שליחה במייל
  let lastScored = null;

  // --- מצב התשובות: { [questionNumber]: value 1..5 } ---
  const answers = {};

  // --- חיבור קישורי הרשתות החברתיות ---
  function wireSocialLinks() {
    const map = {
      "link-instagram": SOCIAL_LINKS.instagram,
      "link-facebook":  SOCIAL_LINKS.facebook,
      "link-whatsapp":  SOCIAL_LINKS.whatsapp,
    };
    Object.keys(map).forEach(function (id) {
      const el = document.getElementById(id);
      if (el && map[id]) el.setAttribute("href", map[id]);
    });
  }

  // --- מעבר בין מסכים ---
  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("hidden", key !== name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- רינדור 48 השאלות ---
  function renderQuestions() {
    const frag = document.createDocumentFragment();

    QUESTIONS.forEach(function (q) {
      const card = document.createElement("div");
      card.className = "q-card";
      card.dataset.q = q.n;

      const text = document.createElement("p");
      text.className = "q-text";
      text.innerHTML = '<span class="q-num">' + q.n + "</span>" + q.text;
      card.appendChild(text);

      const scale = document.createElement("div");
      scale.className = "scale";
      scale.setAttribute("role", "radiogroup");
      scale.setAttribute("aria-label", q.text);

      SCALE.forEach(function (opt) {
        const id = "q" + q.n + "_" + opt.value;
        const label = document.createElement("label");
        label.className = "scale-opt";
        label.setAttribute("for", id);

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "q" + q.n;
        input.id = id;
        input.value = String(opt.value);
        input.addEventListener("change", function () {
          answers[q.n] = opt.value;
          card.classList.add("answered");
          card.classList.remove("missing");
          updateProgress();
        });

        const dot = document.createElement("span");
        dot.className = "scale-dot";
        dot.textContent = opt.value;

        const cap = document.createElement("span");
        cap.className = "scale-cap";
        cap.textContent = opt.label;

        label.appendChild(input);
        label.appendChild(dot);
        label.appendChild(cap);
        scale.appendChild(label);
      });

      card.appendChild(scale);
      frag.appendChild(card);
    });

    questionsList.appendChild(frag);
  }

  // --- עדכון פס ההתקדמות ---
  function updateProgress() {
    const done = Object.keys(answers).length;
    const total = QUESTIONS.length;
    const pct = Math.round((done / total) * 100);
    progressFill.style.width = pct + "%";
    progressText.textContent = done + " / " + total;
  }

  // --- חישוב הציונים: מחזיר את כל 24 החוזקות ממוינות יורד ---
  function computeScores() {
    const scored = STRENGTHS.map(function (s) {
      const posVal = answers[s.pos];            // חיובית: כמו שהיא
      const negVal = 6 - answers[s.neg];        // שלילית: היפוך
      const score = posVal + negVal;            // טווח 2..10
      return { name: s.name, virtue: s.virtue, desc: s.desc, biz: s.biz, score: score };
    });
    // מיון יורד; שובר-שוויון יציב לפי סדר השאלון
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  // --- רינדור התוצאות: 5 מובילות + 3 לפיתוח ---
  function renderResults(scored) {
    lastScored = scored;                         // נשמר לשליחה במייל
    const top5 = scored.slice(0, 5);
    const bottom3 = scored.slice(-3).reverse(); // 3 הנמוכות, מהגבוהה לנמוכה

    resultsList.innerHTML = "";
    top5.forEach(function (s, i) {
      const li = document.createElement("li");
      li.className = "result-item";

      li.innerHTML =
        '<div class="result-rank">' + (i + 1) + '</div>' +
        '<div class="result-body">' +
          '<div class="result-top">' +
            '<h3 class="result-name">' + s.name + '</h3>' +
            '<span class="result-virtue">' + s.virtue + '</span>' +
          '</div>' +
          '<p class="result-desc">' + s.desc + '</p>' +
          '<div class="result-biz"><span class="result-biz-tag">בעסק שלך</span>' + s.biz + '</div>' +
          '<div class="result-meter">' +
            '<div class="result-meter-fill" style="width:' + (s.score / 10 * 100) + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="result-score"><b>' + s.score + '</b><small>מתוך 10</small></div>';

      resultsList.appendChild(li);
    });

    // --- 3 חוזקות לפיתוח ---
    developList.innerHTML = "";
    bottom3.forEach(function (s) {
      const li = document.createElement("li");
      li.className = "develop-item";
      li.innerHTML =
        '<div class="develop-body">' +
          '<div class="result-top">' +
            '<h4 class="develop-name">' + s.name + '</h4>' +
            '<span class="result-virtue">' + s.virtue + '</span>' +
          '</div>' +
          '<p class="result-desc">' + s.desc + '</p>' +
        '</div>' +
        '<div class="develop-score"><b>' + s.score + '</b><small>מתוך 10</small></div>';
      developList.appendChild(li);
    });
  }

  // --- בניית תוכן המייל מהתוצאות ---
  function buildEmailContent(scored) {
    const top5 = scored.slice(0, 5);
    const bottom3 = scored.slice(-3).reverse();

    // גרסת טקסט (ל-fallback ולתבניות פשוטות)
    let text = "5 החוזקות המובילות שלך:\n\n";
    top5.forEach(function (s, i) {
      text += (i + 1) + ". " + s.name + " (" + s.virtue + ") · " + s.score + "/10\n";
      text += s.desc + "\n";
      text += "בעסק שלך: " + s.biz + "\n\n";
    });
    text += "3 חוזקות לפיתוח:\n";
    bottom3.forEach(function (s) {
      text += "• " + s.name + " (" + s.virtue + ") · " + s.score + "/10\n";
    });

    // גרסת HTML (לתבנית מעוצבת)
    let html = '<div style="font-family:Arial,Helvetica,sans-serif;direction:rtl;text-align:right;color:#1f2433">';
    html += '<h2 style="color:#1B2A4A">5 החוזקות המובילות שלך</h2><ol style="padding-right:18px">';
    top5.forEach(function (s) {
      html += '<li style="margin-bottom:14px">' +
        '<b style="color:#1B2A4A;font-size:16px">' + s.name + '</b> ' +
        '<span style="color:#a9842f;font-size:13px">(' + s.virtue + ') · ' + s.score + '/10</span><br>' +
        '<span style="color:#4b5563">' + s.desc + '</span><br>' +
        '<span style="display:inline-block;margin-top:4px;background:#faf7f0;border-right:3px solid #C9A24B;padding:6px 10px;border-radius:6px">' +
        '<b>בעסק שלך:</b> ' + s.biz + '</span></li>';
    });
    html += '</ol><h3 style="color:#1B2A4A">3 חוזקות לפיתוח</h3><ul style="padding-right:18px;color:#4b5563">';
    bottom3.forEach(function (s) {
      html += '<li>' + s.name + ' (' + s.virtue + ') · ' + s.score + '/10</li>';
    });
    html += '</ul><p style="color:#6b7280;font-size:13px;margin-top:18px">שוברות תקרה · אסטרטגיות עסקיות מנצחות · לאה גרוס</p></div>';

    return { text: text, html: html };
  }

  function setEmailStatus(msg, type) {
    emailStatus.textContent = msg;
    emailStatus.className = "email-status" + (type ? " " + type : "");
  }

  // --- שליחת התוצאות במייל דרך EmailJS ---
  function sendResultsEmail(toEmail) {
    const configured = EMAILJS_CONFIG.publicKey !== "REPLACE_ME" &&
                       EMAILJS_CONFIG.serviceId !== "REPLACE_ME" &&
                       EMAILJS_CONFIG.templateId !== "REPLACE_ME";

    if (!configured || typeof emailjs === "undefined") {
      setEmailStatus("שליחת המייל עדיין לא חוברה. (יש להשלים את הגדרות EmailJS)", "warn");
      return;
    }

    const content = buildEmailContent(lastScored);
    const params = {
      to_email:     toEmail,
      results_text: content.text,
      results_html: content.html,
    };

    emailBtn.disabled = true;
    setEmailStatus("שולחת…", "");

    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, params)
      .then(function () {
        setEmailStatus("נשלח! בדקי את תיבת המייל שלך (גם בספאם, ליתר ביטחון). ✓", "ok");
        emailForm.reset();
      })
      .catch(function (err) {
        console.error("EmailJS error:", err);
        setEmailStatus("הייתה תקלה בשליחה. נסי שוב בעוד רגע.", "err");
      })
      .finally(function () {
        emailBtn.disabled = false;
      });
  }

  // --- סימון שאלות חסרות ---
  function markMissing() {
    let firstMissing = null;
    QUESTIONS.forEach(function (q) {
      const card = questionsList.querySelector('.q-card[data-q="' + q.n + '"]');
      if (answers[q.n] === undefined) {
        card.classList.add("missing");
        if (!firstMissing) firstMissing = card;
      }
    });
    return firstMissing;
  }

  // --- אירועים ---
  document.getElementById("btn-start").addEventListener("click", function () {
    showScreen("quiz");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (Object.keys(answers).length < QUESTIONS.length) {
      const firstMissing = markMissing();
      quizError.classList.remove("hidden");
      if (firstMissing) firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    quizError.classList.add("hidden");
    renderResults(computeScores());
    showScreen("results");
  });

  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus("רגע, נראה שכתובת המייל לא תקינה. בדקי שוב.", "err");
      emailInput.focus();
      return;
    }
    sendResultsEmail(email);
  });

  document.getElementById("btn-print").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("btn-restart").addEventListener("click", function () {
    for (const k in answers) delete answers[k];
    form.reset();
    questionsList.querySelectorAll(".q-card").forEach(function (c) {
      c.classList.remove("answered", "missing");
    });
    quizError.classList.add("hidden");
    updateProgress();
    showScreen("intro");
  });

  // --- רקע ניצוצות (tsParticles) במסך הפתיחה ---
  function initParticles() {
    if (typeof tsParticles === "undefined") return; // נטען מ-CDN; אם לא זמין, פשוט אין רקע
    tsParticles.load({
      id: "particles-bg",
      options: {
        fullScreen: { enable: false },
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        interactivity: {
          events: { onHover: { enable: true, mode: "repulse" }, resize: true },
          modes: { repulse: { distance: 80, duration: 0.4 } },
        },
        particles: {
          number: { value: 120, density: { enable: true, width: 600, height: 600 } },
          color: { value: ["#C9A24B", "#e3c87f", "#ffffff"] },
          shape: { type: "circle" },
          opacity: {
            value: { min: 0.3, max: 1 },
            animation: { enable: true, speed: 1.2, sync: false },
          },
          size: { value: { min: 1.5, max: 4 } },
          shadow: { enable: true, color: "#e3c87f", blur: 6 },
          move: {
            enable: true, speed: 0.7, direction: "none",
            random: true, straight: false, outModes: { default: "out" },
          },
        },
        detectRetina: true,
      },
    });
  }

  // --- אתחול ---
  if (typeof emailjs !== "undefined" && EMAILJS_CONFIG.publicKey !== "REPLACE_ME") {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  }
  wireSocialLinks();
  renderQuestions();
  updateProgress();
  initParticles();
})();
