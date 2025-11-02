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
  squarePaymentInitialized: false
};

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
      <div class="cart-donation">
        <label for="cart-donation-input" class="cart-donation__label">Total Donation Amount</label>
        <div class="cart-donation__input-group">
          <span class="cart-donation__currency">$</span>
          <input 
            type="number" 
            id="cart-donation-input" 
            class="cart-donation__input" 
            min="10" 
            step="0.01" 
            placeholder="10.00"
            onchange="handleDonationChange(this.value)"
          />
        </div>
        <div class="cart-donation__error" id="cart-donation-error"></div>
      </div>
      <div class="cart-total">
        <div class="cart-total__items">${getItemCount()} items</div>
        <div class="cart-total__amount" id="cart-total-amount">$0.00</div>
      </div>
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
      <div class="cart-donation">
        <label for="cart-donation-input-mobile" class="cart-donation__label">Total Donation Amount</label>
        <div class="cart-donation__input-group">
          <span class="cart-donation__currency">$</span>
          <input 
            type="number" 
            id="cart-donation-input-mobile" 
            class="cart-donation__input" 
            min="10" 
            step="0.01" 
            placeholder="10.00"
            onchange="handleDonationChange(this.value)"
          />
        </div>
        <div class="cart-donation__error" id="cart-donation-error-mobile"></div>
      </div>
      <div class="cart-total">
        <div class="cart-total__items">${getItemCount()} items</div>
        <div class="cart-total__amount" id="cart-total-amount-mobile">$0.00</div>
      </div>
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
    
    const itemsHTML = cartState.items.map(item => getCartItemHTML(item)).join('');
    
    if (desktopList) desktopList.innerHTML = itemsHTML;
    if (mobileList) mobileList.innerHTML = itemsHTML;
  }
}

function getCartItemHTML(item) {
  return `
    <div class="cart-item" data-item-id="${item.id}">
      <div class="cart-item__image">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="cart-item__details">
        <h4 class="cart-item__title">${item.title}</h4>
        <p class="cart-item__description">${item.description}</p>
        <div class="cart-item__quantity">
          <button class="cart-item__qty-btn" onclick="event.preventDefault(); event.stopPropagation(); updateItemQuantity('${item.id}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
          <span class="cart-item__qty-value">${item.quantity}</span>
          <button class="cart-item__qty-btn" onclick="event.preventDefault(); event.stopPropagation(); updateItemQuantity('${item.id}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-item__remove" onclick="event.preventDefault(); event.stopPropagation(); removeFromCart('${item.id}')" aria-label="Remove item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"></polyline>
          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
        </svg>
      </button>
    </div>
  `;
}

function updateCartTotals() {
  const totalAmount = cartState.totalDonation.toFixed(2);
  const itemCount = getItemCount();
  
  // Update desktop elements
  const desktopTotal = document.getElementById('cart-total-amount');
  const desktopItems = document.querySelector('.cart-sidebar .cart-total__items');
  const desktopDonation = document.getElementById('cart-donation-input');
  
  if (desktopTotal) desktopTotal.textContent = `$${totalAmount}`;
  if (desktopItems) desktopItems.textContent = `${itemCount} items`;
  if (desktopDonation) desktopDonation.value = cartState.totalDonation || '';
  
  // Update mobile elements
  const mobileTotal = document.getElementById('cart-total-amount-mobile');
  const mobileItems = document.querySelector('.cart-overlay .cart-total__items');
  const mobileDonation = document.getElementById('cart-donation-input-mobile');
  
  if (mobileTotal) mobileTotal.textContent = `$${totalAmount}`;
  if (mobileItems) mobileItems.textContent = `${itemCount} items`;
  if (mobileDonation) mobileDonation.value = cartState.totalDonation || '';
  
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

function handleDonationChange(value) {
  const amount = parseFloat(value) || 0;
  setDonationAmount(amount);
  
  // Validate donation
  const validation = validateDonation(amount);
  const errorElement = document.getElementById('cart-donation-error') || document.getElementById('cart-donation-error-mobile');
  
  if (errorElement) {
    if (validation.isValid) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    } else {
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
    }
  }
  
  updateCartTotals();
}

