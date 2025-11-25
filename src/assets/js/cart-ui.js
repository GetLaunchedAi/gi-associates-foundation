/* ============================================ */
/*                  Cart UI                    */
/* ============================================ */

// UI state
let cartUI = {
  isInitialized: false,
  sidebar: null,
  overlay: null,
  cartIcon: null,
  suppressNextOutsideClose: false,
  checkoutFormSubmitted: false,
  squarePaymentInitialized: false,
  selectedPaymentMethod: 'card',
  checkoutReference: '',
  checkoutContainer: null
};

const MIN_DONATION = window.cart?.config?.minDonation || 1;
const CASH_APP_HANDLE = '$Supremework';
const CASH_APP_URL = `https://cash.app/${CASH_APP_HANDLE.replace('$', '')}`;
const CASH_APP_QR_URL = `https://chart.googleapis.com/chart?chs=320x320&cht=qr&chl=${encodeURIComponent(CASH_APP_URL)}`;
const ZELLE_EMAIL = 'helpinghandsministry1969@yahoo.com';
const ZELLE_PHONE = '(248) 678-5685';

const PAYMENT_METHODS = {
  card: {
    id: 'card',
    label: 'Credit / Debit Card',
    hint: 'Pay securely via Square'
  },
  cashapp: {
    id: 'cashapp',
    label: 'Cash App',
    hint: 'Instant transfer with QR or $Cashtag',
    handle: CASH_APP_HANDLE,
    url: CASH_APP_URL,
    qr: CASH_APP_QR_URL
  },
  zelle: {
    id: 'zelle',
    label: 'Zelle',
    hint: 'Send directly from your bank',
    email: ZELLE_EMAIL,
    phone: ZELLE_PHONE
  }
};

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `$${value.toFixed(2)}`;
}

function updateCheckoutValidation(validation) {
  const errorBox = document.getElementById('checkout-validation-error');
  if (errorBox) {
    if (validation.isValid) {
      errorBox.textContent = '';
      errorBox.style.display = 'none';
    } else {
      const firstError = validation.errors[0];
      const message = validation.isEmpty
        ? 'Add an item to continue.'
        : firstError
          ? `${firstError.title || 'Item'}: ${firstError.message}`
          : 'Please review your donation amounts.';
      errorBox.textContent = message;
      errorBox.style.display = 'block';
    }
  }

  const errorMap = new Map(
    validation.errors.map(err => [err.id, `${err.title || 'Item'}: ${err.message}`])
  );
  document.querySelectorAll('[data-checkout-error]').forEach(el => {
    const itemId = el.dataset.checkoutError;
    const message = errorMap.get(itemId);
    if (message) {
      el.textContent = message;
      el.style.display = 'block';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  });
}

function formatDonationInput(value) {
  return typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(2) : '';
}

function calculateLineTotal(item) {
  const donation = typeof item?.donationPerUnit === 'number' ? item.donationPerUnit : 0;
  const quantity = Math.max(1, parseInt(item?.quantity, 10) || 1);
  return donation * quantity;
}

function escapeSelector(value) {
  if (typeof value !== 'string') {
    value = String(value ?? '');
  }
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }
  return value.replace(/([^\w-])/g, '\\$1');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => {
    const lookup = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return lookup[char] || char;
  });
}

