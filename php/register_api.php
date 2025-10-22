<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// read JSON body
$input = json_decode(file_get_contents('php://input'), true);
$staffid = trim($input['staffid'] ?? '');
$password = $input['password'] ?? '';

if ($staffid === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Staff ID and password are required.']);
    exit;
}

// basic staffid validation (adjust rules as needed)
if (!preg_match('/^[A-Za-z0-9_\-]{3,50}$/', $staffid)) {
    echo json_encode(['success' => false, 'message' => 'Invalid Staff ID. Use 3-50 letters, numbers, _ or -']);
    exit;
}

$mysqli = new mysqli('localhost', 'root', '', 'tm_data');
if ($mysqli->connect_errno) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// check existing
$stmt = $mysqli->prepare("SELECT staffid FROM staff WHERE staffid = ?");
$stmt->bind_param('s', $staffid);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Staff ID already exists.']);
    $stmt->close();
    $mysqli->close();
    exit;
}
$stmt->close();

// insert hashed password
$hash = password_hash($password, PASSWORD_DEFAULT);
$ins = $mysqli->prepare("INSERT INTO staff (staffid, password) VALUES (?, ?)");
$ins->bind_param('ss', $staffid, $hash);
if ($ins->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed.']);
}
$ins->close();
$mysqli->close();
?>