function handleCheckout() {
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

  content.innerHTML = getCheckoutPanelHTML();
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
window.handleDonationChange = handleDonationChange;
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
  const itemCount = getItemCount();
  const subtotal = (cartState.totalDonation || 0).toFixed(2);
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
        <div class="checkout-summary">
          <div class="checkout-line"><span>${itemCount} items</span></div>
          <div class="checkout-line"><span>Subtotal</span><span id="co-subtotal">$${subtotal}</span></div>
          <div class="checkout-line"><span>Tax</span><span id="co-tax">$0.00</span></div>
          <div class="checkout-total"><span>Total</span><span id="co-total">$${subtotal}</span></div>
        </div>
      </div>

      <div class="checkout-panel__section">
        <h4 class="checkout-panel__title">Payment</h4>
        <div id="card-container"></div>
        <div class="checkout-actions">
          <button id="card-button" class="cart-checkout-btn">Pay Now</button>
          <button id="co-cancel" class="cart-checkout-btn" style="background:#eee;color:#333;">Back</button>
        </div>
        <div id="payment-status" class="checkout-status"></div>
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
      // Recreate containers and reopen cart to restore default view
      createCartSidebar();
      createCartOverlay();
      openCart();
    });
  }
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
  const subtotal = Number(cartState.totalDonation || 0);
  const state = parseState(document.getElementById('co-state')?.value);
  const tax = estimateTax(subtotal, state);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function updateCheckoutTotals() {
  const { subtotal, tax, total } = getCheckoutAmounts();
  const subEl = document.getElementById('co-subtotal');
  const taxEl = document.getElementById('co-tax');
  const totalEl = document.getElementById('co-total');
  if (subEl) subEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  // Initialize Square payment only once per checkout panel opening
  if (window.initSquareInlinePayment && !cartUI.squarePaymentInitialized) {
    const amountCents = Math.round(total * 100);
    cartUI.squarePaymentInitialized = true;
    
    // Update pay button label before Square initializes (Square will clone it, so set it first)
    const payBtn = document.getElementById('card-button');
    if (payBtn) {
      const labelAmount = `$${total.toFixed(2)}`;
      payBtn.textContent = total > 0 ? `Pay ${labelAmount}` : 'Pay Now';
      // Don't set disabled here - let Square handle it after initialization
    }
    
    window.initSquareInlinePayment({
      amountCents,
      cardContainerSelector: '#card-container',
      payButtonSelector: '#card-button',
      statusSelector: '#payment-status',
      endpoint: '/api/process-payment.php',
      beforeTokenize: () => {
        // Validate form before processing payment
        const validation = validateCheckoutForm();
        
        if (!validation.isValid) {
          // Mark form as submitted to show errors
          cartUI.checkoutFormSubmitted = true;
          
          // Show all validation errors
          showFieldError('co-name', validation.validation.name.isValid ? '' : validation.validation.name.message);
          showFieldError('co-email', validation.validation.email.isValid ? '' : validation.validation.email.message);
          showFieldError('co-address', validation.validation.address.isValid ? '' : validation.validation.address.message);
          showFieldError('co-city', validation.validation.city.isValid ? '' : validation.validation.city.message);
          showFieldError('co-state', validation.validation.state.isValid ? '' : validation.validation.state.message);
          showFieldError('co-zip', validation.validation.zip.isValid ? '' : validation.validation.zip.message);
          
          // Find first error field and scroll to it
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
          
          // Return false to prevent payment
          return false;
        }
        
        // Return true to proceed with payment
        return true;
      },
      onSuccess: (data) => {
        if (typeof cart?.clear === 'function') cart.clear();
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
        // Enable button if total > 0, update text
        if (total > 0) {
          payBtn.disabled = false;
          const labelAmount = `$${total.toFixed(2)}`;
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
    if (payBtn && total > 0) {
      const labelAmount = `$${total.toFixed(2)}`;
      if (!payBtn.disabled) {
        payBtn.textContent = `Pay ${labelAmount}`;
      }
    }
  }
}
