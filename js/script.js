// Constants / Init
const DB_KEY = 'AOQRWE_DB';
let db = { users: [], subjects: [], questions: [], results: [], attempts: [] };
let currentUser = null;

// Quiz State
let quizSession = {
    subject_id: null,
    questions: [],
    currentQIndex: 0,
    answers: {},
    timeRemaining: 30,
    timerInterval: null
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initDB();
    checkSession();
});

function initDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
        db = JSON.parse(raw);
    } else {
        db.users.push({ id: 1, name: "Admin", email: "admin@aoqrwe.com", password: "admin", role: "admin" });
        saveDB();
    }
}
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function showAlert(msg, type='success') {
    const cont = document.getElementById('alert-container');
    cont.innerHTML = `<div class="alert alert-${type} alert-dismissible fade-in shadow-sm">
        ${msg} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    setTimeout(() => { cont.innerHTML = ''; }, 4000);
}

// --- Navigation & Auth ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    updateNav();
}

function updateNav() {
    const nav = document.getElementById('nav-links');
    if (!currentUser) {
        nav.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="showRoleSelection()">Login / Signup</a></li>
        `;
    } else if (currentUser.role === 'admin') {
        nav.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="goHome()">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadAdminSubjects()">Subjects</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadAdminQuestions()">Questions</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadAdminDatabase()">Manage Database</a></li>
            <li class="nav-item"><a class="nav-link text-danger fw-bold" href="#" onclick="logout()">Logout (${currentUser.name})</a></li>
        `;
    } else {
        nav.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="goHome()">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link text-danger fw-bold" href="#" onclick="logout()">Logout (${currentUser.name})</a></li>
        `;
    }
}

function showRoleSelection() {
    showView('view-role-selection');
}

function gotoLogin(role) {
    showView('view-login');
}