function focusCartDonationInput(itemId) {
  if (!itemId) return;
  const selector = `.cart-item__donation-input[data-item-id="${escapeSelector(itemId)}"]`;
  const input = document.querySelector(selector);
  if (input) {
    input.focus({ preventScroll: false });
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function generateCheckoutReference() {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `GI-${Date.now().toString(36).toUpperCase()}-${random}`;
}

function updateManualPaymentDisplays(amount, reference) {
  const amountText = formatCurrency(amount);
  document.querySelectorAll('[data-payment-amount]').forEach(el => {
    el.textContent = amountText;
  });
  document.querySelectorAll('[data-payment-reference]').forEach(el => {
    el.textContent = reference;
  });
}

function getManualInstructionList(method) {
  if (method === 'cashapp') {
    return `
      <li>Open Cash App on your phone.</li>
      <li>Enter <strong><span data-payment-amount></span></strong> as the payment amount.</li>
      <li>Send to <strong>${PAYMENT_METHODS.cashapp.handle}</strong>.</li>
      <li>Add a note that includes reference <strong><span data-payment-reference></span></strong>.</li>
      <li>Tap Pay to finish the transfer.</li>
    `;
  }
  return `
    <li>Open your bank or Zelle app.</li>
    <li>Choose Send and enter <strong>${PAYMENT_METHODS.zelle.email}</strong> or <strong>${PAYMENT_METHODS.zelle.phone}</strong>.</li>
    <li>Enter <strong><span data-payment-amount></span></strong> as the amount.</li>
    <li>Add a note that includes reference <strong><span data-payment-reference></span></strong>.</li>
    <li>Submit the transfer to complete your donation.</li>
  `;
}

function setSelectedPaymentMethod(method) {
  cartUI.selectedPaymentMethod = method;
  document.querySelectorAll('.payment-method').forEach(label => {
    const value = label.querySelector('input')?.value;
    if (value === method) {
      label.classList.add('payment-method--selected');
    } else {
      label.classList.remove('payment-method--selected');
    }
  });

  document.querySelectorAll('.payment-detail').forEach(section => {
    if (section.dataset.method === method) {
      section.classList.add('payment-detail--active');
    } else {
      section.classList.remove('payment-detail--active');
    }
  });

  const cardButton = document.getElementById('card-button');
  const altButton = document.getElementById('alt-pay-button');
  if (cardButton) {
    cardButton.style.display = method === 'card' ? 'block' : 'none';
  }
  if (altButton) {
    const label =
      method === 'cashapp'
        ? 'I Sent My Cash App Donation'
        : method === 'zelle'
          ? 'I Sent My Zelle Donation'
          : 'I Sent My Donation';
    altButton.style.display = method === 'card' ? 'none' : 'block';
    altButton.textContent = label;
  }

  if (method !== 'card') {
    cartUI.squarePaymentInitialized = false;
    const cardContainer = document.getElementById('card-container');
    const status = document.getElementById('payment-status');
    if (cardContainer) cardContainer.innerHTML = '';
    if (status) status.textContent = '';
  }

  updateCheckoutTotals();
}

// ====== CART UI INITIALIZATION ======

function initCartUI() {
  if (cartUI.isInitialized) return;
  
  createCartSidebar();
  createCartOverlay();
  updateCartIcon();
  setupCartEventListeners();
  
  cartUI.isInitialized = true;
}

function createCartSidebar() {
  // Remove existing sidebar if it exists
  const existingSidebar = document.getElementById('cart-sidebar');
  if (existingSidebar) {
    existingSidebar.remove();
  }

  const sidebar = document.createElement('div');
  sidebar.id = 'cart-sidebar';
  sidebar.className = 'cart-sidebar';
  sidebar.innerHTML = getCartSidebarHTML();
  
  document.body.appendChild(sidebar);
  cartUI.sidebar = sidebar;
}

function createCartOverlay() {
  // Remove existing overlay if it exists
  const existingOverlay = document.getElementById('cart-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'cart-overlay';
  overlay.className = 'cart-overlay';
  overlay.innerHTML = getCartOverlayHTML();
  
  document.body.appendChild(overlay);
  cartUI.overlay = overlay;
}

// ====== CART HTML TEMPLATES ======

function getCartSidebarHTML() {
  return `
    <div class="cart-sidebar__header">
      <h3 class="cart-sidebar__title">Your Cart</h3>
      <button class="cart-sidebar__close" onclick="closeCart()" aria-label="Close cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="cart-sidebar__content">
      <div class="cart-items" id="cart-items-list">
        <!-- Cart items will be rendered here -->
      </div>
      <div class="cart-empty" id="cart-empty-state" style="display: none;">
        <div class="cart-empty__icon">🛒</div>
        <p class="cart-empty__message">Your cart is empty</p>
        <p class="cart-empty__submessage">Add some items to get started</p>
      </div>
    </div>
    <div class="cart-sidebar__footer">
      <div class="cart-total">
        <div class="cart-total__items">${getItemCount()} items</div>
        <div class="cart-total__amount" id="cart-total-amount">${formatCurrency(0)}</div>
      </div>
      <div class="cart-validation-error" id="cart-validation-error"></div>
      <button type="button" class="cart-checkout-btn" id="cart-checkout-btn">
        Proceed to Checkout
      </button>
    </div>
  `;
}

function getCartOverlayHTML() {
  return `
    <div class="cart-overlay__header">
      <button class="cart-overlay__back" onclick="closeCart()" aria-label="Close cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12,19 5,12 12,5"></polyline>
        </svg>
      </button>
      <h3 class="cart-overlay__title">Your Cart</h3>
      <div></div>
    </div>
    <div class="cart-overlay__content">
      <div class="cart-items" id="cart-items-list-mobile">
        <!-- Cart items will be rendered here -->
      </div>
      <div class="cart-empty" id="cart-empty-state-mobile" style="display: none;">
        <div class="cart-empty__icon">🛒</div>
        <p class="cart-empty__message">Your cart is empty</p>
        <p class="cart-empty__submessage">Add some items to get started</p>
      </div>
    </div>
    <div class="cart-overlay__footer">
      <div class="cart-total">
        <div class="cart-total__items">${getItemCount()} items</div>
        <div class="cart-total__amount" id="cart-total-amount-mobile">${formatCurrency(0)}</div>
      </div>
      <div class="cart-validation-error" id="cart-validation-error-mobile"></div>
      <button type="button" class="cart-checkout-btn" id="cart-checkout-btn-mobile">
        Proceed to Checkout
      </button>
    </div>
  `;
}

// ====== CART UI FUNCTIONS ======

function openCart() {
  // Ensure cart UI is initialized
  if (!cartUI.isInitialized) {
    initCartUI();
  }
  
  cartState.isOpen = true;
  
  if (window.innerWidth <= 768) {
    // Mobile: Show full-screen overlay
    if (cartUI.overlay) {
      cartUI.overlay.classList.add('cart-overlay--open');
    }
    document.body.classList.add('cart-open');
    document.documentElement.classList.add('cart-open');
  } else {
    // Desktop: Show sidebar
    if (cartUI.sidebar) {
      cartUI.sidebar.classList.add('cart-sidebar--open');
    }
    document.body.classList.add('cart-open');
    document.documentElement.classList.add('cart-open');
  }
  
  renderCartItems();
  updateCartTotals();
  
  // Setup checkout button event listeners after cart is opened
  setTimeout(() => {
    setupCheckoutButtons();
  }, 50);
}

function closeCart() {
  cartState.isOpen = false;
  
  // Safely remove classes only if elements exist
  if (cartUI.sidebar) {
    cartUI.sidebar.classList.remove('cart-sidebar--open');
  }
  if (cartUI.overlay) {
    cartUI.overlay.classList.remove('cart-overlay--open');
  }
  document.body.classList.remove('cart-open');
  document.documentElement.classList.remove('cart-open');
  // Also clear any inline scroll locks that may have been applied elsewhere
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

function toggleCart() {
  if (cartState.isOpen) {
    closeCart();
  } else {
    openCart();
  }
}

// ====== CART RENDERING ======

function renderCartItems() {
  const desktopList = document.getElementById('cart-items-list');
  const mobileList = document.getElementById('cart-items-list-mobile');
  const desktopEmpty = document.getElementById('cart-empty-state');
  const mobileEmpty = document.getElementById('cart-empty-state-mobile');
  const validation = cart.validateCart();
  const errorMap = new Map(validation.errors.map(error => [error.id, error.message]));
  const activeElement = document.activeElement;
  const activeDonationId = activeElement?.classList?.contains('cart-item__donation-input')
    ? activeElement.dataset.itemId
    : null;
  const caretPosition =
    activeDonationId && typeof activeElement.selectionStart === 'number'
      ? activeElement.selectionStart
      : null;
  
  if (isCartEmpty()) {
    // Show empty state
    if (desktopList) desktopList.style.display = 'none';
    if (mobileList) mobileList.style.display = 'none';
    if (desktopEmpty) desktopEmpty.style.display = 'block';
    if (mobileEmpty) mobileEmpty.style.display = 'block';
  } else {
    // Show items
    if (desktopList) desktopList.style.display = 'block';
    if (mobileList) mobileList.style.display = 'block';
    if (desktopEmpty) desktopEmpty.style.display = 'none';
    if (mobileEmpty) mobileEmpty.style.display = 'none';
    
    const itemsHTML = cartState.items
      .map(item => getCartItemHTML(item, errorMap.get(item.id)))
      .join('');
    
    if (desktopList) desktopList.innerHTML = itemsHTML;
    if (mobileList) mobileList.innerHTML = itemsHTML;

    if (activeDonationId) {
      const selector = `.cart-item__donation-input[data-item-id="${escapeSelector(activeDonationId)}"]`;
      const nextInput = document.querySelector(selector);
      if (nextInput) {
        nextInput.focus({ preventScroll: true });
        if (caretPosition !== null && nextInput.setSelectionRange) {
          try {
            nextInput.setSelectionRange(caretPosition, caretPosition);
          } catch (error) {
            // Ignore selection errors in older browsers
          }
        }
      }
    }
  }
}

function getCartItemHTML(item, errorMessage = '') {
  const donationValue = formatDonationInput(item.donationPerUnit);
  const lineTotal = calculateLineTotal(item);
  const lineTotalDisplay = formatCurrency(lineTotal);
  const safeId = escapeHtml(item.id);
  const safeTitle = escapeHtml(item.title);
  const safeDescription = escapeHtml(item.description);
  const safeImage = escapeHtml(item.image);
  // Use single quotes in onclick to avoid conflicts with double-quoted HTML attributes
  const itemIdParam = `'${safeId}'`;
  return `
    <div class="cart-item" data-item-id="${safeId}">
      <div class="cart-item__image">
        <img src="${safeImage}" alt="${safeTitle}" loading="lazy">
      </div>
      <div class="cart-item__details">
        <h4 class="cart-item__title">${safeTitle}</h4>
        <p class="cart-item__description">${safeDescription}</p>
        <div class="cart-item__quantity">
          <button class="cart-item__qty-btn" onclick="event.preventDefault(); event.stopPropagation(); updateItemQuantity(${itemIdParam}, ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
          <span class="cart-item__qty-value">${item.quantity}</span>
          <button class="cart-item__qty-btn" onclick="event.preventDefault(); event.stopPropagation(); updateItemQuantity(${itemIdParam}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item__donation">
          <label class="cart-item__donation-label">Donation per item</label>
          <div class="cart-item__donation-input-group">
            <span class="cart-item__donation-currency">$</span>
            <input
              type="number"
              class="cart-item__donation-input"
              data-item-id="${safeId}"
              min="${MIN_DONATION}"
              step="0.01"
              placeholder="${MIN_DONATION.toFixed(2)}"
              value="${donationValue}"
              onchange="handleCartDonationChange(${itemIdParam}, this.value)"
            />
          </div>
          <div class="cart-item__line-total" data-line-total="${safeId}">
            Line total: ${lineTotalDisplay}
          </div>
          <div class="cart-item__donation-error" data-cart-error="${safeId}">
            ${errorMessage || ''}
          </div>
        </div>
      </div>
      <button class="cart-item__remove" onclick="event.preventDefault(); event.stopPropagation(); removeFromCart(${itemIdParam})" aria-label="Remove item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"></polyline>
          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
        </svg>
      </button>
    </div>
  `;
}

function updateCartTotals() {
  const summary = cart.getCartSummary();
  const totalAmount = summary.totalDonation || 0;
  const itemCount = summary.itemCount || 0;
  const validation = cart.validateCart();
  const firstError = validation.errors[0];
  const validationMessage = validation.isEmpty
    ? 'Add an item to continue.'
    : firstError
      ? `${firstError.title || 'Item'}: ${firstError.message}`
      : '';
  
  // Update desktop elements
  const desktopTotal = document.getElementById('cart-total-amount');
  const desktopItems = document.querySelector('.cart-sidebar .cart-total__items');
  
  if (desktopTotal) desktopTotal.textContent = formatCurrency(totalAmount);
  if (desktopItems) desktopItems.textContent = `${itemCount} items`;
  
  // Update mobile elements
  const mobileTotal = document.getElementById('cart-total-amount-mobile');
  const mobileItems = document.querySelector('.cart-overlay .cart-total__items');
  
  if (mobileTotal) mobileTotal.textContent = formatCurrency(totalAmount);
  if (mobileItems) mobileItems.textContent = `${itemCount} items`;

  const validationEls = [
    document.getElementById('cart-validation-error'),
    document.getElementById('cart-validation-error-mobile')
  ];
  validationEls.forEach(el => {
    if (!el) return;
    if (validation.isValid) {
      el.textContent = '';
      el.style.display = 'none';
    } else {
      el.textContent = validationMessage;
      el.style.display = 'block';
    }
  });

  const checkoutButtons = [
    document.getElementById('cart-checkout-btn'),
    document.getElementById('cart-checkout-btn-mobile')
  ];
  checkoutButtons.forEach(btn => {
    if (!btn) return;
    btn.disabled = !validation.isValid;
    btn.setAttribute('aria-disabled', String(!validation.isValid));
  });
  
  // Update cart icon
  updateCartIcon();
}

function updateCartIcon() {
  const cartIcon = document.querySelector('.cart-btn');
  // Use more specific selector to find badge
  const badge = document.querySelector('#navigation .cart-btn .badge') || 
                document.querySelector('.cart-btn .badge') || 
                document.querySelector('.badge');
  
  if (cartIcon) {
    cartIcon.setAttribute('type', 'button');
    
    // Remove existing listeners to prevent duplicates
    cartIcon.removeEventListener('click', handleCartIconClick);
    cartIcon.addEventListener('click', handleCartIconClick, { capture: true });
  }
  
  if (badge) {
    const count = getItemCount();
    const MAX_BADGE_COUNT = 99;
    const display = count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : `${count}`;

    badge.textContent = count > 0 ? display : '';
    // Use flex to match CSS - inline style overrides CSS :empty rule
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.setAttribute('aria-label', count > 0 ? `${count} items in cart` : 'Cart is empty');
    badge.setAttribute('title', count > 0 ? `${count} items in cart` : 'Cart is empty');
  }
}

function handleCartIconClick(e) {
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  toggleCart();
}

// ====== TOAST NOTIFICATION ======

function showToast(message, type = 'success') {
  // Remove existing toast if any
  const existingToast = document.getElementById('cart-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.className = `cart-toast cart-toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  toast.innerHTML = `
    <div class="cart-toast__content">
      <svg class="cart-toast__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span class="cart-toast__message">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('cart-toast--show');
  });

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('cart-toast--show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300); // Wait for fade-out animation
  }, 3000);
}

// ====== EVENT HANDLERS ======

function handleCartDonationChange(productId, value) {
  cart.setItemDonation(productId, value);
  renderCartItems();
  updateCartTotals();
}

function handleCheckoutDonationChange(productId, value) {
  cart.setItemDonation(productId, value);
  updateCheckoutTotals();
}

function handleCheckout() {
  const validation = cart.validateCart();
  if (!validation.isValid) {
    renderCartItems();
    updateCartTotals();
    const firstErrorId = validation.errors[0]?.id;
    if (firstErrorId) {
      focusCartDonationInput(firstErrorId);
    }
    showToast('Enter a donation amount for each item before checkout.', 'error');
    return;
  }

  // Open inline checkout inside the cart panel
  if (!cartUI.isInitialized) {
    initCartUI();
  }
  
  // Check screen width to select correct container (matching openCart logic)
  let container;
  if (window.innerWidth <= 768) {
    // Mobile: Use overlay
    container = cartUI.overlay;
  } else {
    // Desktop: Use sidebar
    container = cartUI.sidebar;
  }
  
  if (!container) return;

  // Find the scrollable content area to host the checkout panel (keep footer pinned)
  const content = container.querySelector('.cart-sidebar__content') || container.querySelector('.cart-overlay__content');
  if (!content) return;

  // Mark container as being in checkout mode so we can adjust UI (e.g., hide footer)
  container.classList.add('cart-has-checkout');

  // Suppress the outside-click close for this interaction cycle
  cartUI.suppressNextOutsideClose = true;
  
  // Reset form submission flag and Square payment initialization flag
  cartUI.checkoutFormSubmitted = false;
  cartUI.squarePaymentInitialized = false;
  cartUI.selectedPaymentMethod = 'card';
  cartUI.checkoutReference = generateCheckoutReference();

  content.innerHTML = getCheckoutPanelHTML();
  cartUI.checkoutContainer = content;
  attachCheckoutEventHandlers();
  updateCheckoutTotals();

  // Smoothly reveal the checkout panel without closing the cart
  const panel = content.querySelector('.checkout-panel');
  if (panel) {
    requestAnimationFrame(() => {
      panel.classList.add('checkout-panel--open');
      const firstField = panel.querySelector('#co-name');
      if (firstField && typeof firstField.focus === 'function') {
        firstField.focus();
      }
    });
  }
}

// ====== EVENT LISTENERS ======

function setupCartEventListeners() {
  // Listen for cart updates
  onCartUpdated(() => {
    renderCartItems();
    updateCartTotals();
    updateCartIcon(); // Ensure cart icon is updated on every cart change
    if (document.querySelector('.checkout-panel')) {
      updateCheckoutTotals();
    }
  });
  
  // Listen for item added event to show toast
  cart.addCartEventListener('itemAdded', (data) => {
    const product = data.product;
    const productTitle = product.title || product.name || 'Item';
    showToast(`${productTitle} added to cart!`);
  });
  
  // Setup checkout button event listeners
  setupCheckoutButtons();
  
  // Listen for window resize to handle mobile/desktop switching
  window.addEventListener('resize', () => {
    if (cartState.isOpen) {
      // Close cart first to ensure clean state
      cartState.isOpen = false;
      if (cartUI.sidebar) {
        cartUI.sidebar.classList.remove('cart-sidebar--open');
      }
      if (cartUI.overlay) {
        cartUI.overlay.classList.remove('cart-overlay--open');
      }
      // Don't remove cart-open class yet, we'll reopen immediately
      
      setTimeout(() => {
        openCart(); // Reopen with correct layout
      }, 100);
    }
  });
  

  // Close cart when clicking outside
  document.addEventListener('click', (e) => {
    if (cartUI.suppressNextOutsideClose) {
      // Allow one click cycle without closing (e.g., after swapping in checkout panel)
      cartUI.suppressNextOutsideClose = false;
      return;
    }
    if (cartState.isOpen && 
        !e.target.closest('.cart-sidebar') && 
        !e.target.closest('.cart-overlay') &&
        !e.target.closest('.cart-btn')) {
      closeCart();
    }
  });
}

function setupCheckoutButtons() {
  // Helper function to attach checkout button handlers
  function attachCheckoutButtonHandler(buttonId) {
    const button = document.getElementById(buttonId);
    if (button && !button.dataset.listenerAttached) {
      // Mark as having listener attached to avoid duplicates
      button.dataset.listenerAttached = 'true';
      
      // Attach event listener with both click and touchend for mobile
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        handleCheckout();
      };
      
      button.addEventListener('click', handler, { passive: false });
      button.addEventListener('touchend', handler, { passive: false });
    }
  }
  
  // Attach handlers for both desktop and mobile buttons
  attachCheckoutButtonHandler('cart-checkout-btn');
  attachCheckoutButtonHandler('cart-checkout-btn-mobile');
}

// ====== GLOBAL FUNCTIONS ======

// Make functions globally available
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleCart = toggleCart;
window.handleCartDonationChange = handleCartDonationChange;
window.handleCheckoutDonationChange = handleCheckoutDonationChange;
window.handleCheckout = handleCheckout;
window.updateItemQuantity = (productId, quantity) => {
  cart.updateItemQuantity(productId, quantity);
  renderCartItems();
  updateCartTotals();
};

window.removeFromCart = (productId) => {
  cart.removeFromCart(productId);
  renderCartItems();
  updateCartTotals();
};

// Initialize cart UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCartUI();
    // Ensure cart icon is updated immediately after initialization
    setTimeout(updateCartIcon, 100);
  });
} else {
  initCartUI();
  // Ensure cart icon is updated immediately after initialization
  setTimeout(updateCartIcon, 100);
}

