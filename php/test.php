<?php
// DEV only: check a password vs stored DB hash
ini_set('display_errors',1); error_reporting(E_ALL);

$staffid = 'TM123';
$test = 'your-typed-password-here'; // replace with the password you typed in the form

$mysqli = new mysqli('localhost','root','','tm_data');
if ($mysqli->connect_errno) { echo "DB error: ".$mysqli->connect_error; exit; }

$stmt = $mysqli->prepare("SELECT password FROM staff WHERE staffid = ?");
$stmt->bind_param('s',$staffid);
$stmt->execute();
$stmt->bind_result($stored);
if ($stmt->fetch()) {
    echo "Stored: ".htmlspecialchars($stored)."<br>";
    echo "password_verify: ".(password_verify($test,$stored) ? 'MATCH' : 'NO MATCH');
} else {
    echo "staffid not found";
}
$stmt->close();
$mysqli->close();
?>