<?php
    $host = 'server.example.com';
    $dbname = 'beehive';
    $username = 'db_user';
    $password = 'PASSWORD';

    $conn = mysqli_connect($host, $username, $password, $dbname);
    if ($conn->connect_errno) {
        echo "Failed to connect to MySQL: (" . $conn->connect_errno . ") " . $conn->connect_error;
        exit();
    }
    $conn->set_charset('utf8mb4');
?>