// ====== CHECKOUT INLINE PANEL ======

function getCheckoutPanelHTML() {
  const summary = cart.getCartSummary();
  const itemCount = summary.itemCount;
  const subtotal = summary.totalDonation || 0;
  const selectedMethod = cartUI.selectedPaymentMethod || 'card';
  const paymentReference = cartUI.checkoutReference || generateCheckoutReference();
  const estimatedAmount = cartState?.donationTotal || subtotal;
  const paymentOptions = Object.values(PAYMENT_METHODS)
    .map(method => {
      const isSelected = selectedMethod === method.id;
      return `
        <label class="payment-method ${isSelected ? 'payment-method--selected' : ''}">
          <input
            type="radio"
            name="payment-method"
            value="${method.id}"
            ${isSelected ? 'checked' : ''}
            aria-label="${method.label}"
          />
          <div class="payment-method__details">
            <span class="payment-method__label">${method.label}</span>
            <span class="payment-method__hint">${method.hint}</span>
          </div>
        </label>
      `;
    })
    .join('');
  const altButtonVisible = selectedMethod !== 'card';
  const altButtonLabel =
    selectedMethod === 'cashapp'
      ? 'I Sent My Cash App Donation'
      : selectedMethod === 'zelle'
        ? 'I Sent My Zelle Donation'
        : 'I Sent My Donation';
  const itemsMarkup = summary.items.length
      ? summary.items.map(item => {
        const safeTitle = escapeHtml(item.title);
        const donationValue = formatDonationInput(item.donationPerUnit);
        const lineTotal = formatCurrency(item.lineTotal || 0);
        const safeId = escapeHtml(item.id);
        // Use single quotes in onclick to avoid conflicts with double-quoted HTML attributes
        const itemIdParam = `'${safeId}'`;
        return `
          <div class="checkout-item" data-checkout-item="${safeId}">
            <div class="checkout-item__info">
              <p class="checkout-item__title">${safeTitle}</p>
              <p class="checkout-item__qty">Qty ${item.quantity}</p>
            </div>
            <div class="checkout-item__donation">
              <label>Donation per item</label>
              <div class="checkout-item__donation-input-group">
                <span class="checkout-item__donation-currency">$</span>
                <input
                  type="number"
                  class="checkout-donation-input"
                  data-item-id="${safeId}"
                  min="${MIN_DONATION}"
                  step="0.01"
                  placeholder="${MIN_DONATION.toFixed(2)}"
                  value="${donationValue}"
                  onchange="handleCheckoutDonationChange(${itemIdParam}, this.value)"
                />
              </div>
              <div class="checkout-item__line-total" data-checkout-line="${safeId}">
                Line total: ${lineTotal}
              </div>
              <div class="checkout-item__error" data-checkout-error="${safeId}"></div>
            </div>
          </div>
        `;
      }).join('')
    : '<p class="checkout-empty">Your cart is empty.</p>';
  return `
    <div class="checkout-panel">
      <div class="checkout-panel__section">
        <h4 class="checkout-panel__title">Contact & Shipping</h4>
        <div class="checkout-form">
          <div class="checkout-field">
            <input id="co-name" class="checkout-input" type="text" placeholder="Full name" autocomplete="name">
            <span class="checkout-error" id="co-name-error"></span>
          </div>
          <div class="checkout-field">
            <input id="co-email" class="checkout-input" type="email" placeholder="Email" autocomplete="email">
            <span class="checkout-error" id="co-email-error"></span>
          </div>
          <div class="checkout-field">
            <input id="co-address" class="checkout-input" type="text" placeholder="Address" autocomplete="address-line1">
            <span class="checkout-error" id="co-address-error"></span>
          </div>
          <div class="checkout-row">
            <div class="checkout-field">
              <input id="co-city" class="checkout-input" type="text" placeholder="City" autocomplete="address-level2">
              <span class="checkout-error" id="co-city-error"></span>
            </div>
            <div class="checkout-field">
              <input id="co-state" class="checkout-input" type="text" placeholder="State" maxlength="2" autocomplete="address-level1">
              <span class="checkout-error" id="co-state-error"></span>
            </div>
            <div class="checkout-field">
              <input id="co-zip" class="checkout-input" type="text" placeholder="ZIP" autocomplete="postal-code">
              <span class="checkout-error" id="co-zip-error"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="checkout-panel__section">
        <h4 class="checkout-panel__title">Order Summary</h4>
        <div class="checkout-items">
          ${itemsMarkup}
        </div>
        <div class="checkout-validation-error" id="checkout-validation-error"></div>
        <div class="checkout-summary">
          <div class="checkout-line"><span>${itemCount} items</span></div>
          <div class="checkout-line"><span>Subtotal</span><span id="co-subtotal">${formatCurrency(subtotal)}</span></div>
          <div class="checkout-line"><span>Tax</span><span id="co-tax">${formatCurrency(0)}</span></div>
          <div class="checkout-total"><span>Total</span><span id="co-total">${formatCurrency(subtotal)}</span></div>
        </div>
      </div>

      <div class="checkout-panel__section">
        <h4 class="checkout-panel__title">Payment</h4>
        <div class="payment-methods" role="radiogroup" aria-label="Payment method">
          ${paymentOptions}
        </div>
        <div class="payment-details">
          <div class="payment-detail ${selectedMethod === 'card' ? 'payment-detail--active' : ''}" data-method="card">
            <p class="payment-detail__subtitle">Pay securely through Square using any major credit or debit card.</p>
            <div id="card-container"></div>
            <div id="payment-status" class="checkout-status"></div>
          </div>
          <div class="payment-detail ${selectedMethod === 'cashapp' ? 'payment-detail--active' : ''}" data-method="cashapp">
            <div class="payment-detail__header">
              <div>
                <p>Send <strong><span data-payment-amount>${formatCurrency(estimatedAmount)}</span></strong> to <strong>${PAYMENT_METHODS.cashapp.handle}</strong>.</p>
                <p>Use reference code <strong><span data-payment-reference>${paymentReference}</span></strong> in the note.</p>
              </div>
              <a class="payment-link" href="${PAYMENT_METHODS.cashapp.url}" target="_blank" rel="noopener">Open Cash App</a>
            </div>
            <div class="payment-detail__body">
              <div class="payment-qr">
                <img src="${PAYMENT_METHODS.cashapp.qr}" alt="Cash App QR code" loading="lazy" />
                <span class="payment-qr__caption">Scan to open Cash App</span>
              </div>
              <div class="payment-instructions">
                <h5>Steps</h5>
                <ol class="payment-instruction-list">
                  ${getManualInstructionList('cashapp')}
                </ol>
                <button type="button" class="payment-copy" data-copy-payment="cashapp">
                  Copy Cash App Details
                </button>
              </div>
            </div>
            <div class="payment-note">
              <p>Need help? Email us at <a href="mailto:${ZELLE_EMAIL}">${ZELLE_EMAIL}</a>.</p>
            </div>
          </div>
          <div class="payment-detail ${selectedMethod === 'zelle' ? 'payment-detail--active' : ''}" data-method="zelle">
            <div class="payment-detail__header">
              <div>
                <p>Send <strong><span data-payment-amount>${formatCurrency(estimatedAmount)}</span></strong> via Zelle.</p>
                <p>Recipient: <strong>${ZELLE_EMAIL}</strong> or <strong>${ZELLE_PHONE}</strong></p>
                <p>Reference: <strong><span data-payment-reference>${paymentReference}</span></strong></p>
              </div>
            </div>
            <div class="payment-instructions">
              <h5>Steps</h5>
              <ol class="payment-instruction-list">
                ${getManualInstructionList('zelle')}
              </ol>
              <button type="button" class="payment-copy" data-copy-payment="zelle">
                Copy Zelle Details
              </button>
            </div>
            <div class="payment-note">
              <p>Most banks offer Zelle inside their app. Include the reference code so we can match your donation.</p>
            </div>
          </div>
        </div>
        <div class="checkout-actions">
          <button id="card-button" type="button" class="cart-checkout-btn" ${altButtonVisible ? 'style="display:none;"' : ''}>Pay Now</button>
          <button id="alt-pay-button" type="button" class="cart-checkout-btn" ${altButtonVisible ? '' : 'style="display:none;"'}>${altButtonLabel}</button>
          <button id="co-cancel" type="button" class="cart-checkout-btn cart-checkout-btn--secondary">Back</button>
        </div>
      </div>
    </div>
  `;
}

