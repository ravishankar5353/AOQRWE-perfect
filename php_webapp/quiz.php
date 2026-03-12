<?php
require 'db.php';
require 'header.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') { header("Location: login.php"); exit(); }

$subject_id = $_GET['subject_id'] ?? 0;
// Fetch questions
$res = $conn->query("SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE subject_id = $subject_id");
$questions = [];
while($row = $res->fetch_assoc()){ $questions[] = $row; }

if(count($questions) == 0):
?>
<div class="alert alert-warning text-center fw-bold shadow mt-5 p-4 rounded-pill">
    No questions available for this subject yet. <a href="student_dashboard.php">Go Back</a>
</div>
<?php require 'footer.php'; exit(); endif; ?>

<script>
    const quizData = <?php echo json_encode($questions); ?>;
    const subjectId = <?php echo $subject_id; ?>;
</script>

<div class="row fade-in mt-4">
    <!-- Left Panel: Status Board -->
    <div class="col-md-3">
        <div class="card p-4 glass-card shadow-lg border-0 mb-4 sticky-top text-center" style="top: 80px; border-radius: 20px;">
            <h5 class="fw-bold text-dark mb-4">Quiz Status Board</h5>
            
            <div class="timer-circle mx-auto mb-4" id="timer" style="width: 80px; height: 80px; font-size: 32px;">30</div>
            
            <p class="small text-muted mb-3"><span style="color: #00b894;">✓ Answered</span> · <span class="text-secondary">✗ Unanswered</span></p>
            
            <div id="status-panel" class="d-flex flex-wrap gap-2 justify-content-center">
                <!-- Status blocks populated dynamically -->
            </div>
            
            <hr class="my-4">
            
            <button onclick="submitQuizManually()" id="submitBtn" class="btn btn-primary w-100 rounded-pill py-2 shadow fw-bold">Finish Exam</button>
        </div>
    </div>
    
    <!-- Right Panel: Questions Display -->
    <div class="col-md-9">
        <div class="card p-5 glass-card shadow-lg border-0" style="min-height: 500px; border-radius: 20px;" id="question-area">
            <h5 id="progress-text" class="fw-bold text-secondary mb-4">Loading Question...</h5>
            
            <div class="progress mb-5" style="height: 6px; border-radius: 3px;">
                <div class="progress-bar bg-success" id="quiz-progress-bar" role="progressbar" style="width: 0%;"></div>
            </div>
            
            <h3 id="question-text" class="mb-5 fw-bold text-dark" style="line-height: 1.6;"></h3>
            
            <div id="options-container" class="d-flex flex-column gap-3 mt-auto">
                <!-- Options injected via JS -->
            </div>
        </div>
    </div>
</div>
<?php require 'footer.php'; ?>
