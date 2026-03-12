<?php
require 'db.php';
require 'header.php';

$msg = '';
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_BCRYPT);
    $role = 'student';

    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $password, $role);
    
    if ($stmt->execute()) {
        $msg = "<div class='alert alert-success shadow-sm'>Registration successful! <a href='login.php' class='fw-bold text-success'>Login here</a></div>";
    } else {
        $msg = "<div class='alert alert-danger shadow-sm'>Email already exists. Please choose a different one.</div>";
    }
}
?>
<div class="row justify-content-center mt-5 fade-in">
    <div class="col-md-5">
        <div class="card glass-card p-5 shadow-lg border-0">
            <h3 class="text-center mb-4 fw-bold" style="color: #00b894;">Student Registration</h3>
            <?php echo $msg; ?>
            <form method="POST">
                <div class="form-floating mb-3">
                    <input type="text" name="name" class="form-control" id="name" placeholder="Full Name" required>
                    <label for="name">Full Name</label>
                </div>
                <div class="form-floating mb-3">
                    <input type="email" name="email" class="form-control" id="email" placeholder="Email" required>
                    <label for="email">Email Address</label>
                </div>
                <div class="form-floating mb-4">
                    <input type="password" name="password" class="form-control" id="password" placeholder="Password" required>
                    <label for="password">Password</label>
                </div>
                <button type="submit" class="btn btn-success w-100 py-3 rounded-pill fw-bold">Register Now</button>
            </form>
            <div class="text-center mt-4 pt-3 border-top">
                <p>Already Registered? <a href="login.php" class="text-decoration-none fw-bold" style="color: #0984e3;">Login here</a></p>
            </div>
        </div>
    </div>
</div>
<?php require 'footer.php'; ?>
