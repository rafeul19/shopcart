/**
 * UI Accessibility Enhancement Module
 * Adds keyboard navigation, ARIA labels, and responsive design improvements
 */

class UIAccessibilityEnhancer {
    constructor(uiModule) {
        this.ui = uiModule;
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.gridColumns = 1;
        
        this.init();
    }
    
    init() {
        if (typeof document === 'undefined') return;
        
        this.setupKeyboardNavigation();
        this.setupAccessibilityAnnouncements();
        this.enhanceExistingElements();
        this.setupResponsiveLayout();
        this.setupFocusManagement();
    }
    
    /**
     * Sets up keyboard navigation for the application
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }
            
            // Arrow key navigation for product grid
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowNavigation(e);
            }
            
            // Enter and Space for button activation
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('add-to-cart-btn')) {
                e.preventDefault();
                e.target.click();
            }
        });
    }
    
    /**
     * Handles escape key press
     */
    handleEscapeKey(event) {
        const modal = document.getElementById('checkout-modal');
        if (modal && !modal.classList.contains('hidden')) {
            this.ui.closeCheckoutModal();
            event.preventDefault();
        }
    }
    
    /**
     * Handles arrow key navigation for product grid
     */
    handleArrowNavigation(event) {
        const productList = document.getElementById('product-list');
        if (!productList) return;
        
        const buttons = Array.from(productList.querySelectorAll('.add-to-cart-btn'));
        const currentIndex = buttons.indexOf(document.activeElement);
        
        if (currentIndex === -1) return;
        
        let newIndex = currentIndex;
        const columns = this.getGridColumns();
        
        switch (event.key) {
            case 'ArrowUp':
                newIndex = Math.max(0, currentIndex - columns);
                break;
            case 'ArrowDown':
                newIndex = Math.min(buttons.length - 1, currentIndex + columns);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                newIndex = Math.min(buttons.length - 1, currentIndex + 1);
                break;
        }
        
        if (newIndex !== currentIndex) {
            event.preventDefault();
            buttons[newIndex].focus();
        }
    }
    
    /**
     * Gets the number of columns in the current grid layout
     */
    getGridColumns() {
        if (typeof window === 'undefined') return 1;
        
        const width = window.innerWidth;
        if (width < 640) return 1;
        if (width < 1024) return 2;
        if (width < 1280) return 3;
        return 4;
    }
    
    /**
     * Sets up accessibility announcements
     */
    setupAccessibilityAnnouncements() {
        // Create live region if it doesn't exist
        if (!document.getElementById('live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'live-region';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }
    }
    
    /**
     * Announces messages to screen readers
     */
    announceToScreenReader(message, priority = 'polite') {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * Enhances existing elements with better accessibility
     */
    enhanceExistingElements() {
        // Enhance product list
        const productList = document.getElementById('product-list');
        if (productList) {
            productList.setAttribute('role', 'grid');
            productList.setAttribute('aria-label', 'Product catalog');
        }
        
        // Enhance cart section
        const cartItems = document.getElementById('cart-items');
        if (cartItems) {
            cartItems.setAttribute('role', 'region');
            cartItems.setAttribute('aria-label', 'Cart items');
            cartItems.setAttribute('aria-live', 'polite');
        }
        
        // Enhance cart total
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) {
            cartTotal.setAttribute('aria-live', 'polite');
        }
        
        // Enhance buttons
        this.enhanceButtons();
    }
    
    /**
     * Enhances buttons with better accessibility
     */
    enhanceButtons() {
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.setAttribute('aria-describedby', 'clear-cart-help');
            if (!document.getElementById('clear-cart-help')) {
                const helpText = document.createElement('span');
                helpText.id = 'clear-cart-help';
                helpText.className = 'sr-only';
                helpText.textContent = 'Remove all items from your cart';
                clearCartBtn.parentNode.appendChild(helpText);
            }
        }
        
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.setAttribute('aria-describedby', 'checkout-help');
            if (!document.getElementById('checkout-help')) {
                const helpText = document.createElement('span');
                helpText.id = 'checkout-help';
                helpText.className = 'sr-only';
                helpText.textContent = 'Review your order and complete purchase';
                checkoutBtn.parentNode.appendChild(helpText);
            }
        }
    }
    
    /**
     * Sets up responsive layout handling
     */
    setupResponsiveLayout() {
        this.updateResponsiveLayout();
        
        window.addEventListener('resize', () => {
            this.updateResponsiveLayout();
        });
    }
    