// ====== CHECKOUT VALIDATION ======

function validateCheckoutName(name) {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }
  // Allow letters, spaces, hyphens, and apostrophes
  const namePattern = /^[a-zA-Z\s'-]+$/;
  if (!namePattern.test(name.trim())) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  return { isValid: true, message: '' };
}

function validateCheckoutEmail(email) {
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: 'Email is required' };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  return { isValid: true, message: '' };
}

function validateCheckoutAddress(address) {
  if (!address || address.trim().length === 0) {
    return { isValid: false, message: 'Address is required' };
  }
  if (address.trim().length < 5) {
    return { isValid: false, message: 'Address must be at least 5 characters' };
  }
  return { isValid: true, message: '' };
}

function validateCheckoutCity(city) {
  if (!city || city.trim().length === 0) {
    return { isValid: false, message: 'City is required' };
  }
  if (city.trim().length < 2) {
    return { isValid: false, message: 'City must be at least 2 characters' };
  }
  return { isValid: true, message: '' };
}

function validateCheckoutState(state) {
  if (!state || state.trim().length === 0) {
    return { isValid: false, message: 'State is required' };
  }
  const stateUpper = state.trim().toUpperCase();
  if (stateUpper.length !== 2) {
    return { isValid: false, message: 'State must be exactly 2 letters' };
  }
  if (!/^[A-Z]{2}$/.test(stateUpper)) {
    return { isValid: false, message: 'State must be 2 uppercase letters' };
  }
  return { isValid: true, message: '' };
}

