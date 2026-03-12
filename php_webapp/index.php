<?php
require 'header.php';
if (isset($_SESSION['role'])) {
    if ($_SESSION['role'] == 'admin') {
        header("Location: admin_dashboard.php");
    } else {
        header("Location: student_dashboard.php");
    }
    exit();
}
?>
<div class="row justify-content-center mt-5 fade-in">
    <div class="col-md-8 text-center glass-card p-5">
        <h1 class="display-3 fw-bold mb-4" style="color: #2c3e50;">Welcome to <span style="color: #0984e3;">AOQRWE</span></h1>
        <p class="lead text-muted mb-5">Advanced Online Quiz with Real-time Evaluation</p>
        <div class="d-flex justify-content-center gap-4">
            <a href="login.php" class="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold shadow">Login Now</a>
            <a href="register.php" class="btn btn-outline-dark btn-lg px-5 py-3 rounded-pill fw-bold shadow-sm">Student Register</a>
        </div>
    </div>
</div>
<?php require 'footer.php'; ?>
