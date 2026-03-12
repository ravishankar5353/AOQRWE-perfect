<?php
require 'db.php';
require 'header.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') { header("Location: login.php"); exit(); }

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_question'])) {
    $subject_id = $_POST['subject_id'];
    $q = $_POST['question_text'];
    $a = $_POST['option_a'];    $b = $_POST['option_b'];    $c = $_POST['option_c'];    $d = $_POST['option_d'];
    $correct = $_POST['correct_answer'];
    $exp = $_POST['explanation'];

    $stmt = $conn->prepare("INSERT INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssssss", $subject_id, $q, $a, $b, $c, $d, $correct, $exp);
    if($stmt->execute()) {
        $msg = "<div class='alert alert-success'>Question added successfully.</div>";
    }
}
$subjects = $conn->query("SELECT * FROM subjects");
?>
<div class="row fade-in mt-4">
    <div class="col-md-6">
        <div class="card p-5 glass-card shadow-lg border-0" style="border-radius: 20px;">
            <h4 class="mb-4" style="color: #0984e3;">📝 Add Question to Bank</h4>
            <?php if(isset($msg)) echo $msg; ?>
            <form method="POST">
                <select name="subject_id" class="form-select mb-3 shadow-sm py-3" required>
                    <option value="">Select Subject</option>
                    <?php while($s = $subjects->fetch_assoc()): ?>
                        <option value="<?php echo $s['id']; ?>"><?php echo htmlspecialchars($s['subject_name']); ?></option>
                    <?php endwhile; ?>
                </select>
                <div class="form-floating mb-3">
                    <textarea name="question_text" class="form-control" style="height: 100px" id="q" required></textarea>
                    <label for="q">Question Text</label>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6"><input type="text" name="option_a" class="form-control py-3" placeholder="Option A" required></div>
                    <div class="col-6"><input type="text" name="option_b" class="form-control py-3" placeholder="Option B" required></div>
                    <div class="col-6"><input type="text" name="option_c" class="form-control py-3" placeholder="Option C" required></div>
                    <div class="col-6"><input type="text" name="option_d" class="form-control py-3" placeholder="Option D" required></div>
                </div>
                <select name="correct_answer" class="form-select mb-3 shadow-sm py-3 text-success fw-bold" required>
                    <option value="">Correct Option</option>
                    <option value="A">Option A</option><option value="B">Option B</option>
                    <option value="C">Option C</option><option value="D">Option D</option>
                </select>
                <div class="form-floating mb-4">
                    <textarea name="explanation" class="form-control" style="height: 80px" id="exp"></textarea>
                    <label for="exp">Explanation (Optional)</label>
                </div>
                <button type="submit" name="add_question" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow">Save Question</button>
            </form>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card p-4 glass-card shadow-lg border-0" style="height: 700px; overflow-y: auto; border-radius: 20px;">
            <h4 class="mb-4" style="color: #636e72;">📋 Question Bank Preview</h4>
            <?php 
            $res = $conn->query("SELECT q.*, s.subject_name FROM questions q JOIN subjects s ON q.subject_id = s.id ORDER BY id DESC LIMIT 20");
            while($row = $res->fetch_assoc()):
            ?>
            <div class="card mb-3 border-0 shadow-sm" style="background: rgba(255,255,255,0.7); border-left: 5px solid #0984e3 !important;">
                <div class="card-body">
                    <h6 class="card-title fw-bold text-dark">[<?php echo htmlspecialchars($row['subject_name']); ?>] <?php echo htmlspecialchars($row['question_text']); ?></h6>
                    <div class="small fw-bold text-success mt-2">✓ Correct: <?php echo $row['correct_answer']; ?></div>
                </div>
            </div>
            <?php endwhile; ?>
        </div>
    </div>
</div>
<?php require 'footer.php'; ?>
