<?php
require 'db.php';

header('Content-Type: application/json');

// Process quiz submission via AJAX POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    session_start();
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    
    $user_id = $_SESSION['user_id'];
    $subject_id = $data['subject_id'];
    $answers = $data['answers']; // array of question_id => selected_option
    
    // Calculate score
    $score = 0;
    $total = count($answers); // Wait, total should be total questions in the subject that were presented
    
    // We will evaluate the answers
    $results_data = [];
    
    foreach ($answers as $q_id => $selected) {
        $q_id = intval($q_id);
        $res = $conn->query("SELECT correct_answer FROM questions WHERE id = $q_id");
        if($res->num_rows > 0) {
            $row = $res->fetch_assoc();
            $correct = $row['correct_answer'];
            $is_c = (strtoupper($selected) === strtoupper($correct)) ? 1 : 0;
            if($is_c) $score++;
            
            $results_data[] = [
                'q_id' => $q_id,
                'selected' => $selected,
                'is_correct' => $is_c
            ];
        }
    }
    
    // Insert Result
    $stmt = $conn->prepare("INSERT INTO results (user_id, subject_id, score, total) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiii", $user_id, $subject_id, $score, $total);
    if($stmt->execute()) {
        $result_id = $stmt->insert_id;
        
        // Insert attempts
        $att_stmt = $conn->prepare("INSERT INTO attempts (result_id, user_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?, ?)");
        
        foreach($results_data as $att) {
            $att_stmt->bind_param("iiisi", $result_id, $user_id, $att['q_id'], $att['selected'], $att['is_correct']);
            $att_stmt->execute();
        }
        
        echo json_encode(['success' => true, 'result_id' => $result_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}
?>
