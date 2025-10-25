/**
 * Square Web Payments SDK Integration
 * GI Associates Foundation
 * 
 * Handles Square payment forms and processing
 */

// Global state object to replace class instance variables
const squarePaymentState = {
    appId: '',
    environment: 'sandbox',
    payments: null,
    card: null,
    isInitialized: false,
    currentModal: null
};

/**
 * Initialize Square Web Payments SDK
 */
async function initializeSquareSDK(appId, environment = 'sandbox') {
    console.log('🔧 [DEBUG] Starting Square SDK initialization...');
    console.log('🔧 [DEBUG] App ID:', appId);
    console.log('🔧 [DEBUG] Environment:', environment);
    
    squarePaymentState.appId = appId;
    squarePaymentState.environment = environment;
    
    try {
        // Load Square Web Payments SDK
        console.log('🔧 [DEBUG] Checking if Square SDK is loaded...');
        console.log('🔧 [DEBUG] window.Square exists:', !!window.Square);
        
        if (!window.Square) {
            console.log('🔧 [DEBUG] Square SDK not found, loading...');
            await loadSquareSDK();
            console.log('🔧 [DEBUG] Square SDK loaded successfully');
        } else {
            console.log('🔧 [DEBUG] Square SDK already loaded');
        }
        
        console.log('🔧 [DEBUG] window.Square after loading:', !!window.Square);
        console.log('🔧 [DEBUG] window.Square.payments function exists:', typeof window.Square.payments);
        
        // Initialize Square payments with the correct environment
        console.log('🔧 [DEBUG] Creating Square payments instance...');
        squarePaymentState.payments = window.Square.payments(squarePaymentState.appId, squarePaymentState.environment);
        console.log('🔧 [DEBUG] Square payments instance created:', !!squarePaymentState.payments);
        
        squarePaymentState.isInitialized = true;
        console.log('✅ [DEBUG] Square Payments SDK initialized successfully');
        console.log('✅ [DEBUG] Environment:', squarePaymentState.environment);
        console.log('✅ [DEBUG] isInitialized:', squarePaymentState.isInitialized);
    } catch (error) {
        console.error('❌ [DEBUG] Failed to initialize Square Payments SDK:', error);
        console.error('❌ [DEBUG] Error details:', {
            message: error.message,
            stack: error.stack,
            appId: squarePaymentState.appId,
            environment: squarePaymentState.environment,
            squareExists: !!window.Square
        });
        throw error;
    }
}

/**
 * Load Square Web Payments SDK
 */
