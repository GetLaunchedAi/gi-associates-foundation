<?php
// === Enable error reporting for debugging ===
error_reporting(E_ALL);
ini_set('display_errors', 1);

// === CORS headers (important if frontend calls from another domain) ===
header("Access-Control-Allow-Origin: *"); // Replace * with your domain in production
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// === Check if Composer autoload exists ===
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Composer autoload not found. Did you run composer install?']);
    exit;
}

require $autoloadPath;

use Square\SquareClient;
use Square\Payments\Requests\CreatePaymentRequest;
use Square\Types\Money;
use Square\Exceptions\SquareException;
use Square\Exceptions\SquareApiException;

// === Set your Square credentials ===
$accessToken = 'EAAAlzC1gcqxrvkO_VQ4Le5yXdTwU5xC-8vaZyWRSYz1mHMfluWPI0CrzNB7gb1x';
$locationId = 'LTT4WRVJPJD7K';

// === Read input JSON ===
$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? null;
$amount = $input['amount'] ?? 100; // default to 100 cents ($1.00)

// Validate token
if (!$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing card token']);
    exit;
}

// === Initialize Square client (new SDK style) ===
$client = new SquareClient(
    $accessToken,
    null,
    [ 'baseUrl' => \Square\Environments::Sandbox->value ]
);

$paymentsApi = $client->payments;
$idempotencyKey = uniqid('', true);

// === Prepare money object ===
$money = new Money([
    'amount' => $amount,
    'currency' => 'USD'
]);

// === Prepare payment request ===
$request = new CreatePaymentRequest([
    'sourceId' => $token,
    'idempotencyKey' => $idempotencyKey,
    'amountMoney' => $money,
    'locationId' => $locationId
]);

// === Execute payment ===
try {
    $response = $paymentsApi->create($request, [ 'baseUrl' => \Square\Environments::Sandbox->value ]);
    echo (string) $response;
} catch (SquareApiException $e) {
    http_response_code(500);
    echo json_encode(['errors' => [[ 'message' => $e->getMessage(), 'body' => $e->getBody() ?? null ]]]);
} catch (SquareException $e) {
    http_response_code(500);
    echo json_encode(['errors' => [[ 'message' => $e->getMessage() ]]]);
}
