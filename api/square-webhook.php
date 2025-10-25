<?php
/**
 * Square Webhook Handler
 * GI Associates Foundation
 * 
 * Handles Square payment webhooks for payment status updates
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

// Get the raw POST data
$raw_input = file_get_contents('php://input');
$webhook_data = json_decode($raw_input, true);

if (!$webhook_data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Verify webhook signature (recommended for production)
// For now, we'll skip signature verification in sandbox mode
$config = getSquareConfig();
if ($config['environment'] === 'production') {
    // TODO: Implement webhook signature verification
    // $signature = $_SERVER['HTTP_X_SQUARE_SIGNATURE'] ?? '';
    // if (!verifyWebhookSignature($raw_input, $signature)) {
    //     http_response_code(401);
    //     echo json_encode(['error' => 'Invalid signature']);
    //     exit;
    // }
}

try {
    // Process webhook events
    $events = $webhook_data['events'] ?? [];
    
    foreach ($events as $event) {
        $event_type = $event['type'] ?? '';
        $event_data = $event['data'] ?? [];
        
        switch ($event_type) {
            case 'payment.updated':
                handlePaymentUpdate($event_data);
                break;
                
            case 'payment.created':
                handlePaymentCreated($event_data);
                break;
                
            case 'refund.created':
                handleRefundCreated($event_data);
                break;
                
            default:
                // Log unknown event type
                error_log("Unknown Square webhook event type: $event_type");
                break;
        }
    }
    
    // Return success response
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    error_log('Square webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Webhook processing failed']);
}

/**
 * Handle payment update events
 */
function handlePaymentUpdate($event_data) {
    $payment = $event_data['payment'] ?? [];
    $payment_id = $payment['id'] ?? '';
    $status = $payment['status'] ?? '';
    
    if (!$payment_id) {
        return;
    }
    
    // Update transaction status in logs
    updateTransactionStatus($payment_id, $status);
    
    // Send notification emails if payment completed
    if ($status === 'COMPLETED') {
        sendPaymentCompletionNotification($payment);
    }
}

/**
 * Handle payment created events
 */
function handlePaymentCreated($event_data) {
    $payment = $event_data['payment'] ?? [];
    $payment_id = $payment['id'] ?? '';
    
    if (!$payment_id) {
        return;
    }
    
    // Log new payment creation
    error_log("New Square payment created: $payment_id");
}

/**
 * Handle refund created events
 */
function handleRefundCreated($event_data) {
    $refund = $event_data['refund'] ?? [];
    $payment_id = $refund['payment_id'] ?? '';
    $refund_id = $refund['id'] ?? '';
    
    if (!$payment_id || !$refund_id) {
        return;
    }
    
    // Log refund
    error_log("Square refund created: $refund_id for payment: $payment_id");
    
    // Update transaction status
    updateTransactionStatus($payment_id, 'REFUNDED');
}

/**
 * Update transaction status in log files
 */
function updateTransactionStatus($payment_id, $status) {
    $transactions_dir = TRANSACTIONS_DIR;
    $files = glob($transactions_dir . '*.json');
    
    foreach ($files as $file) {
        $transactions = json_decode(file_get_contents($file), true) ?: [];
        $updated = false;
        
        foreach ($transactions as &$transaction) {
            if (isset($transaction['square_payment_id']) && $transaction['square_payment_id'] === $payment_id) {
                $transaction['status'] = $status;
                $transaction['updated_at'] = date('c');
                $updated = true;
                break;
            }
        }
        
        if ($updated) {
            file_put_contents($file, json_encode($transactions, JSON_PRETTY_PRINT));
            break;
        }
    }
}

/**
 * Send payment completion notification
 */
function sendPaymentCompletionNotification($payment) {
    $payment_id = $payment['id'] ?? '';
    $amount = ($payment['amount_money']['amount'] ?? 0) / 100;
    $currency = $payment['amount_money']['currency'] ?? 'USD';
    
    // Send admin notification
    $subject = 'Payment Completed - GI Associates Foundation';
    $message = "
    <html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2 style='color: #2c5aa0;'>Payment Completed</h2>
        <p>A payment has been successfully processed through Square.</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
            <li>Payment ID: $payment_id</li>
            <li>Amount: $" . number_format($amount, 2) . " $currency</li>
            <li>Status: Completed</li>
            <li>Date: " . date('F j, Y \a\t g:i A') . "</li>
        </ul>
        <p>You can view more details in your Square Dashboard.</p>
    </body>
    </html>";
    
    $headers = [
        'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
        'Reply-To: ' . FROM_EMAIL,
        'Content-Type: text/html; charset=UTF-8'
    ];
    
    @mail(ADMIN_EMAIL, $subject, $message, implode("\r\n", $headers));
}

/**
 * Verify webhook signature (for production use)
 */
function verifyWebhookSignature($payload, $signature) {
    // TODO: Implement Square webhook signature verification
    // This requires your webhook signature key from Square Dashboard
    return true; // Placeholder - implement proper verification
}