function loadSquareSDK() {
    console.log('🔧 [DEBUG] Loading Square SDK script...');
    return new Promise((resolve, reject) => {
        if (window.Square) {
            console.log('🔧 [DEBUG] Square SDK already exists, resolving immediately');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://web.squarecdn.com/v1/square.js';
        script.onload = () => {
            console.log('🔧 [DEBUG] Square SDK script loaded successfully');
            console.log('🔧 [DEBUG] window.Square after script load:', !!window.Square);
            resolve();
        };
        script.onerror = (error) => {
            console.error('❌ [DEBUG] Failed to load Square SDK script:', error);
            reject(error);
        };
        document.head.appendChild(script);
        console.log('🔧 [DEBUG] Square SDK script added to document head');
    });
}

/**
 * Create Square payment form
 */
async function createPaymentForm(containerId) {
    console.log('🔧 [DEBUG] Creating payment form for container:', containerId);
    console.log('🔧 [DEBUG] isInitialized:', squarePaymentState.isInitialized);
    console.log('🔧 [DEBUG] payments object exists:', !!squarePaymentState.payments);
    console.log('🔧 [DEBUG] appId:', squarePaymentState.appId);
    console.log('🔧 [DEBUG] environment:', squarePaymentState.environment);
    
    if (!squarePaymentState.isInitialized) {
        console.error('❌ [DEBUG] SDK not initialized - throwing error');
        throw new Error('Square Payments SDK not initialized. Please ensure the configuration is loaded correctly.');
    }

    if (!squarePaymentState.payments) {
        console.error('❌ [DEBUG] Payments object not available - throwing error');
        throw new Error('Square payments object not available. Please check your Square configuration.');
    }

    try {
        console.log('🔧 [DEBUG] Creating card payment method...');
        // Create card payment method
        squarePaymentState.card = await squarePaymentState.payments.card();
        console.log('🔧 [DEBUG] Card payment method created:', !!squarePaymentState.card);
        
        console.log('🔧 [DEBUG] Attaching card to container:', `#${containerId}`);
        await squarePaymentState.card.attach(`#${containerId}`);
        console.log('✅ [DEBUG] Square payment form created successfully');
        return squarePaymentState.card;
    } catch (error) {
        console.error('❌ [DEBUG] Failed to create payment form:', error);
        console.error('❌ [DEBUG] Error details:', {
            message: error.message,
            stack: error.stack,
            containerId: containerId,
            isInitialized: squarePaymentState.isInitialized,
            paymentsExists: !!squarePaymentState.payments
        });
        
        if (error.message && error.message.includes('Application ID')) {
            throw new Error('Invalid Square Application ID. Please check your Square configuration.');
        } else if (error.message && error.message.includes('environment')) {
            throw new Error('Invalid Square environment. Please check your Square configuration.');
        } else {
            throw new Error(`Failed to create payment form: ${error.message}`);
        }
    }
}

/**
 * Process payment
 */
async function processPayment(paymentData) {
    if (!squarePaymentState.card) {
        throw new Error('Payment form not created');
    }

    try {
        // Tokenize the card
        const result = await squarePaymentState.card.tokenize();
        
        if (result.status === 'OK') {
            // Send payment to backend
            const response = await sendPaymentToBackend({
                source_id: result.token,
                amount: paymentData.amount,
                type: paymentData.type,
                customer: paymentData.customer,
                items: paymentData.items,
                note: paymentData.note
            });

            return response;
        } else {
            throw new Error(result.errors[0].detail || 'Payment tokenization failed');
        }
    } catch (error) {
        console.error('Payment processing failed:', error);
        throw error;
    }
}

/**
 * Send payment data to backend
 */
async function sendPaymentToBackend(paymentData) {
    const response = await fetch('/api/square-payment.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
    }

    return result;
}

/**
 * Show payment modal for shop orders
 */
async function showShopPaymentModal(cartData) {
    const modal = createPaymentModal('shop', {
        title: 'Complete Your Order',
        amount: cartData.total,
        items: cartData.items,
        customer: cartData.customer
    });

    document.body.appendChild(modal);
    squarePaymentState.currentModal = modal;

    // Initialize payment form
    await initializePaymentForm(modal, 'shop');
}

/**
 * Show payment modal for donations
 */
async function showDonationPaymentModal(donationData) {
    console.log('🔧 [DEBUG] showDonationPaymentModal called with data:', donationData);
    console.log('🔧 [DEBUG] Current handler state:', {
        isInitialized: squarePaymentState.isInitialized,
        paymentsExists: !!squarePaymentState.payments,
        appId: squarePaymentState.appId,
        environment: squarePaymentState.environment
    });
    
    const modal = createPaymentModal('donation', {
        title: 'Complete Your Donation',
        amount: donationData.amount,
        customer: donationData.customer,
        note: donationData.note
    });

    document.body.appendChild(modal);
    squarePaymentState.currentModal = modal;

    // Initialize payment form
    console.log('🔧 [DEBUG] About to initialize payment form...');
    await initializePaymentForm(modal, 'donation');
}

/**
 * Create payment modal HTML
 */
function createPaymentModal(type, data) {
    const modal = document.createElement('div');
    modal.className = 'square-payment-modal-overlay';
    modal.innerHTML = `
        <div class="square-payment-modal">
            <div class="square-payment-header">
                <h3>${data.title}</h3>
                <button class="square-payment-close" onclick="this.closest('.square-payment-modal-overlay').remove()">×</button>
            </div>
            <div class="square-payment-content">
                <div class="payment-summary">
                    <div class="payment-amount">
                        <span class="amount-label">Amount:</span>
                        <span class="amount-value">$${data.amount.toFixed(2)}</span>
                    </div>
                    <div class="payment-type">
                        <span class="type-label">Type:</span>
                        <span class="type-value">${type === 'shop' ? 'Shop Order' : 'Donation'}</span>
                    </div>
                </div>
                
                <form class="square-payment-form" id="square-payment-form">
                    ${buildCustomerForm(data.customer)}
                    <div class="card-container">
                        <label for="card-container">Card Information</label>
                        <div id="card-container"></div>
                    </div>
                    <div class="payment-actions">
                        <button type="submit" class="square-payment-button" id="square-pay-button">
                            Pay $${data.amount.toFixed(2)}
                        </button>
                        <button type="button" class="square-cancel-button" onclick="this.closest('.square-payment-modal-overlay').remove()">
                            Cancel
                        </button>
                    </div>
                </form>
                
                <div class="payment-security">
                    <p>🔒 Your payment information is secure and encrypted</p>
                </div>
            </div>
        </div>
    `;

    return modal;
}

/**
 * Build customer information form
 */
function buildCustomerForm(customer = {}) {
    return `
        <div class="form-group">
            <label for="customer-name">Full Name *</label>
            <input type="text" id="customer-name" name="customer-name" value="${customer.name || ''}" required>
        </div>
        <div class="form-group">
            <label for="customer-email">Email Address *</label>
            <input type="email" id="customer-email" name="customer-email" value="${customer.email || ''}" required>
        </div>
        ${customer.address ? `
            <div class="form-group">
                <label for="customer-address">Address</label>
                <input type="text" id="customer-address" name="customer-address" value="${customer.address}" readonly>
            </div>
        ` : ''}
    `;
}

/**
 * Initialize payment form in modal
 */
async function initializePaymentForm(modal, type) {
    console.log('🔧 [DEBUG] initializePaymentForm called with type:', type);
    console.log('🔧 [DEBUG] Modal element:', modal);
    console.log('🔧 [DEBUG] Current handler state before createPaymentForm:', {
        isInitialized: squarePaymentState.isInitialized,
        paymentsExists: !!squarePaymentState.payments,
        appId: squarePaymentState.appId,
        environment: squarePaymentState.environment
    });
    
    try {
        // Create payment form
        console.log('🔧 [DEBUG] About to call createPaymentForm...');
        await createPaymentForm('card-container');
        console.log('✅ [DEBUG] createPaymentForm completed successfully');
        
        // Handle form submission
        const form = modal.querySelector('#square-payment-form');
        const payButton = modal.querySelector('#square-pay-button');
        console.log('🔧 [DEBUG] Form elements found:', {
            form: !!form,
            payButton: !!payButton
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable button and show loading
            payButton.disabled = true;
            payButton.textContent = 'Processing...';
            
            try {
                // Collect form data
                const formData = new FormData(form);
                const customer = {
                    name: formData.get('customer-name'),
                    email: formData.get('customer-email'),
                    address: formData.get('customer-address')
                };
                
                // Get amount from modal data
                const amountElement = modal.querySelector('.amount-value');
                const amount = parseFloat(amountElement.textContent.replace('$', ''));
                
                // Process payment
                const result = await processPayment({
                    amount: amount,
                    type: type,
                    customer: customer,
                    items: type === 'shop' ? getCartItems() : null,
                    note: type === 'donation' ? 'GI Associates Foundation Donation' : 'Shop Order'
                });
                
                // Show success message
                showSuccessMessage(result, type);
                
                // Close modal
                modal.remove();
                
            } catch (error) {
                showErrorMessage(error.message);
                payButton.disabled = false;
                payButton.textContent = `Pay $${amount.toFixed(2)}`;
            }
        });
        
    } catch (error) {
        console.error('❌ [DEBUG] Failed to initialize payment form:', error);
        console.error('❌ [DEBUG] Error details:', {
            message: error.message,
            stack: error.stack,
            type: type,
            isInitialized: squarePaymentState.isInitialized,
            paymentsExists: !!squarePaymentState.payments
        });
        showErrorMessage(`Failed to initialize payment form: ${error.message}`);
    }
}

/**
 * Get cart items from Snipcart (if available)
 */
function getCartItems() {
    if (window.Snipcart && window.Snipcart.api) {
        try {
            const cart = window.Snipcart.api.cart.get();
            return cart.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));
        } catch (error) {
            console.warn('Could not get Snipcart items:', error);
            return [];
        }
    }
    return [];
}