function validateCheckoutZip(zip) {
  if (!zip || zip.trim().length === 0) {
    return { isValid: false, message: 'ZIP code is required' };
  }
  const zipClean = zip.trim().replace(/[^0-9-]/g, '');
  // 5 digits or 9 digits with dash (12345 or 12345-6789)
  const zipPattern = /^(\d{5}|\d{5}-\d{4})$/;
  if (!zipPattern.test(zipClean)) {
    return { isValid: false, message: 'ZIP code must be 5 digits or 9 digits with dash (12345-6789)' };
  }
  return { isValid: true, message: '' };
}

function validateCheckoutForm() {
  const name = document.getElementById('co-name')?.value || '';
  const email = document.getElementById('co-email')?.value || '';
  const address = document.getElementById('co-address')?.value || '';
  const city = document.getElementById('co-city')?.value || '';
  const state = document.getElementById('co-state')?.value || '';
  const zip = document.getElementById('co-zip')?.value || '';

  const validation = {
    name: validateCheckoutName(name),
    email: validateCheckoutEmail(email),
    address: validateCheckoutAddress(address),
    city: validateCheckoutCity(city),
    state: validateCheckoutState(state),
    zip: validateCheckoutZip(zip)
  };

  const isValid = Object.values(validation).every(v => v.isValid);
  return { isValid, validation };
}

