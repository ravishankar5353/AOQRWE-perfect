<?php
require 'db.php';
require 'header.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header("Location: login.php");
    exit();
}

$students = $conn->query("SELECT COUNT(*) as c FROM users WHERE role='student'")->fetch_assoc()['c'];
$exams = $conn->query("SELECT COUNT(*) as c FROM results")->fetch_assoc()['c'];
$subjects = $conn->query("SELECT COUNT(*) as c FROM subjects")->fetch_assoc()['c'];
$questions = $conn->query("SELECT COUNT(*) as c FROM questions")->fetch_assoc()['c'];

?>
<div class="fade-in mt-4">
    <h2 class="fw-bold mb-4" style="color: #2c3e50;">Admin Dashboard</h2>
    
    <div class="row g-4 mb-5">
        <div class="col-md-3">
            <div class="card p-4 shadow-lg text-center text-white glass-card border-0" style="background: linear-gradient(135deg, #74b9ff, #0984e3);">
                <h6 class="text-uppercase fw-bold text-light opacity-75">Students</h6>
                <h1 class="display-4 fw-bold mt-2"><?php echo $students; ?></h1>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card p-4 shadow-lg text-center text-white glass-card border-0" style="background: linear-gradient(135deg, #55efc4, #00b894);">
                <h6 class="text-uppercase fw-bold text-light opacity-75">Exams Attempted</h6>
                <h1 class="display-4 fw-bold mt-2"><?php echo $exams; ?></h1>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card p-4 shadow-lg text-center text-white glass-card border-0" style="background: linear-gradient(135deg, #fab1a0, #e17055);">
                <h6 class="text-uppercase fw-bold text-light opacity-75">Subjects</h6>
                <h1 class="display-4 fw-bold mt-2"><?php echo $subjects; ?></h1>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card p-4 shadow-lg text-center text-dark glass-card border-0" style="background: linear-gradient(135deg, #ffeaa7, #fdcb6e);">
                <h6 class="text-uppercase fw-bold opacity-75">Questions Bank</h6>
                <h1 class="display-4 fw-bold mt-2"><?php echo $questions; ?></h1>
            </div>
        </div>
    </div>
    
    <h4 class="fw-bold" style="color: #636e72;">Recent Attempts</h4>
    <div class="table-responsive glass-card p-4 shadow-lg border-0 mb-5" style="border-radius: 20px;">
        <table class="table table-hover align-middle">
            <thead style="background: rgba(0,0,0,0.05);">
                <tr class="text-muted text-uppercase fs-6">
                    <th class="py-3">Student Name</th>
                    <th class="py-3">Subject</th>
                    <th class="py-3">Score</th>
                    <th class="py-3">Date</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $res = $conn->query("SELECT users.name, subjects.subject_name, results.score, results.total, results.timestamp 
                                     FROM results 
                                     JOIN users ON results.user_id = users.id 
                                     JOIN subjects ON results.subject_id = subjects.id 
                                     ORDER BY results.timestamp DESC LIMIT 10");
                while($row = $res->fetch_assoc()):
                ?>
                <tr class="border-bottom border-light">
                    <td class="py-4 fw-bold text-primary"><?php echo htmlspecialchars($row['name']); ?></td>
                    <td class="py-4 fw-bold"><?php echo htmlspecialchars($row['subject_name']); ?></td>
                    <td class="py-4 font-monospace fs-5">
                       <span class="badge bg-success rounded-pill px-3 py-2 shadow-sm">
                           <?php echo $row['score']; ?> / <?php echo $row['total']; ?>
                       </span>
                    </td>
                    <td class="py-4 text-muted small"><?php echo $row['timestamp']; ?></td>
                </tr>
                <?php endwhile; if($res->num_rows == 0) echo "<tr><td colspan='4'>No attempts yet.</td></tr>"; ?>
            </tbody>
        </table>
    </div>

</div>
<?php require 'footer.php'; ?>
