<?php
// DEV helpers — remove display_errors in production
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Read JSON body first, then fallback to $_POST
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    $input = $_POST;
}

$staffid = trim($input['staffid'] ?? '');
$password = $input['password'] ?? '';

if ($staffid === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Staff ID and password required']);
    exit;
}

$mysqli = new mysqli('localhost', 'root', '', 'tm_data');
if ($mysqli->connect_errno) {
    error_log('DB connect error: ' . $mysqli->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$stmt = $mysqli->prepare("SELECT password FROM staff WHERE staffid = ?");
$stmt->bind_param('s', $staffid);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Staff ID not found']);
    $stmt->close();
    $mysqli->close();
    exit;
}

$stmt->bind_result($stored);
$stmt->fetch();
$stmt->close();

// If stored value looks like a hash use password_verify, otherwise plain compare
$isAuth = false;
if (is_string($stored) && (strpos($stored, '$2y$') === 0 || strpos($stored, '$2b$') === 0 || strpos($stored, '$argon2') === 0)) {
    if (password_verify($password, $stored)) $isAuth = true;
} else {
    if ($password === $stored) $isAuth = true; // insecure fallback
}

$mysqli->close();

if ($isAuth) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid password']);
}
?>