    /**
     * Updates responsive layout based on screen size
     */
    updateResponsiveLayout() {
        const width = window.innerWidth;
        const isMobile = width < 640;
        const isTablet = width >= 640 && width < 1024;
        const isDesktop = width >= 1024;
        
        // Update body classes for responsive styling
        document.body.classList.toggle('mobile-layout', isMobile);
        document.body.classList.toggle('tablet-layout', isTablet);
        document.body.classList.toggle('desktop-layout', isDesktop);
        
        // Update grid columns for navigation
        this.gridColumns = this.getGridColumns();
        
        // Announce layout changes to screen readers
        this.announceToScreenReader(`Layout updated for ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'} view`);
    }
    
    /**
     * Sets up focus management for modals
     */
    setupFocusManagement() {
        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocusInModal(e, modal);
                }
            });
        }
    }
    
    /**
     * Traps focus within the modal
     */
    trapFocusInModal(event, modal) {
        if (modal.classList.contains('hidden')) return;
        
        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    /**
     * Enhances product cards with better accessibility
     */
    enhanceProductCard(card, product) {
        card.setAttribute('role', 'gridcell');
        card.setAttribute('aria-labelledby', `product-name-${product.id}`);
        card.setAttribute('aria-describedby', `product-desc-${product.id} product-price-${product.id}`);
        
        // Add IDs to elements for proper labeling
        const nameElement = card.querySelector('h3');
        if (nameElement) {
            nameElement.id = `product-name-${product.id}`;
        }
        
        const descElement = card.querySelector('p');
        if (descElement) {
            descElement.id = `product-desc-${product.id}`;
        }
        
        const priceElement = card.querySelector('.text-2xl');
        if (priceElement) {
            priceElement.id = `product-price-${product.id}`;
            priceElement.setAttribute('aria-label', `Price: ${product.getFormattedPrice()}`);
        }
        
        const button = card.querySelector('.add-to-cart-btn');
        if (button) {
            button.setAttribute('aria-label', `Add ${product.name} to cart for ${product.getFormattedPrice()}`);
            button.setAttribute('aria-describedby', `add-to-cart-help-${product.id}`);
            
            // Add help text
            const helpText = document.createElement('span');
            helpText.id = `add-to-cart-help-${product.id}`;
            helpText.className = 'sr-only';
            helpText.textContent = 'Press Enter or Space to add this item to your shopping cart';
            button.parentNode.appendChild(helpText);
        }
        
        return card;
    }
    
    /**
     * Enhances cart items with better accessibility
     */
    enhanceCartItem(itemElement, cartItem, product) {
        itemElement.setAttribute('role', 'listitem');
        itemElement.setAttribute('aria-labelledby', `cart-item-name-${product.id}`);
        itemElement.setAttribute('aria-describedby', `cart-item-details-${product.id}`);
        
        // Add proper labels to quantity controls
        const quantityInput = itemElement.querySelector('.quantity-input');
        if (quantityInput) {
            quantityInput.setAttribute('aria-label', `Quantity for ${product.name}`);
            quantityInput.setAttribute('aria-describedby', `quantity-help-${product.id}`);
            
            // Add help text for quantity input
            const helpText = document.createElement('span');
            helpText.id = `quantity-help-${product.id}`;
            helpText.className = 'sr-only';
            helpText.textContent = 'Use arrow keys or type to change quantity. Set to 0 to remove item.';
            quantityInput.parentNode.appendChild(helpText);
        }
        
        // Enhance increment/decrement buttons
        const incrementBtn = itemElement.querySelector('.quantity-increment');
        if (incrementBtn) {
            incrementBtn.setAttribute('aria-label', `Increase quantity of ${product.name}`);
        }
        
        const decrementBtn = itemElement.querySelector('.quantity-decrement');
        if (decrementBtn) {
            decrementBtn.setAttribute('aria-label', `Decrease quantity of ${product.name}`);
        }
        
        const removeBtn = itemElement.querySelector('.remove-item-btn');
        if (removeBtn) {
            removeBtn.setAttribute('aria-label', `Remove ${product.name} from cart`);
        }
        
        return itemElement;
    }
}

// Initialize accessibility enhancements when UI module is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.uiModule) {
            window.uiAccessibilityEnhancer = new UIAccessibilityEnhancer(window.uiModule);
        }
    });
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIAccessibilityEnhancer };
} else if (typeof window !== 'undefined') {
    window.UIAccessibilityEnhancer = UIAccessibilityEnhancer;
}

/**
 * Focus Management and Announcements
 * Provides functions to trap focus within modals and announce messages to screen readers
 */

export function trapFocus(modalElement) {
  const focusable = modalElement.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
    if (e.key === 'Escape') {
      modalElement.close();
    }
  });
}

export function announce(message) {
  let region = document.getElementById('aria-live-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'aria-live-region';
    region.setAttribute('aria-live', 'polite');
    region.style.position = 'absolute';
    region.style.left = '-9999px';
    document.body.appendChild(region);
  }
  region.textContent = message;
}