function showCheckoutFormErrors(validation) {
  cartUI.checkoutFormSubmitted = true;

  showFieldError('co-name', validation.validation.name.isValid ? '' : validation.validation.name.message);
  showFieldError('co-email', validation.validation.email.isValid ? '' : validation.validation.email.message);
  showFieldError('co-address', validation.validation.address.isValid ? '' : validation.validation.address.message);
  showFieldError('co-city', validation.validation.city.isValid ? '' : validation.validation.city.message);
  showFieldError('co-state', validation.validation.state.isValid ? '' : validation.validation.state.message);
  showFieldError('co-zip', validation.validation.zip.isValid ? '' : validation.validation.zip.message);

  const fieldMapping = {
    'co-name': 'name',
    'co-email': 'email',
    'co-address': 'address',
    'co-city': 'city',
    'co-state': 'state',
    'co-zip': 'zip'
  };
  const firstErrorField = ['co-name', 'co-email', 'co-address', 'co-city', 'co-state', 'co-zip']
    .find(id => !validation.validation[fieldMapping[id]].isValid);

  if (firstErrorField) {
    const fieldEl = document.getElementById(firstErrorField);
    if (fieldEl) {
      fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldEl.focus();
    }
  }
}

function showFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  
  if (field) {
    if (errorMessage) {
      field.classList.add('checkout-input--error');
    } else {
      field.classList.remove('checkout-input--error');
    }
  }
  
  if (errorEl) {
    errorEl.textContent = errorMessage || '';
    errorEl.style.display = errorMessage ? 'block' : 'none';
  }
}

function updateFieldValidation(fieldId, validator, showErrors = false) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const value = field.value;
  const validation = validator(value);
  
  // Only show errors if form has been submitted or showErrors is true
  if (showErrors || cartUI.checkoutFormSubmitted) {
    showFieldError(fieldId, validation.isValid ? '' : validation.message);
  }
  
  return validation.isValid;
}

