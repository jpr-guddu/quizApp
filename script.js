/* ------------- placeholder img + firebase + quiz logic (corrected select option) ------------- */

// --- Placeholder image generation (kept mostly same) ---
let logoDataUrl = null;
let signatureDataUrl = null;

function generatePlaceholderImages() {
  // Logo canvas
  const c1 = document.createElement('canvas');
  c1.width = 240; c1.height = 240;
  const g = c1.getContext('2d');

  const lg = g.createLinearGradient(0, 0, 240, 240);
  lg.addColorStop(0, '#fff7e6');
  lg.addColorStop(1, '#fff3d6');
  g.fillStyle = lg;
  g.fillRect(0, 0, 240, 240);

  g.strokeStyle = '#d4af37';
  g.lineWidth = 12;
  roundRect(g, 6, 6, 228, 228, 22);
  g.stroke();

  g.fillStyle = '#b8860b';
  g.font = 'bold 110px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('QA', 120, 120);

  logoDataUrl = c1.toDataURL('image/png');
  const logoImg = document.getElementById('logoImg');
  if (logoImg) logoImg.src = logoDataUrl;

  // Signature
  const c2 = document.createElement('canvas');
  c2.width = 800; c2.height = 200;
  const s = c2.getContext('2d');
  s.fillStyle = 'white';
  s.fillRect(0, 0, c2.width, c2.height);

  s.strokeStyle = '#222';
  s.lineWidth = 3;
  s.lineJoin = 'round';
  s.lineCap = 'round';
  s.beginPath();
  s.moveTo(20, 130);
  s.bezierCurveTo(80, 40, 140, 200, 220, 120);
  s.bezierCurveTo(300, 50, 360, 190, 460, 120);
  s.bezierCurveTo(540, 60, 660, 160, 760, 110);
  s.stroke();

  s.font = '18px Arial';
  s.fillStyle = '#222';
  s.fillText('Principal / Instructor', 20, 175);

  signatureDataUrl = c2.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- FIREBASE (compat) ---
// NOTE: Include compat script tags in HTML as shown above.
// Then use the config below (your config already present).
const firebaseConfig = {
  apiKey: "AIzaSyBUPXbKjKybtj5w9wYUKLj8F1WbDnwI_PE",
  authDomain: "myfirstproject-a9bd5.firebaseapp.com",
  databaseURL: "https://myfirstproject-a9bd5-default-rtdb.firebaseio.com",
  projectId: "myfirstproject-a9bd5",
  storageBucket: "myfirstproject-a9bd5.firebasestorage.app",
  messagingSenderId: "565178101938",
  appId: "1:565178101938:web:36cde7a47e08b2e79a59ab"
};

// initialize (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DOM elements ---
const classList = document.getElementById('classList');
const subjectList = document.getElementById('subjectList');
const chapterList = document.getElementById('chapterList');
const quizArea = document.getElementById('quizArea');
const timerDiv = document.getElementById('timer');
const scoreDiv = document.getElementById('score');

const startBtn = document.getElementById('startBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const themeCertBtn = document.getElementById('themeCertBtn');

const studentNameInput = document.getElementById('studentName');

let questions = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let timeLeftPerQuestion = 50;
let timeLeft = timeLeftPerQuestion;

let userAnswers = [];
let selectedAnswer = null;

let selectedClassId = null;
let selectedSubjectId = null;
let selectedChapterId = null;

let quizStarted = false;
let quizLocked = false;

  // --- Load classes from Firestore ---
   async function loadClasses() {
   classList.innerHTML = '<strong>Classes:</strong>';
   try {
     const snap = await db.collection('classes').get();
      snap.forEach(doc => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.textContent = doc.data().name || doc.id;
      div.dataset.id = doc.id;

      div.onclick = () => {
        if (quizLocked) return;

        // highlight
        document.querySelectorAll('.list-item').forEach(item => {
          item.style.backgroundColor = (item === div ? 'rgba(212,175,55,0.12)' : '#fff');
          item.style.borderColor = (item === div ? 'rgba(212,175,55,0.25)' : '#eee');
        });

        selectedClassId = doc.id;

        // ⭐⭐⭐ HERE — class change hote hi quiz area hide
        const contentDiv = document.querySelector('.content');
        if (contentDiv) contentDiv.style.display = 'none';

        stopQuiz();
        loadSubjects(doc.id);
        };

       classList.appendChild(div);
      });
    } catch (err) {
      console.error('Error loading classes:', err);
      classList.innerHTML += '<p class="muted">Failed to load classes.</p>';
    }
  }

  /*=============================================================
      show subject name and hide chapter name when click on class
    =============================================================
  */

  document.getElementById('classList').addEventListener('click', ()=>{
    document.getElementById('up').style.display = "block";
    document.getElementById('br').style.display = "none";
  })


  /* =======================
   Load subjects
   ======================= 
  */
  async function loadSubjects(classId) {
    subjectList.innerHTML = '<strong>Subjects:</strong>';
    chapterList.innerHTML = '<strong>Chapters:</strong>';
    quizArea.innerHTML = '';
    timerDiv.innerHTML = '';
    scoreDiv.innerHTML = '';
    startBtn.style.display = 'none';

    const snap = await db.collection('classes').doc(classId).collection('subjects').get();
    snap.forEach(doc => {
        const div = document.createElement('div');
        div.className = 'list-item1';
        div.textContent = doc.data().name || doc.id;
        div.dataset.id = doc.id;

        div.onclick = () => {
            if (quizLocked) return;

         // highlight
         document.querySelectorAll('.list-item1').forEach(item => {
            item.style.backgroundColor = (item === div ? 'rgba(212,175,55,0.12)' : '#fff');
            item.style.borderColor = (item === div ? 'rgba(212,175,55,0.25)' : '#eee');
            item.style.display = (item === div ? 'block' : 'none');
         });

          // ⭐⭐⭐ HERE — content hide kare
          const contentDiv = document.querySelector('.content');
          if (contentDiv) contentDiv.style.display = 'none';

          selectedSubjectId = doc.id;
          stopQuiz();
          loadChapters(classId, doc.id);
        };

        subjectList.appendChild(div);
      });
  }

  /*===============================================
     show chapter name when click on  subject name
    ===============================================
  */ 

  document.getElementById('subjectList').addEventListener('click', ()=>{
    document.getElementById('br').style.display = "block";
  })

  /* =======================
   Load chapters
   ========================= 
  */
  async function loadChapters(classId, subjectId) {
    chapterList.innerHTML = '<strong>Chapters:</strong>';
    quizArea.innerHTML = '';
    timerDiv.innerHTML = '';
    scoreDiv.innerHTML = '';
    startBtn.style.display = 'none';

    const snap = await db.collection('classes').doc(classId).collection('subjects').doc(subjectId).collection('chapters').get();
    snap.forEach(doc => {
      const div = document.createElement('div');
      div.className = 'list-item2';
      div.textContent = doc.data().name || doc.id;
      div.dataset.id = doc.id;
      div.onclick = () => {
        if (quizLocked) return;

          // chapter highlight
          document.querySelectorAll('.list-item2').forEach(item => {
          item.style.backgroundColor = (item === div ? 'rgba(212,175,55,0.12)' : '#fff');
          item.style.borderColor = (item === div ? 'rgba(212,175,55,0.25)' : '#eee');
          item.style.display = (item === div ? 'block' : 'none');
        });

        selectedChapterId = doc.id;

        // quiz reset
        stopQuiz();

        // load questions preview
        loadQuestionsForPreview(classId, subjectId, doc.id);

        // ✅ सबसे important: content show करना
        const contentDiv = document.querySelector('.content');
        if (contentDiv) contentDiv.style.display = 'block';

        // start / preview buttons
        startBtn.style.display = 'inline-block';
        themeCertBtn.style.display = 'inline-block';
      };
      chapterList.appendChild(div);
    });
  }



  /* ========================
   show quiz content
   ======================== */
  let quizVisible = false;   // Track show/hide state
  document.querySelectorAll(".chapter-item").forEach(chapter => {
    chapter.addEventListener("click", () => {
      // If already visible → hide it
      if (quizVisible) {
        quizArea.style.display = "none";
        quizVisible = false;
        return;
      }

      // Otherwise show it and load quiz
      quizArea.style.display = "block";
      quizVisible = true;

      loadQuiz(chapter.dataset.chapterId);
    });
  });

  
  /* =======================
   hide quiz content
   ======================= 
  */
  document.querySelectorAll(".class-item, .subject-item").forEach(item => {
    item.addEventListener("click", () => {
        quizArea.style.display = "none";
        quizVisible = false;
    });
   });


/* =======================
   Load questions for preview (no timer)
   ======================= */
  async function loadQuestionsForPreview(classId, subjectId, chapterId) {
   quizArea.innerHTML = '';
   timerDiv.innerHTML = `Time per Q: ${timeLeftPerQuestion}s`;
   scoreDiv.innerHTML = '';

   const snap = await db.collection('classes').doc(classId)
    .collection('subjects').doc(subjectId)
    .collection('chapters').doc(chapterId)
    .collection('questions').get();

   questions = [];
   snap.forEach(doc => {
    const d = doc.data();
    questions.push(d);
   });

   if (questions.length === 0) {
    quizArea.innerHTML = '<p>No questions found for this chapter.</p>';
    startBtn.style.display = 'none';
    themeCertBtn.style.display = 'none';
    return;
   }

   // show first question as preview (no interactivity)
   const q = questions[0];
   quizArea.innerHTML = `
    <div class="question">
      <strong>Q1:</strong> ${q.question || q.q || ""}<br>
      <div class="option">A. ${q.optionA || q.options && q.options[0] || ""}</div>
      <div class="option">B. ${q.optionB || q.options && q.options[1] || ""}</div>
      <div class="option">C. ${q.optionC || q.options && q.options[2] || ""}</div>
      <div class="option">D. ${q.optionD || q.options && q.options[3] || ""}</div>
      <p class="muted">Preview mode — click "Start Quiz" to begin the timed quiz.</p>
    </div>`;
   currentIndex = 0;
   userAnswers = [];
   selectedAnswer = null;
   quizStarted = false;
  }

  /*=======================
   Start Quiz
   ======================= 
  */
  function startQuiz() {
  startBtn.style.display = "none";
  prevBtn.style.display = "inline-block";
  submitBtn.style.display = "inline-block";
  nextBtn.style.display = "inline-block";

  if (!selectedClassId || !selectedSubjectId || !selectedChapterId) {
    alert('Please select class → subject → chapter first.');
    return;
  }
  if (!questions || questions.length === 0) {
    alert('No questions available to start.');
    return;
  }

  quizLocked = true;
  quizStarted = true;
  currentIndex = 0;
  score = 0;
  userAnswers = [];
  selectedAnswer = null;
  scoreDiv.innerHTML = '';

  // normalize answer field
  questions = questions.map(q => {
    const copy = Object.assign({}, q);
    if (copy.answer === undefined && copy.ans !== undefined) copy.answer = copy.ans;
    return copy;
  });

  submitBtn.disabled = true;
  nextBtn.disabled = true;
  renderQuestion();
}
if (startBtn) startBtn.addEventListener('click', startQuiz);

/* =======================
   Render Question + Timer
   ======================= */
function renderQuestion() {
  clearInterval(timer);
  timeLeft = timeLeftPerQuestion;
  quizArea.innerHTML = '';

  const q = questions[currentIndex];
  const optA = q.optionA || (q.options && q.options[0]) || "";
  const optB = q.optionB || (q.options && q.options[1]) || "";
  const optC = q.optionC || (q.options && q.options[2]) || "";
  const optD = q.optionD || (q.options && q.options[3]) || "";

  const div = document.createElement('div');
  div.className = 'question';

  // question text
  const qHtml = document.createElement('div');
  qHtml.innerHTML = `<strong>Q${currentIndex + 1}:</strong> ${q.question || q.q || ""}<br>`;
  div.appendChild(qHtml);

  // options as elements with data-option and click listeners
  const opts = [
    { key: 'A', text: optA },
    { key: 'B', text: optB },
    { key: 'C', text: optC },
    { key: 'D', text: optD }
  ];

  opts.forEach(o => {
    const od = document.createElement('div');
    od.className = 'option';
    od.dataset.option = o.key;
    od.tabIndex = 0;
    od.style.cursor = 'pointer';
    od.innerText = `${o.key}. ${o.text}`;
    // click handler uses our selectOption helper
    od.addEventListener('click', () => selectOption(o.key, od));
    // also allow Enter key for accessibility
    od.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        selectOption(o.key, od);
      }
    });
    div.appendChild(od);
  });

  quizArea.appendChild(div);

  // update selectedAnswer from stored userAnswers if exists
  selectedAnswer = userAnswers[currentIndex] || null;
  // visually highlight if already answered
  if (selectedAnswer) {
    highlightOption(selectedAnswer);
    submitBtn.disabled = true;
    nextBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
    nextBtn.disabled = true;
  }

  // Prev Button Enable/Disable
    if (currentIndex === 0) {
    prevBtn.disabled = true;
    prevBtn.style.background = "gray";
    } else {
    prevBtn.disabled = false;
    prevBtn.style.background = "blue";
    }


  timerDiv.innerHTML = `Time Left: ${timeLeft}s`;
  startTimer();
 }

