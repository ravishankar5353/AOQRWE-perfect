// Quiz logic specific for PHP App
let currentQIndex = 0;
let answeredMap = {}; // Maps question ID to chosen option [A, B, C, D]
let timeRemaining = 30; // 30 sec per question requirement
let timerInterval;
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", function() {
    if(typeof quizData !== 'undefined' && quizData.length > 0) {
        initQuizBoard();
        showQuestion(currentQIndex);
    }
});

function initQuizBoard() {
    const statusPanel = document.getElementById('status-panel');
    let html = '';
    quizData.forEach((q, index) => {
        html += `<div class="status-bubble" id="bubble-${index}" onclick="jumpTo(${index})">${index + 1}</div>`;
        answeredMap[q.id] = null;
    });
    statusPanel.innerHTML = html;
}

function showQuestion(index) {
    if(index >= quizData.length || isSubmitting) {
        submitQuizManually();
        return;
    }
    
    currentQIndex = index;
    const q = quizData[currentQIndex];
    document.getElementById('question-text').innerText = `Q${index + 1}. ${q.question_text}`;
    
    // reset timer
    clearInterval(timerInterval);
    timeRemaining = 30;
    updateTimerUI();
    
    const opts = [
        { label: 'A', text: q.option_a },
        { label: 'B', text: q.option_b },
        { label: 'C', text: q.option_c },
        { label: 'D', text: q.option_d }
    ];
    
    const html = opts.map(o => {
        const isActive = (answeredMap[q.id] === o.label) ? 'active' : '';
        return `<button class="option-btn ${isActive}" onclick="lockAnswer('${o.label}', this)">
                    <span class="opacity-50 me-2">${o.label}.</span> ${o.text}
                </button>`;
    }).join('');
    
    document.getElementById('options-container').innerHTML = html;
    document.getElementById('progress-text').innerText = `Question ${index + 1} of ${quizData.length}`;
    
    let pct = ((index) / quizData.length) * 100;
    document.getElementById('quiz-progress-bar').style.width = pct + '%';
    
    updateBubbles();
    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerUI();
        if(timeRemaining <= 0) {
            clearInterval(timerInterval);
            moveToNext();
        }
    }, 1000);
}

function updateTimerUI() {
    const t = document.getElementById('timer');
    t.innerText = timeRemaining;
    if(timeRemaining <= 5) {
        t.style.background = '#d63031';
        t.style.boxShadow = '0 0 25px rgba(214, 48, 49, 0.8)';
        t.style.transform = 'scale(1.1)';
    } else {
        t.style.background = '#0984e3';
        t.style.boxShadow = '0 0 20px rgba(9, 132, 227, 0.5)';
        t.style.transform = 'scale(1)';
    }
}

function lockAnswer(label, btnElement) {
    const q = quizData[currentQIndex];
    answeredMap[q.id] = label;
    
    // Highlight
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    updateBubbles();
    clearInterval(timerInterval);
    setTimeout(() => { moveToNext(); }, 400);
}

function moveToNext() {
    if(currentQIndex + 1 < quizData.length) {
        showQuestion(currentQIndex + 1);
    } else {
        submitQuizManually();
    }
}

function jumpTo(idx) {
    if(isSubmitting) return;
    showQuestion(idx);
}

function updateBubbles() {
    quizData.forEach((q, idx) => {
        const b = document.getElementById(`bubble-${idx}`);
        b.className = 'status-bubble';
        if(answeredMap[q.id] !== null) {
            b.classList.add('answered-yes');
            b.innerHTML = '✓';
        } else {
            b.innerHTML = idx + 1;
        }
        if(idx === currentQIndex) {
            b.classList.add('active-bubble');
        }
    });
}

function submitQuizManually() {
    if(isSubmitting) return;
    isSubmitting = true;
    clearInterval(timerInterval);
    
    // Package Answers
    const payload = {
        subject_id: subjectId,
        answers: {}
    };
    for (let k in answeredMap) {
        if(answeredMap[k] !== null) {
            payload.answers[k] = answeredMap[k];
        }
    }
    
    document.getElementById('question-area').innerHTML = `<h3 class="text-center mt-5 text-primary">Evaluating Results... Processing...</h3>`;
    
    fetch('submit_quiz.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(data => {
          if(data.success) {
              window.location.href = `review.php?result_id=${data.result_id}`;
          } else {
              alert('Error submitting quiz: ' + data.message);
          }
      }).catch(err => {
          console.error(err);
          alert('Network Error occurred when evaluating results');
      });
}