/**
 * Show success message
 */
function showSuccessMessage(result, type) {
    const message = type === 'shop' 
        ? `Order confirmed! Transaction ID: ${result.transaction_id}`
        : `Thank you for your donation! Transaction ID: ${result.transaction_id}`;
        
    showMessage('Success', message, 'success');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    showMessage('Error', message, 'error');
}

/**
 * Show message modal
 */
function showMessage(title, message, type) {
    const modal = document.createElement('div');
    modal.className = 'square-message-modal-overlay';
    modal.innerHTML = `
        <div class="square-message-modal">
            <div class="square-message-header">
                <div class="square-message-icon" style="background-color: ${type === 'success' ? '#10B981' : '#EF4444'}">
                    ${type === 'success' ? '✓' : '✕'}
                </div>
                <h3>${title}</h3>
                <button class="square-message-close" onclick="this.closest('.square-message-modal-overlay').remove()">×</button>
            </div>
            <div class="square-message-content">
                <p>${message}</p>
            </div>
            <div class="square-message-actions">
                <button class="square-message-btn" onclick="this.closest('.square-message-modal-overlay').remove()">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-close success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
    }
}

/**
 * Close current modal
 */
function closeModal() {
    if (squarePaymentState.currentModal) {
        squarePaymentState.currentModal.remove();
        squarePaymentState.currentModal = null;
    }
}

// Global Square payment handler object (for backward compatibility)
window.squarePaymentHandler = {
    initialize: initializeSquareSDK,
    showShopPaymentModal: showShopPaymentModal,
    showDonationPaymentModal: showDonationPaymentModal,
    closeModal: closeModal
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 [DEBUG] DOMContentLoaded event fired');
    console.log('🔧 [DEBUG] window.squarePaymentHandler exists:', !!window.squarePaymentHandler);
    
    try {
        // Get Square configuration
        console.log('🔧 [DEBUG] Fetching Square configuration from /api/square-config.php...');
        const response = await fetch('/api/square-config.php');
        
        console.log('🔧 [DEBUG] Configuration response status:', response.status);
        console.log('🔧 [DEBUG] Configuration response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`Configuration API returned ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        console.log('🔧 [DEBUG] Configuration received:', config);
        
        if (config && config.app_id && config.environment) {
            console.log('🔧 [DEBUG] Configuration is valid, initializing Square handler...');
            console.log('🔧 [DEBUG] App ID:', config.app_id);
            console.log('🔧 [DEBUG] Environment:', config.environment);
            
            await initializeSquareSDK(config.app_id, config.environment);
            console.log('✅ [DEBUG] Square payment system ready with environment:', config.environment);
        } else {
            console.error('❌ [DEBUG] Configuration incomplete:', {
                config: config,
                hasAppId: !!(config && config.app_id),
                hasEnvironment: !!(config && config.environment)
            });
            throw new Error('Square configuration incomplete - missing app_id or environment');
        }
    } catch (error) {
        console.error('❌ [DEBUG] Failed to initialize Square payment system:', error);
        console.error('❌ [DEBUG] Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response
        });
        
        // Show user-friendly error message
        if (window.showModernAlert) {
            window.showModernAlert('Payment System Error', 'Square payment system is not available. Please try again later.', 'error');
        }
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeSquareSDK,
        createPaymentForm,
        processPayment,
        showShopPaymentModal,
        showDonationPaymentModal,
        showMessage,
        closeModal
    };
}