// highlight by data-option
function highlightOption(option) {
  document.querySelectorAll('.option').forEach(o => { o.style.backgroundColor = ''; o.classList.remove('selected'); });
  const found = Array.from(document.querySelectorAll('.option')).find(o => o.dataset.option === option);
  if (found) { found.style.backgroundColor = 'rgba(212,175,55,0.08)'; found.classList.add('selected'); }
}

// selectOption now takes (optionKey, element)
function selectOption(optionKey, element) {
  if (!quizStarted) return;
  selectedAnswer = optionKey;

  // remove previous highlight
  document.querySelectorAll('.option').forEach(o => { o.style.backgroundColor = ''; o.classList.remove('selected'); });

  // highlight clicked
  if (element) {
    element.style.backgroundColor = 'rgba(212,175,55,0.08)';
    element.classList.add('selected');
  } else {
    // fallback: find by data-option
    const found = Array.from(document.querySelectorAll('.option')).find(o => o.dataset.option === optionKey);
    if (found) { found.style.backgroundColor = 'rgba(212,175,55,0.08)'; found.classList.add('selected'); }
  }

  // enable submit
  if (submitBtn) {
    submitBtn.disabled = false;
    // style feedback
    submitBtn.style.background = "blue";
  }
}

/* =======================
   Submit/Navigation
   ======================= */
