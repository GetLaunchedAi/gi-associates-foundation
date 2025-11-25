/* ============================================ */
/*                  Custom Cart                 */
/* ============================================ */

// Global cart state
let cartState = {
  items: [],
  donationTotal: 0,
  itemCount: 0,
  isOpen: false,
  lastUpdated: new Date().toISOString()
};

// Configuration
const CART_CONFIG = {
  storageKey: 'gi_foundation_cart',
  minDonation: 10
};

// Helpers
function normalizeDonationInput(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

function getItemDonation(item) {
  return typeof item?.donationPerUnit === 'number' && !Number.isNaN(item.donationPerUnit)
    ? item.donationPerUnit
    : null;
}

function getLineTotal(item) {
  const donation = getItemDonation(item);
  const quantity = Math.max(1, parseInt(item?.quantity, 10) || 1);
  return donation ? donation * quantity : 0;
}

// Event listeners storage
const cartListeners = {};

// ====== CART STATE MANAGEMENT ======

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_CONFIG.storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      cartState = {
        ...cartState,
        ...parsed,
        isOpen: false // Always start with cart closed
      };
      cartState.items = Array.isArray(cartState.items)
        ? cartState.items.map(item => ({
            ...item,
            quantity: Math.max(1, parseInt(item?.quantity, 10) || 1),
            donationPerUnit: getItemDonation(item)
          }))
        : [];
      // Ensure derived totals are consistent with stored items
      updateCartTotals();
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    cartState = getEmptyCartState();
  }
  return cartState;
}

function saveCartToStorage() {
  try {
    cartState.lastUpdated = new Date().toISOString();
    localStorage.setItem(CART_CONFIG.storageKey, JSON.stringify(cartState));
    // Update badge immediately (doesn't wait for event listeners)
    updateBadgeDirectly();
    // Also trigger event for other UI updates
    triggerCartEvent('cartUpdated', cartState);
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

function getEmptyCartState() {
  return {
    items: [],
    donationTotal: 0,
    itemCount: 0,
    isOpen: false,
    lastUpdated: new Date().toISOString()
  };
}

function updateCartTotals() {
  cartState.itemCount = cartState.items.reduce((total, item) => total + (item.quantity || 0), 0);
  cartState.donationTotal = cartState.items.reduce((total, item) => total + getLineTotal(item), 0);
  return {
    itemCount: cartState.itemCount,
    donationTotal: cartState.donationTotal
  };
}

// Direct badge update function (works immediately, doesn't wait for event listeners)
function updateBadgeDirectly() {
  function doUpdate() {
    // Try multiple selectors to find the badge
    const badge = document.querySelector('#navigation .cart-btn .badge') || 
                  document.querySelector('.cart-btn .badge') || 
                  document.querySelector('.badge');
    
    if (badge) {
      // Recalculate count directly from items to ensure accuracy
      const count = cartState.items.reduce((total, item) => total + (item.quantity || 0), 0);
      const MAX_BADGE_COUNT = 99;
      const display = count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : `${count}`;
      
      // Update badge content and visibility
      badge.textContent = count > 0 ? display : '';
      // Force display update - inline style overrides CSS :empty rule
      if (count > 0) {
        badge.style.display = 'flex'; // CSS uses flex, not block
      } else {
        badge.style.display = 'none';
      }
      badge.setAttribute('aria-label', count > 0 ? `${count} items in cart` : 'Cart is empty');
      badge.setAttribute('title', count > 0 ? `${count} items in cart` : 'Cart is empty');
    }
  }
  
  // If DOM is still loading, wait for it
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doUpdate);
    return;
  }
  
  // Use requestAnimationFrame to ensure DOM updates are visible
  requestAnimationFrame(doUpdate);
}

// ====== CART OPERATIONS ======

function addToCart(product) {
  if (!product || !product.id) {
    console.error('Invalid product:', product);
    return false;
  }

  const existingItem = cartState.items.find(item => item.id === product.id);
  const quantityToAdd = Math.max(1, parseInt(product.quantity, 10) || 1);
  const donationInput =
    product.donationPerUnit ?? product.donationAmount ?? product.donation ?? null;
  const donationValue = normalizeDonationInput(donationInput);
  
  if (existingItem) {
    existingItem.quantity += quantityToAdd;
    if (donationValue !== null) {
      existingItem.donationPerUnit = donationValue;
    }
  } else {
    cartState.items.push({
      id: product.id,
      title: product.title || product.name || 'Untitled Product',
      image: product.image || '/images/placeholder.jpg',
      description: product.description || '',
      donationPerUnit: donationValue,
      quantity: quantityToAdd
    });
  }

  updateCartTotals();
  saveCartToStorage();
  triggerCartEvent('itemAdded', { product, cart: cartState });
  return true;
}