function attachCheckoutEventHandlers() {
  // Name field
  const nameField = document.getElementById('co-name');
  if (nameField) {
    nameField.addEventListener('input', () => {
      updateFieldValidation('co-name', validateCheckoutName, false);
      updateCheckoutTotals();
    });
    nameField.addEventListener('blur', () => {
      if (cartUI.checkoutFormSubmitted) {
        updateFieldValidation('co-name', validateCheckoutName, true);
      }
    });
  }

  // Email field
  const emailField = document.getElementById('co-email');
  if (emailField) {
    emailField.addEventListener('input', () => {
      updateFieldValidation('co-email', validateCheckoutEmail, false);
      updateCheckoutTotals();
    });
    emailField.addEventListener('blur', () => {
      if (cartUI.checkoutFormSubmitted) {
        updateFieldValidation('co-email', validateCheckoutEmail, true);
      }
    });
  }

  // Address field
  const addressField = document.getElementById('co-address');
  if (addressField) {
    addressField.addEventListener('input', () => {
      updateFieldValidation('co-address', validateCheckoutAddress, false);
      updateCheckoutTotals();
    });
    addressField.addEventListener('blur', () => {
      if (cartUI.checkoutFormSubmitted) {
        updateFieldValidation('co-address', validateCheckoutAddress, true);
      }
    });
  }

  // City field
  const cityField = document.getElementById('co-city');
  if (cityField) {
    cityField.addEventListener('input', () => {
      updateFieldValidation('co-city', validateCheckoutCity, false);
      updateCheckoutTotals();
    });
    cityField.addEventListener('blur', () => {
      if (cartUI.checkoutFormSubmitted) {
        updateFieldValidation('co-city', validateCheckoutCity, true);
      }
    });
  }

  // State field - auto-uppercase
  const stateField = document.getElementById('co-state');
  if (stateField) {
    stateField.addEventListener('input', (e) => {
      // Auto-uppercase the input
      e.target.value = e.target.value.toUpperCase();
      updateFieldValidation('co-state', validateCheckoutState, false);
      updateCheckoutTotals();
    });
    stateField.addEventListener('blur', () => {
      if (cartUI.checkoutFormSubmitted) {
        updateFieldValidation('co-state', validateCheckoutState, true);
      }
    });
  }

  // ZIP field - filter to digits and dash only
  const zipField = document.getElementById('co-zip');
  if (zipField) {
    zipField.addEventListener('input', (e) => {
      // Filter to digits and dash only
      e.target.value = e.target.value.replace(/[^0-9-]/g, '');
      updateFieldValidation('co-zip', validateCheckoutZip, false);
      updateCheckoutTotals();
    });
    zipField.addEventListener('blur', () => {
      if (cartUI.checkoutFormSubmitted) {
        updateFieldValidation('co-zip', validateCheckoutZip, true);
      }
    });
  }

  const cancelBtn = document.getElementById('co-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // Reset flags
      cartUI.checkoutFormSubmitted = false;
      cartUI.squarePaymentInitialized = false;
      cartUI.selectedPaymentMethod = 'card';
      // Recreate containers and reopen cart to restore default view
      createCartSidebar();
      createCartOverlay();
      openCart();
    });
  }

  document.querySelectorAll('input[name="payment-method"]').forEach(input => {
    input.addEventListener('change', (event) => {
      const value = event.target.value;
      setSelectedPaymentMethod(value);
    });
  });

  const altPayButton = document.getElementById('alt-pay-button');
  if (altPayButton) {
    altPayButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleAlternativePayment(cartUI.selectedPaymentMethod);
    });
  }

  document.querySelectorAll('.payment-copy').forEach(button => {
    button.addEventListener('click', () => {
      const method = button.dataset.copyPayment;
      copyManualPaymentDetails(method);
    });
  });

  setSelectedPaymentMethod(cartUI.selectedPaymentMethod || 'card');
}

function handleAlternativePayment(method) {
  if (method === 'card') {
    return;
  }

  const cartValidation = cart.validateCart();
  if (!cartValidation.isValid) {
    updateCheckoutTotals();
    const firstErrorId = cartValidation.errors[0]?.id;
    if (firstErrorId) {
      focusCartDonationInput(firstErrorId);
    }
    showToast('Enter a donation amount for each item before continuing.', 'error');
    return;
  }

  const formValidation = validateCheckoutForm();
  if (!formValidation.isValid) {
    showCheckoutFormErrors(formValidation);
    return;
  }

  const reference = cartUI.checkoutReference || generateCheckoutReference();
  cartUI.checkoutReference = reference;
  const { subtotal, tax, total } = getCheckoutAmounts();
  const summary = cart.getCartSummary();
  const items = summary.items.map(item => ({
    title: item.title,
    quantity: item.quantity,
    lineTotal: item.lineTotal || calculateLineTotal(item)
  }));

  showManualConfirmation({
    method,
    reference,
    totals: { subtotal, tax, total },
    items
  });
}

function showManualConfirmation({ method, reference, totals, items }) {
  if (!cartUI.checkoutContainer) return;
  cartUI.checkoutContainer.innerHTML = getManualConfirmationHTML(method, reference, totals, items);
  attachManualConfirmationHandlers(method, totals.total, reference);
}

function getManualConfirmationHTML(method, reference, totals, items) {
  const config = PAYMENT_METHODS[method];
  if (!config) return '';
  const amountText = formatCurrency(totals.total);
  const instructionList = getManualInstructionList(method);
  const contactLine =
    method === 'cashapp'
      ? `Send to <strong>${config.handle}</strong> or scan the QR code below.`
      : `Send via Zelle to <strong>${config.email}</strong> or <strong>${config.phone}</strong>.`;
  const qrMarkup =
    method === 'cashapp'
      ? `<div class="payment-qr payment-qr--floating">
          <img src="${config.qr}" alt="Cash App QR code" loading="lazy" />
          <span class="payment-qr__caption">Scan in Cash App</span>
        </div>`
      : '';
  const itemsMarkup = items
    .map(item => {
      const safeTitle = escapeHtml(item.title);
      return `<li><span>${safeTitle} × ${item.quantity}</span><span>${formatCurrency(item.lineTotal || 0)}</span></li>`;
    })
    .join('');

  return `
    <div class="checkout-panel checkout-panel--open confirmation-panel">
      <div class="checkout-panel__section">
        <p class="confirmation-eyebrow">Manual payment selected</p>
        <h4 class="checkout-panel__title">${config.label} Instructions</h4>
        <p class="confirmation-lede">Thank you for supporting GI & Associates Foundation! Complete your transfer using the details below.</p>
        <div class="confirmation-card">
          <div class="confirmation-meta">
            <div>
              <span>Amount</span>
              <strong>${amountText}</strong>
            </div>
            <div>
              <span>Reference</span>
              <strong>${reference}</strong>
            </div>
          </div>
          <div class="confirmation-body">
            ${qrMarkup}
            <div class="confirmation-steps">
              <p>${contactLine}</p>
              <ol class="payment-instruction-list">
                ${instructionList}
              </ol>
            </div>
          </div>
        </div>
        <div class="confirmation-summary">
          <h5>Donation summary</h5>
          <ul>
            ${itemsMarkup}
          </ul>
          <p class="confirmation-note">Include the reference in your note so we can match your donation.</p>
        </div>
        <div class="checkout-actions confirmation-actions">
          <button type="button" class="cart-checkout-btn" id="confirmation-copy" data-method="${method}">Copy Details</button>
          <button type="button" class="cart-checkout-btn cart-checkout-btn--secondary" id="confirmation-close">Done</button>
        </div>
      </div>
    </div>
  `;
}

function attachManualConfirmationHandlers(method, amount, reference) {
  const copyBtn = document.getElementById('confirmation-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyManualPaymentDetails(method, amount, reference));
  }

  const closeBtn = document.getElementById('confirmation-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof cart?.clearCart === 'function') {
        cart.clearCart();
      }
      closeCart();
      showToast('Thank you! Please complete your transfer using the provided instructions.', 'success');
    });
  }
}

