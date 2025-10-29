<?php
require 'vendor/autoload.php';

use Square\SquareClient;
use Square\Models\CreatePaymentRequest;
use Square\Exceptions\ApiException;

header('Content-Type: application/json');

$accessToken = 'EAAAlzC1gcqxrvkO_VQ4Le5yXdTwU5xC-8vaZyWRSYz1mHMfluWPI0CrzNB7gb1x';
$locationId = 'LTT4WRVJPJD7K';

$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token']);
    exit;
}

$client = new SquareClient([
    'accessToken' => $accessToken,
    'environment' => 'sandbox'
]);

$paymentsApi = $client->getPaymentsApi();
$idempotencyKey = uniqid();

$money = new \Square\Models\Money();
$money->setAmount(100); // $1.00
$money->setCurrency('USD');

$request = new CreatePaymentRequest($token, $idempotencyKey, $money);
$request->setLocationId($locationId);

try {
    $response = $paymentsApi->createPayment($request);
    echo json_encode($response->getResult());
} catch (ApiException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
