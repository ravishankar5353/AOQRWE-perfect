<?php
require 'db.php';
require 'header.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    header("Location: login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
?>
<div class="fade-in mt-4">
    <h2 class="fw-bold mb-4" style="color: #2c3e50;">Student Dashboard</h2>
    <p class="lead text-muted">Welcome back, <span class="fw-bold" style="color: #0984e3;"><?php echo htmlspecialchars($_SESSION['name']); ?></span>. Select a subject to start an exam.</p>

    <div class="row g-4 mt-3">
        <?php
        $subjects = $conn->query("SELECT s.id, s.subject_name, COUNT(q.id) as q_count FROM subjects s LEFT JOIN questions q ON s.id = q.subject_id GROUP BY s.id");
        while ($sub = $subjects->fetch_assoc()):
        ?>
        <div class="col-md-4">
            <div class="card p-4 shadow-lg border-0 glass-card text-center" style="border-radius: 20px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                <h4 class="fw-bold text-dark mb-3"><?php echo htmlspecialchars($sub['subject_name']); ?></h4>
                <div class="badge bg-secondary rounded-pill px-3 py-2 mb-4 fs-6">
                    <?php echo $sub['q_count']; ?> Questions Available
                </div>
                <?php if($sub['q_count'] > 0): ?>
                    <a href="quiz.php?subject_id=<?php echo $sub['id']; ?>" class="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow">Start Exam</a>
                <?php else: ?>
                    <button class="btn btn-outline-secondary w-100 rounded-pill py-2" disabled>No Questions Yet</button>
                <?php endif; ?>
            </div>
        </div>
        <?php endwhile; ?>
    </div>

    <h4 class="fw-bold mt-5 mb-4" style="color: #636e72;">Your Recent Attempts</h4>
    <div class="table-responsive glass-card p-4 shadow-lg border-0 mb-5" style="border-radius: 20px;">
        <table class="table table-hover align-middle">
            <thead style="background: rgba(0,0,0,0.05);">
                <tr class="text-muted text-uppercase fs-6">
                    <th class="py-3">Subject</th>
                    <th class="py-3">Score</th>
                    <th class="py-3">Percentage</th>
                    <th class="py-3">Date</th>
                    <th class="py-3 text-center">Action</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $res = $conn->query("SELECT r.id, s.subject_name, r.score, r.total, r.timestamp FROM results r JOIN subjects s ON r.subject_id = s.id WHERE r.user_id = $user_id ORDER BY r.timestamp DESC");
                while($row = $res->fetch_assoc()):
                    $pct = ($row['total'] > 0) ? round(($row['score'] / $row['total']) * 100, 2) : 0;
                ?>
                <tr class="border-bottom border-light">
                    <td class="py-4 fw-bold text-dark"><?php echo htmlspecialchars($row['subject_name']); ?></td>
                    <td class="py-4 font-monospace fs-5">
                       <span class="badge <?php echo ($pct >= 50) ? 'bg-success' : 'bg-danger'; ?> rounded-pill px-3 py-2 shadow-sm">
                           <?php echo $row['score']; ?> / <?php echo $row['total']; ?>
                       </span>
                    </td>
                    <td class="py-4 fw-bold text-primary"><?php echo $pct; ?>%</td>
                    <td class="py-4 text-muted small"><?php echo $row['timestamp']; ?></td>
                    <td class="py-4 text-center">
                        <a href="review.php?result_id=<?php echo $row['id']; ?>" class="btn btn-sm btn-outline-dark rounded-pill px-3">Review</a>
                    </td>
                </tr>
                <?php endwhile; if($res->num_rows == 0) echo "<tr><td colspan='5'>You haven't taken any exams yet.</td></tr>"; ?>
            </tbody>
        </table>
    </div>

</div>
<?php require 'footer.php'; ?>