function copyManualPaymentDetails(method, amountOverride, referenceOverride) {
  const { total } = getCheckoutAmounts();
  const amount = typeof amountOverride === 'number' ? amountOverride : total;
  const reference = referenceOverride || cartUI.checkoutReference || generateCheckoutReference();
  let details = `Donation Amount: ${formatCurrency(amount)}\nReference: ${reference}\n`;

  if (method === 'cashapp') {
    details += `Cash App Handle: ${PAYMENT_METHODS.cashapp.handle}\nCash App Link: ${PAYMENT_METHODS.cashapp.url}\n`;
  } else if (method === 'zelle') {
    details += `Zelle Email: ${PAYMENT_METHODS.zelle.email}\nZelle Phone: ${PAYMENT_METHODS.zelle.phone}\n`;
  }

  const note = 'Include the reference in your payment note.';
  details += `${note}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(details).then(() => {
      showToast('Payment details copied to clipboard.', 'success');
    }).catch(() => {
      fallbackCopy(details);
    });
  } else {
    fallbackCopy(details);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  showToast('Payment details copied to clipboard.', 'success');
}

function parseState(value) {
  return (value || '').trim().toUpperCase();
}

function estimateTax(subtotal, state) {
  const defaultRate = 0.07; // 7% default
  const rates = {
    CA: 0.0825,
    NY: 0.08875,
    TX: 0.0825,
    WA: 0.095,
    FL: 0.07,
    IL: 0.1025
  };
  const rate = rates[state] != null ? rates[state] : defaultRate;
  return Math.max(0, subtotal * rate);
}

function getCheckoutAmounts() {
  const subtotal = Number(cartState.donationTotal || 0);
  const state = parseState(document.getElementById('co-state')?.value);
  const tax = estimateTax(subtotal, state);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function updateCheckoutTotals() {
  const { subtotal, tax, total } = getCheckoutAmounts();
  if (!cartUI.checkoutReference) {
    cartUI.checkoutReference = generateCheckoutReference();
  }
  updateManualPaymentDisplays(total, cartUI.checkoutReference);
  const subEl = document.getElementById('co-subtotal');
  const taxEl = document.getElementById('co-tax');
  const totalEl = document.getElementById('co-total');
  if (subEl) subEl.textContent = formatCurrency(subtotal);
  if (taxEl) taxEl.textContent = formatCurrency(tax);
  if (totalEl) totalEl.textContent = formatCurrency(total);

  const summary = cart.getCartSummary();
  summary.items.forEach(item => {
    const selector = escapeSelector(item.id);
    const lineEl = document.querySelector(`[data-checkout-line="${selector}"]`);
    if (lineEl) {
      lineEl.textContent = `Line total: ${formatCurrency(item.lineTotal || 0)}`;
    }
    const inputEl = document.querySelector(`.checkout-donation-input[data-item-id="${selector}"]`);
    if (inputEl && document.activeElement !== inputEl) {
      inputEl.value = formatDonationInput(item.donationPerUnit);
    }
  });

  const validation = cart.validateCart();
  updateCheckoutValidation(validation);

  // Initialize Square payment only once per checkout panel opening
  if (window.initSquareInlinePayment && !cartUI.squarePaymentInitialized) {
    const amountCents = Math.round(total * 100);
    cartUI.squarePaymentInitialized = true;
    
    // Update pay button label before Square initializes (Square will clone it, so set it first)
    const payBtn = document.getElementById('card-button');
    if (payBtn) {
      const labelAmount = formatCurrency(total);
      payBtn.textContent = total > 0 ? `Pay ${labelAmount}` : 'Pay Now';
      payBtn.disabled = !validation.isValid || total <= 0;
    }
    
    window.initSquareInlinePayment({
      amountCents,
      cardContainerSelector: '#card-container',
      payButtonSelector: '#card-button',
      statusSelector: '#payment-status',
      endpoint: '/api/process-payment.php',
      beforeTokenize: () => {
        const cartValidation = cart.validateCart();
        if (!cartValidation.isValid) {
          updateCheckoutTotals();
          const firstErrorId = cartValidation.errors[0]?.id;
          if (firstErrorId) {
            const selector = `.checkout-donation-input[data-item-id="${escapeSelector(firstErrorId)}"]`;
            const fieldEl = document.querySelector(selector);
            if (fieldEl) {
              fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              fieldEl.focus();
            }
          }
          return false;
        }

        // Validate form before processing payment
        const validation = validateCheckoutForm();
        
        if (!validation.isValid) {
          showCheckoutFormErrors(validation);
          return false;
        }
        
        // Return true to proceed with payment
        return true;
      },
      onSuccess: (data) => {
        if (typeof cart?.clearCart === 'function') cart.clearCart();
        closeCart();
        if (typeof window.openModal === 'function') {
          const paymentId = data?.payment?.id || '';
          window.openModal({
            type: 'success',
            title: 'Payment Successful',
            message: 'Thank you for your donation. Your payment has been processed.',
            details: paymentId ? `Transaction ID: ${paymentId}` : '',
            actions: [
              { label: 'Continue Shopping', variant: 'primary', onClick: () => { window.closeModal(); } }
            ]
          });
        }
      },
      onError: (err) => {
        console.error('Payment error', err);
        if (typeof window.openModal === 'function') {
          let details = '';
          try { details = typeof err === 'string' ? err : JSON.stringify(err); } catch (e) {}
          window.openModal({
            type: 'error',
            title: 'Payment Failed',
            message: 'We could not process your payment. Please try again.',
            details,
            actions: [
              { label: 'Retry', variant: 'primary', onClick: () => { window.closeModal(); /* user can try again */ } },
              { label: 'Close', variant: 'secondary', onClick: () => window.closeModal() }
            ]
          });
        }
      }
    });
    
    // Use a small delay to ensure Square has finished cloning/replacing the button
    setTimeout(() => {
      const payBtn = document.getElementById('card-button');
      if (payBtn) {
        if (total > 0 && validation.isValid) {
          payBtn.disabled = false;
          const labelAmount = formatCurrency(total);
          payBtn.textContent = `Pay ${labelAmount}`;
        } else {
          payBtn.disabled = true;
          payBtn.textContent = 'Pay Now';
        }
      }
    }, 100);
  } else {
    // Square already initialized, just update the button text if needed
    const payBtn = document.getElementById('card-button');
    if (payBtn) {
      if (total > 0 && validation.isValid) {
        const labelAmount = formatCurrency(total);
        payBtn.disabled = false;
        payBtn.textContent = `Pay ${labelAmount}`;
      } else {
        payBtn.disabled = true;
        payBtn.textContent = 'Pay Now';
      }
    }
  }
}
