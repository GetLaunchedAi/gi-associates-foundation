<?php
/**
 * Square Payment Configuration
 * GI Associates Foundation
 * 
 * Store your Square credentials here securely.
 * For production, consider using environment variables or a secure config file.
 */

// Square Sandbox Configuration (for testing)
define('SQUARE_SANDBOX_APP_ID', 'sandbox-sq0idb-gcWsDO_XVdN-VQxoPxS1iQ'); // Replace with your sandbox Application ID
define('SQUARE_SANDBOX_ACCESS_TOKEN', 'EAAAlzC1gcqxrvkO_VQ4Le5yXdTwU5xC-8vaZyWRSYz1mHMfluWPI0CrzNB7gb1x'); // Replace with your sandbox Access Token
define('SQUARE_SANDBOX_LOCATION_ID', 'LTT4WRVJPJD7K'); // Replace with your sandbox Location ID

// Square Production Configuration (for live site)
define('SQUARE_PRODUCTION_APP_ID', 'sq0idp-xxxxx'); // Replace with your production Application ID
define('SQUARE_PRODUCTION_ACCESS_TOKEN', 'sq0atp-xxxxx'); // Replace with your production Access Token
define('SQUARE_PRODUCTION_LOCATION_ID', 'location-id'); // Replace with your production Location ID

// Environment setting
define('SQUARE_ENVIRONMENT', 'sandbox'); // Change to 'production' when ready to go live

// Email configuration for notifications
define('ADMIN_EMAIL', 'helpinghandsministry1969@yahoo.com');
define('FROM_EMAIL', 'noreply@reallove1969.org');
define('FROM_NAME', 'GI Associates Foundation');

// Transaction logging
define('TRANSACTIONS_DIR', __DIR__ . '/../logs/transactions/');
define('ORDERS_DIR', __DIR__ . '/../logs/orders/');

// Ensure transaction directories exist
if (!is_dir(TRANSACTIONS_DIR)) {
    @mkdir(TRANSACTIONS_DIR, 0755, true);
}
if (!is_dir(ORDERS_DIR)) {
    @mkdir(ORDERS_DIR, 0755, true);
}

/**
 * Get current Square configuration based on environment
 */
function getSquareConfig() {
    if (SQUARE_ENVIRONMENT === 'production') {
        return [
            'app_id' => SQUARE_PRODUCTION_APP_ID,
            'access_token' => SQUARE_PRODUCTION_ACCESS_TOKEN,
            'location_id' => SQUARE_PRODUCTION_LOCATION_ID,
            'environment' => 'production'
        ];
    } else {
        return [
            'app_id' => SQUARE_SANDBOX_APP_ID,
            'access_token' => SQUARE_SANDBOX_ACCESS_TOKEN,
            'location_id' => SQUARE_SANDBOX_LOCATION_ID,
            'environment' => 'sandbox'
        ];
    }
}

// If this file is accessed directly, return the configuration as JSON
if (basename($_SERVER['PHP_SELF']) === 'square-config.php') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Content-Type');
    
    $config = getSquareConfig();
    echo json_encode($config);
    exit;
}

/**
 * Get Square API base URL based on environment
 */
function getSquareApiUrl() {
    return SQUARE_ENVIRONMENT === 'production' 
        ? 'https://connect.squareup.com/v2'
        : 'https://connect.squareupsandbox.com/v2';
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId($prefix = 'txn') {
    return $prefix . '_' . uniqid() . '_' . time();
}

/**
 * Log transaction data
 */
function logTransaction($data) {
    $filename = TRANSACTIONS_DIR . date('Y-m-d') . '.json';
    $transactions = [];
    
    if (file_exists($filename)) {
        $transactions = json_decode(file_get_contents($filename), true) ?: [];
    }
    
    $transactions[] = $data;
    file_put_contents($filename, json_encode($transactions, JSON_PRETTY_PRINT));
}

/**
 * Log order data
 */
function logOrder($data) {
    $filename = ORDERS_DIR . date('Y-m-d') . '.json';
    $orders = [];
    
    if (file_exists($filename)) {
        $orders = json_decode(file_get_contents($filename), true) ?: [];
    }
    
    $orders[] = $data;
    file_put_contents($filename, json_encode($orders, JSON_PRETTY_PRINT));
}