function submitAnswer() {
  if (!selectedAnswer) {
    alert('Please select an option before submitting.');
    return;
  }

  userAnswers[currentIndex] = selectedAnswer;

  const q = questions[currentIndex];
  let correct = q.answer;
  if (typeof correct === 'number') correct = ['A', 'B', 'C', 'D'][correct];
  if (typeof correct === 'string') correct = correct.trim().toUpperCase();

  if (selectedAnswer === correct) {
    if (!q._counted) {
      score++;
      q._counted = true;
    }
  }

  // LOCK SUBMIT – UNLOCK NEXT
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.background = "gray";
  }
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.style.background = "blue";
  }
}
if (submitBtn) submitBtn.addEventListener('click', submitAnswer);

function nextQuestion() {
  clearInterval(timer);
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    selectedAnswer = userAnswers[currentIndex] || null;
    renderQuestion();
  } else {
    endQuiz();
  }
  if (nextBtn) nextBtn.style.background = "gray";
  if (prevBtn) prevBtn.style.background = "blue";
}
if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

function prevQuestion() {
  if (!quizStarted) return;
  clearInterval(timer);
  if (currentIndex > 0) {
    currentIndex--;
    selectedAnswer = userAnswers[currentIndex] || null;
    renderQuestion();
  } else {
    if (prevBtn) prevBtn.style.background = "gray";
  }
}
if (prevBtn) prevBtn.addEventListener('click', prevQuestion);

