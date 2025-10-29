/* ============================================ */
/*                  Cart UI                    */
/* ============================================ */

// UI state
let cartUI = {
  isInitialized: false,
  sidebar: null,
  overlay: null,
  cartIcon: null
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
      <button class="cart-checkout-btn" id="cart-checkout-btn" onclick="handleCheckout()">
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
      <button class="cart-checkout-btn" id="cart-checkout-btn-mobile" onclick="handleCheckout()">
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
  } else {
    // Desktop: Show sidebar
    if (cartUI.sidebar) {
      cartUI.sidebar.classList.add('cart-sidebar--open');
    }
    document.body.classList.add('cart-open');
  }
  
  renderCartItems();
  updateCartTotals();
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
  const badge = document.querySelector('.badge');
  
  if (cartIcon) {
    cartIcon.setAttribute('type', 'button');
    
    // Remove existing listeners to prevent duplicates
    cartIcon.removeEventListener('click', handleCartIconClick);
    cartIcon.addEventListener('click', handleCartIconClick, { capture: true });
  }
  
  if (badge) {
    const count = getItemCount();
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'block' : 'none';
    badge.setAttribute('aria-label', count > 0 ? `${count} items in cart` : 'Cart is empty');
  }
}

function handleCartIconClick(e) {
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  toggleCart();
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
  const checkoutData = prepareCheckout();
  
  if (!checkoutData.success) {
    alert(checkoutData.error);
    return;
  }
  
  // Close cart
  closeCart();
  
  // Show cart summary
  const summary = checkoutData.items.map(item => 
    `${item.name} x${item.quantity}`
  ).join('\n');
  
  alert(`Checkout Summary:\n${summary}\n\nTotal: $${checkoutData.total.toFixed(2)}\n\nPlease contact us to complete your order.`);
}

// ====== EVENT LISTENERS ======

function setupCartEventListeners() {
  // Listen for cart updates
  onCartUpdated(() => {
    renderCartItems();
    updateCartTotals();
    updateCartIcon(); // Ensure cart icon is updated on every cart change
  });
  
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
    if (cartState.isOpen && 
        !e.target.closest('.cart-sidebar') && 
        !e.target.closest('.cart-overlay') &&
        !e.target.closest('.cart-btn')) {
      closeCart();
    }
  });
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
