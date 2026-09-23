<?php
// index.php - Main entry point serving the application
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
include_once __DIR__ . '/index.html';
?>
