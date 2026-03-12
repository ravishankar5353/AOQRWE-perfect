<?php
require 'db.php';
require 'header.php';

if (!isset($_SESSION['role'])) { header("Location: login.php"); exit(); }

$result_id = $_GET['result_id'] ?? 0;
$user_id = $_SESSION['user_id'];
$is_admin = ($_SESSION['role'] === 'admin');

// Ensure permission
if(!$is_admin) {
    $c = $conn->query("SELECT user_id FROM results WHERE id = $result_id")->fetch_assoc();
    if(!$c || $c['user_id'] != $user_id) {
        echo "<div class='alert alert-danger'>Unauthorized Access</div>"; exit;
    }
}

// Fetch Result Summary
$res = $conn->query("SELECT r.*, s.subject_name, u.name as student_name FROM results r JOIN subjects s ON r.subject_id=s.id JOIN users u ON r.user_id=u.id WHERE r.id = $result_id");
$resultData = $res->fetch_assoc();
if(!$resultData) { echo "<div class='alert alert-danger'>Result not found</div>"; exit; }

$pct = ($resultData['total'] > 0) ? round(($resultData['score'] / $resultData['total']) * 100, 2) : 0;
$status = ($pct >= 50) ? 'Pass' : 'Fail';

// Fetch Review (Attempts + Explanations)
$att = $conn->query("SELECT a.*, q.question_text, q.correct_answer, q.explanation, q.option_a, q.option_b, q.option_c, q.option_d 
                     FROM attempts a JOIN questions q ON a.question_id = q.id 
                     WHERE a.result_id = $result_id");
?>
<div class="row justify-content-center fade-in mt-4">
    <div class="col-md-9 p-0" id="pdf-root">
        <!-- PDF Wrapped Container -->
        <div class="card p-5 glass-card shadow-lg border-0 mb-5" style="border-radius: 20px;">
            <div class="text-center mb-5 border-bottom pb-4">
                <h1 class="display-5 fw-bold" style="color: #0984e3;">AOQRWE Evaluation Report</h1>
                <p class="text-muted fw-bold">Official Exam transcript</p>
            </div>
            
            <div class="row g-4 mb-5">
                <div class="col-md-6 border-end">
                    <h5 class="fw-bold text-secondary mb-3">Student Details</h5>
                    <p class="mb-1"><span class="fw-bold text-dark">Name:</span> <?php echo $resultData['student_name']; ?></p>
                    <p class="mb-1"><span class="fw-bold text-dark">Subject:</span> <?php echo $resultData['subject_name']; ?></p>
                    <p class="mb-0"><span class="fw-bold text-dark">Exam Date:</span> <?php echo date("d M Y, h:i A", strtotime($resultData['timestamp'])); ?></p>
                </div>
                <div class="col-md-6 ps-4">
                    <h5 class="fw-bold text-secondary mb-3">Performance Overview</h5>
                    <p class="mb-1"><span class="fw-bold text-dark">Final Score:</span> <span class="badge bg-primary fs-6"><?php echo $resultData['score']; ?> / <?php echo $resultData['total']; ?></span></p>
                    <p class="mb-1"><span class="fw-bold text-dark">Accuracy:</span> <span class="fw-bold text-info"><?php echo $pct; ?>%</span></p>
                    <p class="mb-0"><span class="fw-bold text-dark">Status:</span> 
                        <span class="badge <?php echo ($status=='Pass')?'bg-success':'bg-danger'; ?> fs-6 shadow-sm"><?php echo $status; ?></span>
                    </p>
                </div>
            </div>
            
            <h4 class="fw-bold mb-4 border-bottom pb-2" style="color: #636e72;">Question Specific Breakdown</h4>
            <?php 
            $i = 1;
            while($row = $att->fetch_assoc()): 
                $usr_ans = $row['selected_answer'] ? strtoupper($row['selected_answer']) : 'Skipped';
                $cor_ans = strtoupper($row['correct_answer']);
                $is_ok = $row['is_correct'];
            ?>
            <div class="card mb-4 border-0 shadow-sm" style="background: rgba(255,255,255,0.7); border-left: 5px solid <?php echo $is_ok ? '#00b894' : '#d63031'; ?> !important;">
                <div class="card-body p-4">
                    <h6 class="fw-bold mb-3" style="color: #2d3436;">Q<?php echo $i++; ?>. <?php echo htmlspecialchars($row['question_text']); ?></h6>
                    
                    <div class="row g-3 fs-6 small mb-4">
                        <div class="col-md-6"><span class="fw-bold opacity-50">A:</span> <?php echo htmlspecialchars($row['option_a']); ?></div>
                        <div class="col-md-6"><span class="fw-bold opacity-50">B:</span> <?php echo htmlspecialchars($row['option_b']); ?></div>
                        <div class="col-md-6"><span class="fw-bold opacity-50">C:</span> <?php echo htmlspecialchars($row['option_c']); ?></div>
                        <div class="col-md-6"><span class="fw-bold opacity-50">D:</span> <?php echo htmlspecialchars($row['option_d']); ?></div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                        <div>
                            <span class="badge <?php echo $is_ok ? 'bg-success' : 'bg-danger'; ?> p-2 shadow-sm">Your Answer: <?php echo $usr_ans; ?></span>
                            <?php if(!$is_ok): ?>
                                <span class="badge bg-primary p-2 ms-2 shadow-sm">Correct Answer: <?php echo $cor_ans; ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <?php if(!empty($row['explanation'])): ?>
                    <div class="mt-3 bg-secondary bg-opacity-10 p-3 rounded border-start border-3 border-secondary text-dark small fw-bold">
                        Reasoning: <?php echo htmlspecialchars($row['explanation']); ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endwhile; ?>
            
            <div class="text-center mt-5 pt-3 border-top hide-on-pdf">
                <button onclick="downloadEvaluationPDF()" class="btn btn-danger btn-lg px-5 py-3 rounded-pill fw-bold shadow">
                    Export Report as PDF
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    function downloadEvaluationPDF() {
        const element = document.getElementById('pdf-root');
        
        // Hide elements we don't want in print
        document.querySelectorAll('.hide-on-pdf').forEach(el => el.style.display = 'none');
        
        const opt = {
            margin:       0.5,
            filename:     'aoqrwe_report_<?php echo $resultData['student_name']; ?>.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore visibility
            document.querySelectorAll('.hide-on-pdf').forEach(el => el.style.display = 'block');
        });
    }
</script>
<?php require 'footer.php'; ?>