/* =======================
   Timer
   ======================= */
function startTimer() {
  clearInterval(timer);
  timerDiv.innerHTML = `Time Left: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerDiv.innerHTML = `Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      // auto move next
      if (currentIndex < questions.length - 1) { currentIndex++; renderQuestion(); } else { endQuiz(); }
    }
  }, 1000);
}

/* =======================
   End Quiz + download certificate
   (kept mostly same as your code)
   ======================= */
function endQuiz() {
  clearInterval(timer);
  quizStarted = false;
  quizLocked = false;
  timerDiv.innerHTML = '';

  const total = questions.length || 1;
  const percent = Math.round((score / total) * 100);
  let msg = "";
  if (percent < 20) msg = "Very Bad 😢";
  else if (percent < 30) msg = "Bad 😟";
  else if (percent < 40) msg = "Not Good 😐";
  else if (percent < 60) msg = "Good 🙂";
  else if (percent < 80) msg = "Very Good 😄";
  else msg = "Excellent 🌟";

  function downloadCertificatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Outer gold border
    pdf.setDrawColor(181, 136, 0);
    pdf.setLineWidth(8);
    const margin = 36;
    pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

    // Inner border
    pdf.setLineWidth(2);
    const inM = 70;
    pdf.rect(inM, inM, pageW - inM * 2, pageH - inM * 2);

    // Add logo (top-left)
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', inM + 10, inM + 10, 90, 90);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(40, 40, 40);
    pdf.text("Certificate of Achievement", pageW / 2, inM + 60, { align: 'center' });

    pdf.setDrawColor(181, 136, 0);
    pdf.setLineWidth(4);
    pdf.line(pageW / 2 - 140, inM + 70, pageW / 2 + 140, inM + 70);

    const studentName = (studentNameInput && studentNameInput.value && studentNameInput.value.trim()) || "Student Name";
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(studentName, pageW / 2, inM + 120, { align: 'center' });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`has successfully completed the quiz.`, pageW / 2, inM + 145, { align: 'center' });

    pdf.setFontSize(13);
    pdf.text(`Class: ${selectedClassId || '-'}`, inM + 20, inM + 190);
    pdf.text(`Subject: ${selectedSubjectId || '-'}`, inM + 20, inM + 210);
    pdf.text(`Chapter: ${selectedChapterId || '-'}`, inM + 20, inM + 230);

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Score: ${score} / ${total}`, inM + 20, inM + 270);
    pdf.text(`Percentage: ${percent}%`, inM + 20, inM + 295);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Performance: ${msg}`, inM + 20, inM + 320);

    pdf.setFontSize(12);
    const note = "Congratulations on successfully completing the quiz. Keep up the great work!";
    pdf.text(note, pageW - inM - 20, inM + 190, { maxWidth: 220, align: 'right' });

    const sigW = 220;
    const sigH = 60;
    const sigX = pageW - inM - sigW - 10;
    const sigY = pageH - inM - 130;

    if (signatureDataUrl) {
      pdf.addImage(signatureDataUrl, 'PNG', sigX, sigY - 10, sigW, sigH);
    }

    pdf.setLineWidth(0.8);
    pdf.setDrawColor(80, 80, 80);
    pdf.line(sigX + 10, sigY + sigH + 5, sigX + sigW - 10, sigY + sigH + 5);
    pdf.setFontSize(12);
    pdf.text("Principal / Instructor", sigX + 20, sigY + sigH + 22);

    const dateText = `Date: ${new Date().toLocaleDateString()}`;
    pdf.text(dateText, inM + 20, pageH - inM - 40);

    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Generated by Quiz App", pageW / 2, pageH - 30, { align: 'center' });

    pdf.save("quiz_certificate_gold.pdf");
  }

  quizArea.innerHTML = `
    <div class="question">
      <h3>Quiz Finished</h3>
      <p>Your score: <strong>${score} / ${total}</strong></p>
      <p>Percentage: <strong>${percent}%</strong></p>
      <h3>Result: ${msg}</h3>

      <div style="margin-top:12px;">
        <button id="downloadCertBtn">Download Certificate (Premium)</button>
      </div>

      <p class="muted" style="margin-top:10px;">You can change class/subject/chapter now.</p>
    </div>
  `;
  const dl = document.getElementById('downloadCertBtn');
  if (dl) dl.onclick = downloadCertificatePDF;

  scoreDiv.innerHTML = `Last score: ${score} / ${total}`;
  startBtn.style.display = 'none';

  questions.forEach(q => delete q._counted);
}

/* =======================
   Stop / Reset when switching
   ======================= */
function stopQuiz() {
  clearInterval(timer);
  quizStarted = false;
  quizLocked = false;
  timerDiv.innerHTML = '';
  scoreDiv.innerHTML = '';
  quizArea.innerHTML = '';
  startBtn.style.display = 'none';
  userAnswers = [];
  selectedAnswer = null;
  currentIndex = 0;
  score = 0;
}

// Initial
generatePlaceholderImages();
loadClasses();
