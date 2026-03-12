<?php
require 'db.php';
require 'header.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, name, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['role'] = $user['role'];
            
            if ($user['role'] == 'admin') {
                header("Location: admin_dashboard.php");
            } else {
                header("Location: student_dashboard.php");
            }
            exit();
        } else {
            $error = "Invalid password.";
        }
    } else {
        $error = "User not found.";
    }
}
?>
<div class="row justify-content-center mt-5 fade-in">
    <div class="col-md-5">
        <div class="card glass-card p-5 shadow-lg border-0">
            <h3 class="text-center mb-4 fw-bold" style="color: #6c5ce7;">Login</h3>
            <?php if($error): ?>
                <div class="alert alert-danger shadow-sm"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-floating mb-3">
                    <input type="email" name="email" class="form-control" id="email" placeholder="Email" required>
                    <label for="email">Email address</label>
                </div>
                <div class="form-floating mb-4">
                    <input type="password" name="password" class="form-control" id="password" placeholder="Password" required>
                    <label for="password">Password</label>
                </div>
                <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold">Login</button>
            </form>
            <div class="text-center mt-4 pt-3 border-top">
                <p>New Student? <a href="register.php" class="text-decoration-none fw-bold" style="color: #0984e3;">Register here</a></p>
                <p class="small text-muted">Admin: admin@aoqrwe.com / admin123</p>
            </div>
        </div>
    </div>
</div>
<?php require 'footer.php'; ?>
