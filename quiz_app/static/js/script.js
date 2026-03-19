// quiz logic
let questions = [];
let currentIndex = 0;
let userAnswers = {};
let subjectId = null;

let timerInterval;
const TIME_PER_QUESTION = 30; // Seconds

document.addEventListener("DOMContentLoaded", () => {
    const qDataEl = document.getElementById('questions_data');
    if(qDataEl && qDataEl.value) {
        questions = JSON.parse(qDataEl.value);
        subjectId = document.getElementById('subject_id').value;
        initQuiz();
    }
});

function initQuiz() {
    renderStatusBox();
    loadQuestion(0);
    startTimer();
}

function renderStatusBox() {
    const box = document.getElementById('statusBox');
    box.innerHTML = '';
    questions.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-secondary fw-bold rounded-circle shadow-sm';
        btn.style.width = '45px';
        btn.style.height = '45px';
        btn.innerText = idx + 1;
        btn.id = `status-btn-${idx}`;
        btn.onclick = () => {
             saveCurrentAnswer();
             loadQuestion(idx);
        };
        box.appendChild(btn);
    });
}

function updateStatusBox() {
    questions.forEach((q, idx) => {
        const btn = document.getElementById(`status-btn-${idx}`);
        if(userAnswers[q.id]) {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-success');
        } else {
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-success');
        }
        // highlight current
        if(idx === currentIndex) {
            btn.style.border = '3px solid #000';
            btn.style.transform = 'scale(1.1)';
        } else {
            btn.style.border = 'none';
            btn.style.transform = 'scale(1)';
        }
    });
}

function loadQuestion(index) {
    currentIndex = index;
    const q = questions[index];
    
    document.getElementById('questionCounter').innerText = `Question ${index + 1} of ${questions.length}`;
    document.getElementById('questionText').innerText = q.question;
    
    const optsBox = document.getElementById('optionsContainer');
    optsBox.innerHTML = '';
    
    const options = [q.option1, q.option2, q.option3, q.option4];
    options.forEach((opt, oIdx) => {
        const div = document.createElement('div');
        div.className = 'form-check glass-card p-4 rounded mb-3 shadow-sm d-flex align-items-center';
        div.style.cursor = 'pointer';
        div.style.border = '1px solid rgba(0,0,0,0.1)';
        
        const input = document.createElement('input');
        input.className = 'form-check-input fs-4 m-0';
        input.type = 'radio';
        input.name = 'option';
        input.id = `opt-${oIdx}`;
        input.value = opt;
        
        if(userAnswers[q.id] === opt) {
            input.checked = true;
            div.style.backgroundColor = '#dff9fb';
            div.style.border = '2px solid #00a8ff';
        }
        
        const label = document.createElement('label');
        label.className = 'form-check-label ms-3 w-100 fw-bold fs-5';
        label.htmlFor = `opt-${oIdx}`;
        label.innerText = opt;
        label.style.cursor = 'pointer';
        
        div.onclick = () => {
            input.checked = true;
            document.querySelectorAll('#optionsContainer .form-check').forEach(el => {
                el.style.backgroundColor='transparent';
                el.style.border='1px solid rgba(0,0,0,0.1)';
            });
            div.style.backgroundColor = '#dff9fb';
            div.style.border = '2px solid #00a8ff';
            userAnswers[q.id] = opt; // Save immediately when clicked
            updateStatusBox();
        };
        
        div.appendChild(input);
        div.appendChild(label);
        optsBox.appendChild(div);
    });
    
    document.getElementById('prevBtn').style.display = index === 0 ? 'none' : 'block';
    
    if (index === questions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtnContainer').style.display = 'block';
    } else {
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('submitBtnContainer').style.display = 'none';
    }
    
    updateStatusBox();
}

function saveCurrentAnswer() {
    const q = questions[currentIndex];
    const selected = document.querySelector('input[name="option"]:checked');
    if(selected) {
        userAnswers[q.id] = selected.value;
    }
    updateStatusBox();
}

function saveAndNext() {
    saveCurrentAnswer();
    if(currentIndex < questions.length - 1) {
        loadQuestion(currentIndex + 1);
    }
}

function prevQuestion() {
    saveCurrentAnswer();
    if(currentIndex > 0) {
        loadQuestion(currentIndex - 1);
    }
}

let timeLeft = 0;
function startTimer() {
    timeLeft = questions.length * TIME_PER_QUESTION;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Auto-submitting quiz.");
            submitExam(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timerDisplay').innerText = `${m}:${s}`;
}

function submitExam(force = false) {
    saveCurrentAnswer();
    if(!force) {
        const modal = new bootstrap.Modal(document.getElementById('submitModal'));
        modal.show();
    } else {
        executeSubmit();
    }
}

function confirmSubmit() {
    const chk = document.getElementById('confirmCheck');
    if(!chk.checked) {
        alert("Please check the confirmation box to proceed.");
        return;
    }
    executeSubmit();
}

function executeSubmit() {
    clearInterval(timerInterval);
    // disable buttons to prevent multi click
    document.querySelectorAll('button').forEach(b => b.disabled = true);
    
    fetch('/submit_quiz', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            subject_id: subjectId,
            answers: userAnswers
        })
    }).then(res => res.json()).then(data => {
        if(data.status === 'success') {
            window.location.replace(data.redirect);
        } else {
            alert('Error Submitting Quiz!');
            document.querySelectorAll('button').forEach(b => b.disabled = false);
        }
    });
}