function removeFromCart(productId) {
  const initialLength = cartState.items.length;
  cartState.items = cartState.items.filter(item => item.id !== productId);
  
  if (cartState.items.length !== initialLength) {
    updateCartTotals();
    saveCartToStorage();
    triggerCartEvent('itemRemoved', { productId, cart: cartState });
    return true;
  }
  return false;
}

function updateItemQuantity(productId, quantity) {
  const item = cartState.items.find(item => item.id === productId);
  
  if (!item) return false;
  
  if (quantity <= 0) {
    return removeFromCart(productId);
  }
  
  item.quantity = Math.max(1, Math.floor(quantity));
  updateCartTotals();
  saveCartToStorage();
  triggerCartEvent('quantityUpdated', { productId, quantity: item.quantity, cart: cartState });
  return true;
}

function setItemDonation(productId, amount) {
  const item = cartState.items.find(entry => entry.id === productId);
  if (!item) return false;

  item.donationPerUnit = normalizeDonationInput(amount);
  updateCartTotals();
  saveCartToStorage();
  triggerCartEvent('itemDonationUpdated', { productId, donation: item.donationPerUnit, cart: cartState });
  return true;
}

function clearCart() {
  cartState = getEmptyCartState();
  saveCartToStorage();
  triggerCartEvent('cartCleared', cartState);
  return true;
}

// ====== VALIDATION ======

function validateDonation(amount) {
  const donation =
    typeof amount === 'number' && !Number.isNaN(amount) ? amount : normalizeDonationInput(amount);
  return {
    isValid: donation !== null && donation >= CART_CONFIG.minDonation,
    amount: donation,
    minimum: CART_CONFIG.minDonation,
    message:
      donation === null
        ? 'Enter a donation amount'
        : donation < CART_CONFIG.minDonation
          ? `Minimum donation is $${CART_CONFIG.minDonation}`
          : 'Donation amount is valid'
  };
}

function validateCart() {
  const isEmpty = cartState.items.length === 0;
  const itemErrors = cartState.items.map(item => {
    const validation = validateDonation(getItemDonation(item));
    return {
      id: item.id,
      title: item.title,
      isValid: validation.isValid,
      message: validation.isValid ? '' : validation.message
    };
  }).filter(entry => !entry.isValid);
  
  return {
    isValid: !isEmpty && itemErrors.length === 0,
    errors: itemErrors,
    isEmpty,
    minDonation: CART_CONFIG.minDonation,
    donationTotal: cartState.donationTotal
  };
}

// ====== GETTERS ======

function getCart() {
  return { ...cartState };
}

function getItemCount() {
  return cartState.itemCount;
}

function getTotalDonation() {
  return cartState.donationTotal;
}

function isCartEmpty() {
  return cartState.items.length === 0;
}

function getCartSummary() {
  return {
    itemCount: cartState.itemCount,
    totalDonation: cartState.donationTotal,
    items: cartState.items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      image: item.image,
      donationPerUnit: getItemDonation(item),
      lineTotal: getLineTotal(item)
    }))
  };
}

// ====== CHECKOUT ======

function prepareCheckout() {
  const validation = validateCart();
  
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join(', '),
      cart: cartState
    };
  }

  return {
    success: true,
    cart: cartState,
    total: cartState.donationTotal,
    items: cartState.items.map(item => ({
      name: item.title,
      quantity: item.quantity,
      donationPerUnit: getItemDonation(item),
      lineTotal: getLineTotal(item)
    }))
  };
}

// ====== EVENT SYSTEM ======

function onCartUpdated(callback) {
  addCartEventListener('cartUpdated', callback);
}

function addCartEventListener(event, callback) {
  if (!cartListeners[event]) {
    cartListeners[event] = [];
  }
  cartListeners[event].push(callback);
}

function removeCartEventListener(event, callback) {
  if (cartListeners[event]) {
    cartListeners[event] = cartListeners[event].filter(cb => cb !== callback);
  }
}

function triggerCartEvent(event, data) {
  if (cartListeners[event]) {
    cartListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in cart event listener for ${event}:`, error);
      }
    });
  }
}

// ====== INITIALIZATION ======

function initCart() {
  loadCartFromStorage();
  // Recalculate totals on startup and notify listeners so UI (badge) syncs
  updateCartTotals();
  // Update badge - use setTimeout to ensure DOM is fully ready (even with defer)
  setTimeout(() => {
    updateBadgeDirectly();
  }, 0);
  triggerCartEvent('cartUpdated', cartState);
  triggerCartEvent('cartLoaded', cartState);
}

// Initialize cart when script loads
initCart();

// Make functions globally available
window.cart = {
  addToCart,
  removeFromCart,
  updateItemQuantity,
  setItemDonation,
  clearCart,
  getCart,
  getItemCount,
  getTotalDonation,
  isCartEmpty,
  getCartSummary,
  validateDonation,
  validateCart,
  prepareCheckout,
  onCartUpdated,
  addCartEventListener,
  removeCartEventListener,
  config: CART_CONFIG
};