function checkSession() {
    const cUser = sessionStorage.getItem('AOQRWE_USER');
    if (cUser) {
        currentUser = JSON.parse(cUser);
        goHome();
    } else {
        showView('view-landing');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const em = document.getElementById('logEmail').value;
    const pw = document.getElementById('logPass').value;
    const user = db.users.find(u => u.email === em && u.password === pw);
    if (user) {
        currentUser = user;
        sessionStorage.setItem('AOQRWE_USER', JSON.stringify(user));
        document.getElementById('form-login').reset();
        goHome();
    } else {
        showAlert('Invalid email or password', 'danger');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const nm = document.getElementById('regName').value;
    const em = document.getElementById('regEmail').value;
    const pw = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;
    
    if(db.users.find(u => u.email === em)) {
        showAlert('Email already registered', 'danger'); return;
    }
    
    const id = db.users.length ? Math.max(...db.users.map(u=>u.id)) + 1 : 1;
    db.users.push({ id, name: nm, email: em, password: pw, role: role });
    saveDB();
    showAlert('Registered successfully. Proceed to login.', 'success');
    showView('view-login');
    document.getElementById('form-register').reset();
}

function handleModifyPassword(e) {
    e.preventDefault();
    const em = document.getElementById('fpEmail').value;
    const np = document.getElementById('fpNewPass').value;
    const user = db.users.find(u => u.email === em);
    if(user) {
        user.password = np;
        saveDB();
        showAlert('Password modified successfully.', 'success');
        goHome();
        document.getElementById('form-forgot-pass').reset();
    } else {
        showAlert('Email not found in our records', 'danger');
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('AOQRWE_USER');
    clearInterval(quizSession.timerInterval);
    showView('view-landing');
}

function goHome() {
    if(!currentUser) { showView('view-landing'); return; }
    if(currentUser.role === 'admin') loadAdminDashboard();
    else loadStudentDashboard();
}

// --- Admin Features ---
function loadAdminDashboard() {
    showView('view-admin-dashboard');
    const stCount = db.users.filter(u => u.role === 'student').length;
    const exCount = db.results.length;
    const subCount = db.subjects.length;
    const qCount = db.questions.length;
    
    document.getElementById('admin-stats-container').innerHTML = `
        <div class="col-md-3"><div class="card p-4 shadow-lg text-white glass-card" style="background:#0984e3;"><h6 class="opacity-75">Students</h6><h1 class="fw-bold">${stCount}</h1></div></div>
        <div class="col-md-3"><div class="card p-4 shadow-lg text-white glass-card" style="background:#00b894;"><h6 class="opacity-75">Exams Attempted</h6><h1 class="fw-bold">${exCount}</h1></div></div>
        <div class="col-md-3"><div class="card p-4 shadow-lg text-white glass-card" style="background:#e17055;"><h6 class="opacity-75">Subjects</h6><h1 class="fw-bold">${subCount}</h1></div></div>
        <div class="col-md-3"><div class="card p-4 shadow-lg text-dark glass-card" style="background:#fdcb6e;"><h6 class="opacity-75">Question Bank</h6><h1 class="fw-bold">${qCount}</h1></div></div>
    `;
    
    const raTbody = document.getElementById('admin-recent-attempts');
    const sortedRes = [...db.results].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    raTbody.innerHTML = sortedRes.map(r => {
        const u = db.users.find(x => x.id === r.user_id) || {name:'Unknown'};
        const s = db.subjects.find(x => x.id === r.subject_id) || {subject_name:'Unknown'};
        return `<tr><td class="fw-bold text-primary">${u.name}</td><td class="fw-bold">${s.subject_name}</td>
                <td><span class="badge bg-success rounded-pill px-3 py-2 shadow-sm">${r.score} / ${r.total}</span></td>
                <td class="small text-muted">${new Date(r.timestamp).toLocaleString()}</td></tr>`;
    }).join('') || "<tr><td colspan='4'>No attempts yet.</td></tr>";
}

function loadAdminSubjects() {
    showView('view-admin-subjects');
    renderAdminSubjects();
}

function handleAddSubject(e) {
    e.preventDefault();
    const name = document.getElementById('newSubName').value;
    const id = db.subjects.length ? Math.max(...db.subjects.map(s=>s.id)) + 1 : 1;
    db.subjects.push({ id, subject_name: name });
    saveDB(); e.target.reset(); renderAdminSubjects();
}

function renderAdminSubjects() {
    const list = document.getElementById('admin-subjects-list');
    list.innerHTML = db.subjects.map(s => `<tr><td class="text-secondary fw-bold">#${s.id}</td><td class="fw-bold">${s.subject_name}</td>
        <td class="text-end"><button onclick="deleteResource('subjects', ${s.id})" class="btn btn-sm btn-outline-danger">Del</button></td></tr>`).join('') || "<tr><td colspan='3'>No subjects found.</td></tr>";
}

function loadAdminQuestions() {
    showView('view-admin-questions');
    const sel = document.getElementById('qSubjectId');
    sel.innerHTML = `<option value="">Select Subject</option>` + db.subjects.map(s => `<option value="${s.id}">${s.subject_name}</option>`).join('');
    renderAdminQuestions();
}

function handleAddQuestion(e) {
    e.preventDefault();
    const subId = parseInt(document.getElementById('qSubjectId').value);
    const text = document.getElementById('qText').value;
    const optA = document.getElementById('qOptA').value;
    const optB = document.getElementById('qOptB').value;
    const optC = document.getElementById('qOptC').value;
    const optD = document.getElementById('qOptD').value;
    const corr = document.getElementById('qCorrect').value;
    const exp = document.getElementById('qExp').value;
    
    const id = db.questions.length ? Math.max(...db.questions.map(q=>q.id)) + 1 : 1;
    db.questions.push({ id, subject_id: subId, question_text: text, option_a: optA, option_b: optB, option_c: optC, option_d: optD, correct_answer: corr, explanation: exp });
    saveDB();
    e.target.reset(); document.getElementById('qSubjectId').value = subId; 
    showAlert('Question added', 'success');
    renderAdminQuestions();
}

function renderAdminQuestions() {
    const list = document.getElementById('admin-questions-list');
    const items = [...db.questions].reverse(); 
    list.innerHTML = items.map(q => {
        const s = db.subjects.find(x => x.id === q.subject_id) || {subject_name:'?'};
        return `<div class="card mb-3 border-0 shadow-sm" style="border-left: 5px solid #0984e3 !important;">
            <div class="card-body">
                <h6 class="fw-bold text-dark">[${s.subject_name}] ${q.question_text}</h6>
                <div class="small fw-bold text-success mt-2">✓ Correct: ${q.correct_answer} &nbsp; <button onclick="deleteResource('questions', ${q.id})" class="btn btn-sm text-danger float-end">Del</button></div>
            </div></div>`;
    }).join('') || "<div class='text-muted fst-italic'>No questions mapped.</div>";
}

function loadAdminDatabase() {
    showView('view-admin-database');
    renderAdminDatabase('users');
}

function renderAdminDatabase(table) {
    const thead = document.getElementById('db-thead');
    const tbody = document.getElementById('db-tbody');
    let h = '<tr>', b = '';
    
    if(table === 'users') {
        h += `<th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>`;
        b = db.users.map(u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td>
            <td><button onclick="deleteResource('users', ${u.id})" class="btn btn-sm btn-danger">🗑</button></td></tr>`).join('');
    } else if(table === 'subjects') {
        h += `<th>ID</th><th>Subject Name</th><th>Action</th></tr>`;
        b = db.subjects.map(u => `<tr><td>${u.id}</td><td>${u.subject_name}</td>
            <td><button onclick="deleteResource('subjects', ${u.id})" class="btn btn-sm btn-danger">🗑</button></td></tr>`).join('');
    } else if(table === 'questions') {
        h += `<th>ID</th><th>SubID</th><th>Text</th><th>Ans</th><th>Action</th></tr>`;
        b = db.questions.map(u => `<tr><td>${u.id}</td><td>${u.subject_id}</td><td>${u.question_text.substring(0,30)}...</td><td>${u.correct_answer}</td>
            <td><button onclick="deleteResource('questions', ${u.id})" class="btn btn-sm btn-danger">🗑</button></td></tr>`).join('');
    } else if(table === 'results') {
        h += `<th>ID</th><th>UserID</th><th>SubID</th><th>Score/Tot</th><th>Timestamp</th><th>Action</th></tr>`;
        b = db.results.map(u => `<tr><td>${u.id}</td><td>${u.user_id}</td><td>${u.subject_id}</td><td>${u.score}/${u.total}</td><td>${new Date(u.timestamp).toLocaleString()}</td>
            <td><button onclick="deleteResource('results', ${u.id})" class="btn btn-sm btn-danger">🗑</button></td></tr>`).join('');
    }
    
    thead.innerHTML = h;
    tbody.innerHTML = b || "<tr><td colspan='10'>No data found</td></tr>";
}

function deleteResource(table, id) {
    if(!confirm('Are you sure you want to delete this record?')) return;
    if(table === 'users') db.users = db.users.filter(x => x.id !== id);
    if(table === 'subjects') {
        db.subjects = db.subjects.filter(x => x.id !== id);
        db.questions = db.questions.filter(x => x.subject_id !== id);
    }
    if(table === 'questions') db.questions = db.questions.filter(x => x.id !== id);
    if(table === 'results') {
        db.results = db.results.filter(x => x.id !== id);
        db.attempts = db.attempts.filter(x => x.result_id !== id);
    }
    saveDB();
    if(document.getElementById('view-admin-subjects').classList.contains('active')) renderAdminSubjects();
    if(document.getElementById('view-admin-questions').classList.contains('active')) renderAdminQuestions();
    if(document.getElementById('view-admin-database').classList.contains('active')) renderAdminDatabase(table);
}

// --- Student Features ---
function loadStudentDashboard() {
    showView('view-student-dashboard');
    document.getElementById('student-name-display').innerText = currentUser.name;
    
    // Stats
    const myRes = db.results.filter(r => r.user_id === currentUser.id);
    const passCount = myRes.filter(r => (r.score/r.total) >= 0.40).length;
    const failCount = myRes.length - passCount;
    const subTaken = new Set(myRes.map(r => r.subject_id)).size;
    
    document.getElementById('student-stats-container').innerHTML = `
        <div class="col-md-4"><div class="card p-4 shadow-sm text-white" style="background:#0984e3;"><h6 class="opacity-75">Subjects Attempted</h6><h2 class="fw-bold">${subTaken}</h2></div></div>
        <div class="col-md-4"><div class="card p-4 shadow-sm text-white" style="background:#00b894;"><h6 class="opacity-75">Exams Passed (≥40%)</h6><h2 class="fw-bold">${passCount}</h2></div></div>
        <div class="col-md-4"><div class="card p-4 shadow-sm text-white" style="background:#e17055;"><h6 class="opacity-75">Exams Failed (<40%)</h6><h2 class="fw-bold">${failCount}</h2></div></div>
    `;
    
    // Subjects List & 2 per day logic
    const today = new Date().toDateString();
    
    const cont = document.getElementById('student-subjects-container');
    cont.innerHTML = db.subjects.map(s => {
        const qCount = db.questions.filter(q => q.subject_id === s.id).length;
        const attemptsToday = myRes.filter(r => r.subject_id === s.id && new Date(r.timestamp).toDateString() === today).length;
        
        let btnHtml = '';
        if(qCount === 0) {
            btnHtml = `<button class="btn btn-secondary w-100 rounded-pill py-2" disabled>No Questions</button>`;
        } else if(attemptsToday >= 2) {
            btnHtml = `<button class="btn btn-danger w-100 rounded-pill py-2" disabled>Limit Reached Today (2/2)</button>`;
        } else {
            btnHtml = `<button onclick="startQuiz(${s.id})" class="btn btn-primary w-100 rounded-pill py-2 shadow fw-bold">Start Exam</button>`;
        }
        
        return `<div class="col-md-4"><div class="card p-4 shadow-lg border-0 glass-card text-center" style="border-radius: 20px;">
            <h4 class="fw-bold mb-3">${s.subject_name}</h4>
            <div class="text-muted small mb-2">Questions: ${qCount} | Today's Attempts: ${attemptsToday}/2</div>
            ${btnHtml}
        </div></div>`;
    }).join('');
    
    // Recent Attempts
    const raList = document.getElementById('student-recent-attempts');
    raList.innerHTML = myRes.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(r => {
        const s = db.subjects.find(x => x.id === r.subject_id) || {subject_name:'?'};
        const pct = (r.total > 0) ? ((r.score/r.total)*100).toFixed(2) : 0;
        const passed = pct >= 40.0;
        return `<tr><td class="fw-bold text-dark">${s.subject_name}</td>
                <td><span class="badge ${passed?'bg-success':'bg-danger'} rounded-pill px-3 py-2 shadow-sm">${r.score} / ${r.total}</span></td>
                <td class="fw-bold text-primary">${pct}%</td>
                <td><span class="badge ${passed?'bg-success':'bg-danger'}">${passed?'Pass':'Fail'}</span></td>
                <td class="small text-muted">${new Date(r.timestamp).toLocaleString()}</td>
                <td class="text-center"><button onclick="loadReview(${r.id})" class="btn btn-sm btn-outline-dark rounded-pill px-3">Review</button></td></tr>`;
    }).join('') || "<tr><td colspan='6'>No exams taken yet.</td></tr>";
}

// --- Quiz Logic ---
function startQuiz(subId) {
    const qs = db.questions.filter(q => q.subject_id === subId);
    if(qs.length === 0) return;
    
    // Check limit
    const today = new Date().toDateString();
    const attemptsToday = db.results.filter(r => r.subject_id === subId && r.user_id === currentUser.id && new Date(r.timestamp).toDateString() === today).length;
    if(attemptsToday >= 2) {
        showAlert("You have reached the limit of 2 attempts per day for this subject.", "danger");
        return;
    }
    
    quizSession = { subject_id: subId, questions: qs, currentQIndex: 0, answers: {}, timeRemaining: 30, timerInterval: null };
    showView('view-quiz');
    initQuizBoard();
    displayFocusQuestion(0);
}

function initQuizBoard() {
    const p = document.getElementById('quiz-status-panel');
    p.innerHTML = quizSession.questions.map((q, idx) => {
        quizSession.answers[q.id] = null;
        return `<div class="status-bubble" id="bubble-${idx}" onclick="jumpToQ(${idx})">${idx + 1}</div>`;
    }).join('');
    updateStatsVis();
}

function updateStatsVis() {
    let ans = 0, unans = 0;
    quizSession.questions.forEach(q => {
        if(quizSession.answers[q.id] !== null) ans++; else unans++;
    });
    document.getElementById('qc-total').innerText = quizSession.questions.length;
    document.getElementById('qc-answered').innerText = ans;
    document.getElementById('qc-unanswered').innerText = unans;
}

function displayFocusQuestion(index) {
    if(index >= quizSession.questions.length) { confirmSubmit(); return; }
    
    quizSession.currentQIndex = index;
    const q = quizSession.questions[index];
    
    document.getElementById('quiz-question-text').innerText = `Q${index + 1}. ${q.question_text}`;
    
    clearInterval(quizSession.timerInterval);
    quizSession.timeRemaining = 30;
    updateTimerVis();
    
    const opts = [ { l: 'A', t: q.option_a }, { l: 'B', t: q.option_b }, { l: 'C', t: q.option_c }, { l: 'D', t: q.option_d } ];
    document.getElementById('quiz-options-container').innerHTML = opts.map(o => {
        const isActive = (quizSession.answers[q.id] === o.l) ? 'active' : '';
        return `
        <div class="form-check p-3 border rounded shadow-sm mb-2" onclick="selectRadio('${o.l}')" style="cursor:pointer; background: ${isActive ? '#e0f7fa' : '#fff'}">
            <input class="form-check-input ms-2" type="radio" name="qOption" id="opt${o.l}" value="${o.l}" ${isActive?'checked':''}>
            <label class="form-check-label ms-2 fw-bold" for="opt${o.l}" style="cursor:pointer">
                <span class="opacity-50 me-2">${o.l}.</span> ${o.t}
            </label>
        </div>`;
    }).join('');
    
    document.getElementById('quiz-progress-text').innerText = `Question ${index + 1} of ${quizSession.questions.length}`;
    document.getElementById('quiz-progress-bar').style.width = (((index+1) / quizSession.questions.length)*100)+'%';
    
    if (index === quizSession.questions.length - 1) {
        document.getElementById('btn-save-next').style.display = 'none';
    } else {
        document.getElementById('btn-save-next').style.display = 'inline-block';
    }
    
    updateBubblesVis();
    updateStatsVis();
    
    quizSession.timerInterval = setInterval(() => {
        quizSession.timeRemaining--;
        updateTimerVis();
        if(quizSession.timeRemaining <= 0) {
            clearInterval(quizSession.timerInterval);
            saveAndNext();
        }
    }, 1000);
}

function updateTimerVis() {
    const t = document.getElementById('quiz-timer');
    t.innerText = quizSession.timeRemaining;
    if(quizSession.timeRemaining <= 5) {
        t.style.background = '#d63031'; t.style.boxShadow = '0 0 25px rgba(214, 48, 49, 0.8)'; t.style.transform = 'scale(1.1)';
    } else {
        t.style.background = '#0984e3'; t.style.boxShadow = '0 0 20px rgba(9, 132, 227, 0.5)'; t.style.transform = 'scale(1)';
    }
}

function selectRadio(label) {
    document.getElementById('opt'+label).checked = true;
    const q = quizSession.questions[quizSession.currentQIndex];
    quizSession.answers[q.id] = label;
    // Re-render
    displayFocusQuestion(quizSession.currentQIndex);
}

function updateBubblesVis() {
    quizSession.questions.forEach((q, idx) => {
        const b = document.getElementById(`bubble-${idx}`);
        b.className = 'status-bubble';
        if(quizSession.answers[q.id] !== null) { b.classList.add('answered-yes'); b.innerHTML = '✓'; }
        else { b.innerHTML = idx + 1; }
        if(idx === quizSession.currentQIndex) b.classList.add('active-bubble');
    });
}

function saveAndNext() {
    // Current ans already saved by selectRadio. Just go next.
    if(quizSession.currentQIndex + 1 < quizSession.questions.length) {
        displayFocusQuestion(quizSession.currentQIndex + 1);
    } else {
        confirmSubmit();
    }
}

function jumpToQ(idx) { displayFocusQuestion(idx); }

function confirmSubmit() {
    clearInterval(quizSession.timerInterval);
    let unans = 0;
    quizSession.questions.forEach(q => { if(quizSession.answers[q.id] === null) unans++; });
    
    if(unans > 0) {
        document.getElementById('modal-unanswered-txt').innerText = `You have ${unans} unanswered question(s).`;
    } else {
        document.getElementById('modal-unanswered-txt').innerText = "";
    }
    
    var myModal = new bootstrap.Modal(document.getElementById('submitConfirmModal'));
    myModal.show();
}

function finishQuiz() {
    // Hide modal manually
    const modalEl = document.getElementById('submitConfirmModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if(modal) modal.hide();
    
    document.getElementById('quiz-question-area').innerHTML = `<h3 class="text-center mt-5 text-primary">Evaluating Results...</h3>`;
    
    let score = 0;
    let total = quizSession.questions.length;
    let attemptsToSave = [];
    
    quizSession.questions.forEach(q => {
        let sel = quizSession.answers[q.id];
        let correct = q.correct_answer;
        let is_ok = (sel === correct);
        if(is_ok) score++;
        attemptsToSave.push({ user_id: currentUser.id, question_id: q.id, selected_answer: sel, is_correct: is_ok });
    });
    
    const rId = db.results.length ? Math.max(...db.results.map(r=>r.id)) + 1 : 1;
    db.results.push({ id: rId, user_id: currentUser.id, subject_id: quizSession.subject_id, score, total, timestamp: new Date().toISOString() });
    
    attemptsToSave.forEach(a => {
        const aId = db.attempts.length ? Math.max(...db.attempts.map(at=>at.id)) + 1 : 1;
        db.attempts.push({ id: aId, result_id: rId, ...a });
    });
    
    saveDB();
    setTimeout(() => { loadReview(rId); }, 800);
}

// --- Review & Evaluation ---
function loadReview(resId) {
    showView('view-review');
    const res = db.results.find(r => r.id === resId);
    if(!res) return;
    
    const sub = db.subjects.find(s => s.id === res.subject_id) || {subject_name:'?'};
    const user = db.users.find(u => u.id === res.user_id) || {name:'?'};
    const pct = (res.total > 0) ? ((res.score/res.total)*100).toFixed(2) : 0;
    
    // updated logic 40%
    const passed = pct >= 40.0;
    const stat = passed ? 'Pass' : 'Fail - Try Again!';
    
    document.getElementById('review-summary').innerHTML = `
        <div class="col-md-6 border-end">
            <h5 class="fw-bold text-secondary mb-3">Student Details</h5>
            <p class="mb-1"><span class="fw-bold text-dark">Name:</span> ${user.name}</p>
            <p class="mb-1"><span class="fw-bold text-dark">Subject:</span> ${sub.subject_name}</p>
            <p class="mb-0"><span class="fw-bold text-dark">Exam Date:</span> ${new Date(res.timestamp).toLocaleString()}</p>
        </div>
        <div class="col-md-6 ps-4">
            <h5 class="fw-bold text-secondary mb-3">Performance Overview</h5>
            <p class="mb-1"><span class="fw-bold text-dark">Final Score:</span> <span class="badge bg-primary fs-6">${res.score} / ${res.total}</span></p>
            <p class="mb-1"><span class="fw-bold text-dark">Accuracy:</span> <span class="fw-bold text-info">${pct}% (Req: 40%)</span></p>
            <p class="mb-0"><span class="fw-bold text-dark">Status:</span> <span class="badge ${passed?'bg-success':'bg-danger'} fs-6">${stat}</span></p>
        </div>
    `;
    
    const myAtts = db.attempts.filter(a => a.result_id === resId);
    const brHtml = db.questions.filter(q => q.subject_id === res.subject_id).map((q, idx) => {
        const a = myAtts.find(x => x.question_id === q.id);
        if(!a) return '';
        const usrAns = a.selected_answer || 'Skipped';
        const isOk = a.is_correct;
        
        return `<div class="review-card ${isOk?'correct':'wrong'}">
            <h6 class="fw-bold mb-3" style="color: #2d3436;">Q${idx+1}. ${q.question_text}</h6>
            <div class="row g-3 fs-6 small mb-3">
                <div class="col-md-6"><span class="fw-bold opacity-50">A:</span> ${q.option_a}</div>
                <div class="col-md-6"><span class="fw-bold opacity-50">B:</span> ${q.option_b}</div>
                <div class="col-md-6"><span class="fw-bold opacity-50">C:</span> ${q.option_c}</div>
                <div class="col-md-6"><span class="fw-bold opacity-50">D:</span> ${q.option_d}</div>
            </div>
            <div class="d-flex bg-light p-3 rounded">
                <span class="badge ${isOk?'bg-success':'bg-danger'} p-2 shadow-sm">Your Answer: ${usrAns}</span>
                ${!isOk ? `<span class="badge bg-primary p-2 ms-2 shadow-sm">Correct Answer: ${q.correct_answer}</span>` : ''}
            </div>
            ${q.explanation ? `<div class="mt-3 bg-secondary bg-opacity-10 p-3 rounded border-start border-3 border-secondary text-dark small fw-bold">Reasoning: ${q.explanation}</div>` : ''}
        </div>`;
    }).join('');
    
    document.getElementById('review-breakdown').innerHTML = brHtml;
}

function downloadEvaluationPDF() {
    const element = document.getElementById('pdf-root');
    document.querySelectorAll('.hide-on-pdf').forEach(el => el.style.display = 'none');
    
    const opt = {
        margin:       0.3,
        filename:     `aoqrwe_report_${currentUser.name}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        document.querySelectorAll('.hide-on-pdf').forEach(el => el.style.display = 'block');
    });
}
