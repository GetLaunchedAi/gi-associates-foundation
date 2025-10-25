<?php
/**
 * Square Payment Processing API
 * GI Associates Foundation
 * 
 * Handles payment processing through Square's API
 */

declare(strict_types=1);

// Include configuration
require_once __DIR__ . '/square-config.php';

// Set content type
header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get Square configuration
$config = getSquareConfig();

// Read and parse JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$required_fields = ['source_id', 'amount', 'type'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

try {
    // Generate unique transaction ID
    $transaction_id = generateTransactionId();
    
    // Prepare Square payment request
    $payment_data = [
        'source_id' => $data['source_id'],
        'amount_money' => [
            'amount' => (int)($data['amount'] * 100), // Convert to cents
            'currency' => 'USD'
        ],
        'idempotency_key' => $transaction_id,
        'location_id' => $config['location_id']
    ];
    
    // Add customer info if provided
    if (isset($data['customer']) && !empty($data['customer'])) {
        $payment_data['buyer_email_address'] = $data['customer']['email'] ?? '';
    }
    
    // Add note if provided
    if (isset($data['note']) && !empty($data['note'])) {
        $payment_data['note'] = $data['note'];
    }
    
    // Make request to Square API
    $api_url = getSquareApiUrl() . '/payments';
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $api_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payment_data),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['access_token'],
            'Content-Type: application/json',
            'Square-Version: 2023-10-18'
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($curl_error) {
        throw new Exception('CURL Error: ' . $curl_error);
    }
    
    $response_data = json_decode($response, true);
    
    if ($http_code !== 200) {
        $error_message = $response_data['errors'][0]['detail'] ?? 'Unknown error';
        throw new Exception('Square API Error: ' . $error_message);
    }
    
    // Extract payment information
    $payment = $response_data['payment'];
    $payment_id = $payment['id'];
    $status = $payment['status'];
    $amount = $payment['amount_money']['amount'] / 100; // Convert back to dollars
    
    // Prepare transaction log data
    $transaction_log = [
        'transaction_id' => $transaction_id,
        'square_payment_id' => $payment_id,
        'type' => $data['type'],
        'amount' => $amount,
        'status' => $status,
        'customer' => $data['customer'] ?? null,
        'items' => $data['items'] ?? null,
        'timestamp' => date('c'),
        'environment' => $config['environment']
    ];
    
    // Log the transaction
    logTransaction($transaction_log);
    
    // If it's a shop order, also log it separately
    if ($data['type'] === 'shop_order') {
        logOrder($transaction_log);
    }
    
    // Send email notifications
    if ($status === 'COMPLETED') {
        sendPaymentConfirmation($transaction_log);
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'transaction_id' => $transaction_id,
        'square_payment_id' => $payment_id,
        'status' => $status,
        'amount' => $amount,
        'message' => 'Payment processed successfully'
    ]);
    
} catch (Exception $e) {
    // Log error
    error_log('Square Payment Error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Payment processing failed',
        'message' => $e->getMessage()
    ]);
}

/**
 * Send payment confirmation email
 */
function sendPaymentConfirmation($transaction) {
    $to = $transaction['customer']['email'] ?? ADMIN_EMAIL;
    $subject = '';
    $message = '';
    
    if ($transaction['type'] === 'donation') {
        $subject = 'Thank you for your donation - GI Associates Foundation';
        $message = buildDonationEmail($transaction);
    } else {
        $subject = 'Order Confirmation - GI Associates Foundation';
        $message = buildOrderEmail($transaction);
    }
    
    // Send email
    $headers = [
        'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
        'Reply-To: ' . FROM_EMAIL,
        'Content-Type: text/html; charset=UTF-8'
    ];
    
    @mail($to, $subject, $message, implode("\r\n", $headers));
    
    // Also send admin notification
    $admin_subject = 'New ' . ucfirst($transaction['type']) . ' - GI Associates Foundation';
    $admin_message = buildAdminNotification($transaction);
    @mail(ADMIN_EMAIL, $admin_subject, $admin_message, implode("\r\n", $headers));
}

/**
 * Build donation confirmation email
 */
function buildDonationEmail($transaction) {
    $amount = '$' . number_format($transaction['amount'], 2);
    $name = $transaction['customer']['name'] ?? 'Valued Supporter';
    
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2 style='color: #2c5aa0;'>Thank You for Your Donation!</h2>
        <p>Dear $name,</p>
        <p>Thank you for your generous donation of $amount to GI Associates Foundation for Victims of Domestic Violence & Human Trafficking.</p>
        <p><strong>Donation Details:</strong></p>
        <ul>
            <li>Amount: $amount</li>
            <li>Transaction ID: {$transaction['transaction_id']}</li>
            <li>Date: " . date('F j, Y \a\t g:i A', strtotime($transaction['timestamp'])) . "</li>
        </ul>
        <p>Your donation helps us provide emergency assistance, legal support, and long-term recovery resources to victims of domestic violence and human trafficking.</p>
        <p>This email serves as your receipt for tax purposes.</p>
        <p>With gratitude,<br>GI Associates Foundation</p>
    </body>
    </html>";
}

/**
 * Build order confirmation email
 */
function buildOrderEmail($transaction) {
    $amount = '$' . number_format($transaction['amount'], 2);
    $name = $transaction['customer']['name'] ?? 'Valued Customer';
    
    $items_html = '';
    if (isset($transaction['items']) && is_array($transaction['items'])) {
        foreach ($transaction['items'] as $item) {
            $items_html .= "<li>{$item['name']} - {$item['quantity']} x $" . number_format($item['price'], 2) . "</li>";
        }
    }
    
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2 style='color: #2c5aa0;'>Order Confirmation</h2>
        <p>Dear $name,</p>
        <p>Thank you for your order! Your items will be shipped within 24-48 hours.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
            $items_html
        </ul>
        <p><strong>Total: $amount</strong></p>
        <p><strong>Shipping Address:</strong></p>
        <p>" . ($transaction['customer']['address'] ?? 'N/A') . "</p>
        <p>Order ID: {$transaction['transaction_id']}</p>
        <p>Thank you for supporting our mission!</p>
        <p>GI Associates Foundation</p>
    </body>
    </html>";
}

/**
 * Build admin notification email
 */
function buildAdminNotification($transaction) {
    $type = ucfirst($transaction['type']);
    $amount = '$' . number_format($transaction['amount'], 2);
    
    return "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2 style='color: #2c5aa0;'>New $type Received</h2>
        <p><strong>Transaction ID:</strong> {$transaction['transaction_id']}</p>
        <p><strong>Square Payment ID:</strong> {$transaction['square_payment_id']}</p>
        <p><strong>Amount:</strong> $amount</p>
        <p><strong>Customer:</strong> " . ($transaction['customer']['name'] ?? 'N/A') . "</p>
        <p><strong>Email:</strong> " . ($transaction['customer']['email'] ?? 'N/A') . "</p>
        <p><strong>Date:</strong> " . date('F j, Y \a\t g:i A', strtotime($transaction['timestamp'])) . "</p>
    </body>
    </html>";
}
