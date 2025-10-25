# Square Payment Integration Guide
## GI Associates Foundation

This guide explains how to set up and use the Square payment integration for the GI Associates Foundation website.

## Overview

The Square payment integration allows customers to make secure payments for:
- Shop orders (products with "pay what you want" donations)
- One-time donations
- Monthly recurring donations

## Files Created/Modified

### New Files Created:
- `/api/square-config.php` - Configuration file for Square credentials
- `/api/square-payment.php` - Main payment processing endpoint
- `/api/square-webhook.php` - Webhook handler for payment updates
- `/src/assets/js/square-payments.js` - Square Web Payments SDK integration
- `/src/css/square-payments-enhanced.css` - Enhanced styling for payment forms

### Files Modified:
- `/src/pages/shop.html` - Added Square payment option alongside Snipcart
- `/src/pages/donations.html` - Replaced placeholder Square integration with real implementation

## Setup Instructions

### 1. Configure Square Credentials

Edit `/api/square-config.php` and replace the placeholder values with your actual Square credentials:

```php
// Replace these with your actual Square sandbox credentials
define('SQUARE_SANDBOX_APP_ID', 'sandbox-sq0idb-xxxxx');
define('SQUARE_SANDBOX_ACCESS_TOKEN', 'sandbox-sq0atb-xxxxx');
define('SQUARE_SANDBOX_LOCATION_ID', 'sandbox-location-id');
```

### 2. Update JavaScript Configuration

Edit `/src/assets/js/square-payments.js` and replace the placeholder Application ID:

```javascript
// Replace with your actual Square Application ID
await window.squarePaymentHandler.initialize('sandbox-sq0idb-xxxxx');
```

### 3. Build the Website

Since you're using Eleventy, run the build command to generate the public files:

```bash
npm run build
```

This will copy the Square integration files from `/src/` to `/public/`.

## Testing

### Sandbox Test Cards

Use these test card numbers for testing:

- **Success:** `4111 1111 1111 1111`
- **Decline:** `4000 0000 0000 0002`
- **CVV:** Any 3 digits
- **Expiry:** Any future date
- **ZIP:** Any valid ZIP code

### Test Scenarios

1. **Shop Order Payment:**
   - Fill out the order form on `/shop/`
   - Click "Pay with Square"
   - Enter test card details
   - Verify payment processing

2. **Donation Payment:**
   - Go to `/donations/`
   - Select an amount and choose "Square" payment method
   - Enter test card details
   - Verify donation processing

## How It Works

### Shop Page Integration

1. User fills out the order form with item details and shipping information
2. User clicks "Pay with Square" button
3. Square payment modal opens with:
   - Order summary
   - Customer information form
   - Secure card payment form
4. User enters card details (handled securely by Square)
5. Payment is processed through Square API
6. Confirmation email is sent to customer and admin

### Donations Page Integration

1. User selects donation amount and chooses "Square" payment method
2. Square payment modal opens with:
   - Donation amount
   - Donor information form
   - Secure card payment form
3. User enters card details and contact information
4. Payment is processed through Square API
5. Donation receipt is sent to donor

## Security Features

- **PCI Compliance:** Square handles all card data securely
- **HTTPS Required:** Square requires SSL certificate
- **API Keys:** Stored securely in configuration file
- **Amount Validation:** Server-side verification
- **Idempotency:** Prevents duplicate charges

## Transaction Logging

All transactions are logged in JSON files:
- `/logs/transactions/` - All payment transactions
- `/logs/orders/` - Shop orders specifically

Log format:
```json
{
  "transaction_id": "txn_1234567890_1234567890",
  "square_payment_id": "sq_payment_123",
  "type": "shop_order",
  "amount": 25.00,
  "status": "COMPLETED",
  "customer": {...},
  "items": [...],
  "timestamp": "2025-01-27T20:30:00Z"
}
```

## Email Notifications

The system automatically sends:
- **Order confirmations** to customers
- **Donation receipts** to donors
- **Admin notifications** for all transactions

Email templates are built into the PHP code and can be customized in `/api/square-payment.php`.

## Production Deployment

### 1. Get Production Credentials

1. Log into your Square Dashboard
2. Go to Applications → Your App
3. Get your production credentials:
   - Application ID
   - Access Token
   - Location ID

### 2. Update Configuration

Edit `/api/square-config.php`:

```php
// Update with production credentials
define('SQUARE_PRODUCTION_APP_ID', 'sq0idp-xxxxx');
define('SQUARE_PRODUCTION_ACCESS_TOKEN', 'sq0atp-xxxxx');
define('SQUARE_PRODUCTION_LOCATION_ID', 'location-id');

// Change environment to production
define('SQUARE_ENVIRONMENT', 'production');
```

### 3. Update JavaScript

Edit `/src/assets/js/square-payments.js`:

```javascript
// Update with production Application ID
await window.squarePaymentHandler.initialize('sq0idp-xxxxx');
```

### 4. Test with Real Cards

- Use small amounts first
- Test with your own card
- Monitor transactions in Square Dashboard

## Webhook Setup (Optional)

To receive real-time payment updates:

1. In Square Dashboard, go to Webhooks
2. Add webhook URL: `https://yourdomain.com/api/square-webhook.php`
3. Select events: Payment Created, Payment Updated, Refund Created
4. Save webhook configuration

## Troubleshooting

### Common Issues

1. **"Square payment system is not available"**
   - Check that Square SDK is loaded
   - Verify Application ID is correct
   - Check browser console for errors

2. **Payment fails**
   - Check Square Dashboard for error details
   - Verify API credentials
   - Check server logs

3. **Emails not sending**
   - Check server mail configuration
   - Verify email addresses in config
   - Check spam folders

### Debug Mode

Enable debug logging by adding to `/api/square-config.php`:

```php
// Add this for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Support

For technical support:
- Check Square Developer Documentation
- Review server error logs
- Test with Square sandbox first

## File Structure

```
/api/
  square-config.php          # Configuration
  square-payment.php         # Payment processing
  square-webhook.php         # Webhook handler

/src/assets/js/
  square-payments.js         # Square SDK integration

/src/css/
  square-payments-enhanced.css # Payment form styles

/src/pages/
  shop.html                  # Shop page with Square integration
  donations.html             # Donations page with Square integration

/logs/
  transactions/              # Transaction logs
  orders/                    # Order logs
```

## Next Steps

1. Test thoroughly in sandbox environment
2. Get production Square credentials
3. Update configuration for production
4. Test with real cards (small amounts)
5. Monitor transactions in Square Dashboard
6. Set up webhook notifications (optional)

The Square payment integration is now ready for use! 🎉
