<?php
require 'db.php';
require 'header.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header("Location: login.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_subject'])) {
    $subject_name = trim($_POST['subject_name']);
    $stmt = $conn->prepare("INSERT INTO subjects (subject_name) VALUES (?)");
    $stmt->bind_param("s", $subject_name);
    if($stmt->execute()) {
        $msg = "<div class='alert alert-success'>Subject added successfully.</div>";
    }
}
?>
<div class="row fade-in mt-4">
    <div class="col-md-5">
        <div class="card p-4 shadow-lg border-0 glass-card" style="border-radius: 20px;">
            <h4 class="mb-4" style="color: #0984e3;">📚 Add New Subject</h4>
            <?php if(isset($msg)) echo $msg; ?>
            <form method="POST">
                <div class="form-floating mb-4">
                    <input type="text" name="subject_name" class="form-control" id="sub" placeholder="Subject Name" required>
                    <label for="sub">Subject Name</label>
                </div>
                <button type="submit" name="add_subject" class="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow">Save Subject</button>
            </form>
        </div>
    </div>
    <div class="col-md-7">
        <div class="card p-4 shadow-lg border-0 glass-card" style="border-radius: 20px;">
            <h4 class="mb-4" style="color: #636e72;">Existing Subjects</h4>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr><th class="py-3">Subject ID</th><th class="py-3">Subject Name</th></tr>
                    </thead>
                    <tbody>
                        <?php 
                        $res = $conn->query("SELECT * FROM subjects");
                        while($row = $res->fetch_assoc()):
                        ?>
                        <tr>
                            <td class="py-3 fw-bold text-secondary">#<?php echo $row['id']; ?></td>
                            <td class="py-3 fw-bold"><?php echo htmlspecialchars($row['subject_name']); ?></td>
                        </tr>
                        <?php endwhile; if($res->num_rows == 0) echo "<tr><td colspan='2'>No subjects found.</td></tr>"; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php require 'footer.php'; ?>
