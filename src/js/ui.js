/**
 * UI Module - Manages DOM manipulation and user interactions
 */

// Import error handler if available
let errorHandler;
if (typeof window !== 'undefined' && window.errorHandler) {
    errorHandler = window.errorHandler;
} else if (typeof global !== 'undefined' && global.errorHandler) {
    errorHandler = global.errorHandler;
}

/**
 * UI Module Class
 */
class UIModule {
    constructor() {
        this.elements = {};
        this.initialized = false;
        this.currentView = 'products'; // 'products' or 'cart'
        
        // Initialize when DOM is ready (only in browser environment)
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                this.initialize();
            }
        }
    }
    
    /**
     * Initializes the UI module
     */
    initialize() {
        if (this.initialized) return;
        
        // Skip initialization in Node.js environment
        if (typeof document === 'undefined') {
            this.initialized = true;
            return;
        }
        
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.renderProducts();
            this.initialized = true;
            console.log('UI Module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UI Module:', error.message);
            if (errorHandler) {
                errorHandler.showError('Failed to initialize application', {
                    context: 'ui-initialization'
                });
            }
        }
    }
    
    /**
     * Caches DOM elements for better performance
     */
    cacheElements() {
        if (typeof document === 'undefined') return;
        
        this.elements = {
            productList: document.getElementById('product-list'),
            cartItems: document.getElementById('cart-items'),
            cartCount: document.getElementById('cart-count'),
            cartTotal: document.getElementById('cart-total'),
            clearCartBtn: document.getElementById('clear-cart'),
            checkoutBtn: document.getElementById('checkout-btn'),
            checkoutModal: document.getElementById('checkout-modal'),
            checkoutItems: document.getElementById('checkout-items'),
            checkoutSubtotal: document.getElementById('checkout-subtotal'),
            checkoutTax: document.getElementById('checkout-tax'),
            checkoutTotal: document.getElementById('checkout-total'),
            closeCheckoutBtn: document.getElementById('close-checkout'),
            continueShoppingBtn: document.getElementById('continue-shopping'),
            placeOrderBtn: document.getElementById('place-order'),
            body: document.body
        };
        
        // Validate required elements exist
        const requiredElements = ['productList', 'cartItems', 'cartCount', 'cartTotal'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required element '${elementName}' not found in DOM`);
            }
        }
    }
    
    /**
     * Sets up event listeners with comprehensive validation and keyboard support
     */
    setupEventListeners() {
        // Product list event delegation with keyboard support
        if (this.elements.productList) {
            this.elements.productList.addEventListener('click', (e) => this.handleProductClick(e));
            this.elements.productList.addEventListener('keydown', (e) => this.handleProductKeydown(e));
        }
        
        // Cart items event delegation with validation
        if (this.elements.cartItems) {
            this.elements.cartItems.addEventListener('click', (e) => this.handleCartClick(e));
            this.elements.cartItems.addEventListener('input', (e) => this.handleCartInput(e));
            this.elements.cartItems.addEventListener('change', (e) => this.handleCartChange(e));
            this.elements.cartItems.addEventListener('keydown', (e) => this.handleCartKeydown(e));
            this.elements.cartItems.addEventListener('blur', (e) => this.handleCartBlur(e));
            
            // Add real-time validation to quantity inputs
            this.setupQuantityValidation();
        }
        
        // Clear cart button
        if (this.elements.clearCartBtn) {
            this.elements.clearCartBtn.addEventListener('click', () => this.handleClearCart());
        }
        
        // Checkout button
        if (this.elements.checkoutBtn) {
            this.elements.checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }
        
        // Checkout modal event listeners
        if (this.elements.closeCheckoutBtn) {
            this.elements.closeCheckoutBtn.addEventListener('click', () => this.closeCheckoutModal());
        }
        
        if (this.elements.continueShoppingBtn) {
            this.elements.continueShoppingBtn.addEventListener('click', () => this.closeCheckoutModal());
        }
        
        if (this.elements.placeOrderBtn) {
            this.elements.placeOrderBtn.addEventListener('click', () => this.handlePlaceOrder());
        }
        
        // Close modal when clicking outside
        if (this.elements.checkoutModal) {
            this.elements.checkoutModal.addEventListener('click', (e) => {
                if (e.target === this.elements.checkoutModal) {
                    this.closeCheckoutModal();
                }
            });
        }
        
        // Listen to cart changes
        cartModule.addListener((event, data) => this.handleCartChangeEvent(event, data));
        
        // Handle window resize for responsive updates (only in browser)
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.handleResize());
        }
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Setup accessibility announcements
        this.setupAccessibilityAnnouncements();
    }
    
    /**
     * Sets up comprehensive validation for quantity inputs
     */
    setupQuantityValidation() {
        if (typeof inputValidator === 'undefined') {
            return; // Skip if validation module not available
        }
        
        // Use event delegation to handle dynamically created quantity inputs
        if (this.elements.cartItems) {
            this.elements.cartItems.addEventListener('focusin', (e) => {
                if (e.target.classList.contains('quantity-input')) {
                    this.addQuantityValidation(e.target);
                }
            });
        }
    }
    
    /**
     * Adds real-time validation to a quantity input element
     * @param {HTMLInputElement} input - Quantity input element
     */
    addQuantityValidation(input) {
        if (!input || typeof inputValidator === 'undefined') return;
        
        // Skip if already has validation
        if (input._hasValidation) return;
        
        inputValidator.addRealTimeValidation(input, 'quantity', {
            showErrors: true,
            customRules: {
                min: 0,
                max: 999,
                integer: true
            },
            callback: (result, element) => {
                // Update cart if validation passes
                if (result.isValid && result.sanitizedValue !== null) {
                    const productId = parseInt(element.dataset.productId);
                    if (productId && result.sanitizedValue !== cartModule.getCartItem(productId)?.quantity) {
                        this.updateCartQuantity(productId, result.sanitizedValue);
                    }
                }
            }
        });
        
        input._hasValidation = true;
    }
    
    /**
     * Handles cart click events (remove buttons, etc.)
     * @param {Event} event - Click event
     */
    handleCartClick(event) {
        if (event.target.classList.contains('remove-item-btn')) {
            const productId = parseInt(event.target.dataset.productId);
            this.removeFromCart(productId);
        } else if (event.target.classList.contains('quantity-increment')) {
            const productId = parseInt(event.target.dataset.productId);
            this.incrementQuantity(productId);
        } else if (event.target.classList.contains('quantity-decrement')) {
            const productId = parseInt(event.target.dataset.productId);
            this.decrementQuantity(productId);
        }
    }
    
    /**
     * Handles cart input events (quantity changes)
     * @param {Event} event - Input event
     */
    handleCartInput(event) {
        if (event.target.classList.contains('quantity-input')) {
            // Real-time validation is handled by the validation system
            // This method can be used for additional UI feedback
            this.updateQuantityInputState(event.target);
        }
    }
    
    /**
     * Handles cart change events (when input loses focus)
     * @param {Event} event - Change event
     */
    handleCartChange(event) {
        if (event.target.classList.contains('quantity-input')) {
            const productId = parseInt(event.target.dataset.productId);
            const quantity = parseInt(event.target.value);
            
            // Validate and update quantity
            this.validateAndUpdateQuantity(productId, quantity, event.target);
        }
    }
    
    /**
     * Handles keydown events in cart inputs
     * @param {Event} event - Keydown event
     */
    handleCartKeydown(event) {
        if (event.target.classList.contains('quantity-input')) {
            // Allow only numeric input and control keys
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
            
            if (!allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
                // Check if it's a number
                if (!/^\d$/.test(event.key)) {
                    event.preventDefault();
                    this.showInputError(event.target, 'Only numbers are allowed');
                }
            }
            
            // Handle Enter key
            if (event.key === 'Enter') {
                event.target.blur(); // Trigger change event
            }
        }
    }
    
    /**
     * Handles blur events in cart inputs
     * @param {Event} event - Blur event
     */
    handleCartBlur(event) {
        if (event.target.classList.contains('quantity-input')) {
            // Final validation when input loses focus
            const productId = parseInt(event.target.dataset.productId);
            const quantity = parseInt(event.target.value);
            
            this.validateAndUpdateQuantity(productId, quantity, event.target);
        }
    }
    
    /**
     * Validates and updates cart quantity with comprehensive error handling
     * @param {number} productId - Product ID
     * @param {number} quantity - New quantity
     * @param {HTMLInputElement} inputElement - Input element (optional)
     */
    validateAndUpdateQuantity(productId, quantity, inputElement = null) {
        try {
            // Use comprehensive validation if available
            if (typeof inputValidator !== 'undefined') {
                const quantityResult = inputValidator.validateQuantity(quantity);
                
                if (!quantityResult.isValid) {
                    if (inputElement) {
                        this.showInputError(inputElement, quantityResult.errors.join(', '));
                        // Reset to previous valid value
                        const currentItem = cartModule.getCartItem(productId);
                        if (currentItem) {
                            inputElement.value = currentItem.quantity;
                        }
                    }
                    return;
                }
                
                quantity = quantityResult.sanitizedValue;
            }
            
            // Update cart quantity
            this.updateCartQuantity(productId, quantity);
            
            if (inputElement) {
                this.clearInputError(inputElement);
            }
            
        } catch (error) {
            console.error('Error updating quantity:', error.message);
            
            if (inputElement) {
                this.showInputError(inputElement, error.message);
                // Reset to previous valid value
                const currentItem = cartModule.getCartItem(productId);
                if (currentItem) {
                    inputElement.value = currentItem.quantity;
                }
            }
            
            if (errorHandler) {
                errorHandler.handleValidationError(error, 'quantity-update');
            }
        }
    }
    
    /**
     * Updates cart quantity
     * @param {number} productId - Product ID
     * @param {number} quantity - New quantity
     */
    updateCartQuantity(productId, quantity) {
        try {
            if (quantity === 0) {
                cartModule.removeItem(productId);
            } else {
                cartModule.updateQuantity(productId, quantity);
            }
        } catch (error) {
            throw new Error(`Failed to update cart: ${error.message}`);
        }
    }
    
    /**
     * Increments quantity for a product
     * @param {number} productId - Product ID
     */
    incrementQuantity(productId) {
        try {
            const currentItem = cartModule.getCartItem(productId);
            if (currentItem) {
                const newQuantity = currentItem.quantity + 1;
                
                // Validate new quantity
                if (typeof inputValidator !== 'undefined') {
                    const result = inputValidator.validateQuantity(newQuantity);
                    if (!result.isValid) {
                        if (errorHandler) {
                            errorHandler.showError(`Cannot increase quantity: ${result.errors.join(', ')}`, {
                                context: 'quantity-increment'
                            });
                        }
                        return;
                    }
                }
                
                this.updateCartQuantity(productId, newQuantity);
            }
        } catch (error) {
            if (errorHandler) {
                errorHandler.handleCartError(error, 'increment quantity');
            }
        }
    }
    
    /**
     * Decrements quantity for a product
     * @param {number} productId - Product ID
     */
    decrementQuantity(productId) {
        try {
            const currentItem = cartModule.getCartItem(productId);
            if (currentItem) {
                const newQuantity = Math.max(0, currentItem.quantity - 1);
                this.updateCartQuantity(productId, newQuantity);
            }
        } catch (error) {
            if (errorHandler) {
                errorHandler.handleCartError(error, 'decrement quantity');
            }
        }
    }
    
    /**
     * Removes item from cart
     * @param {number} productId - Product ID to remove
     */
    removeFromCart(productId) {
        try {
            cartModule.removeItem(productId);
            
            if (errorHandler) {
                errorHandler.showSuccess('Item removed from cart', {
                    context: 'remove-item'
                });
            }
        } catch (error) {
            if (errorHandler) {
                errorHandler.handleCartError(error, 'remove item');
            }
        }
    }
    
    /**
     * Shows input validation error
     * @param {HTMLInputElement} input - Input element
     * @param {string} message - Error message
     */
    showInputError(input, message) {
        if (!input || typeof document === 'undefined') return;
        
        // Add error styling
        input.classList.add('border-red-500', 'bg-red-50');
        input.classList.remove('border-green-500', 'bg-green-50');
        
        // Show error message if inputValidator is available
        if (typeof inputValidator !== 'undefined') {
            inputValidator.showElementErrors(input, [message]);
        } else {
            // Fallback error display
            this.createNotification(message, 'error');
        }
    }
    
    /**
     * Clears input validation error
     * @param {HTMLInputElement} input - Input element
     */
    clearInputError(input) {
        if (!input || typeof document === 'undefined') return;
        
        // Remove error styling
        input.classList.remove('border-red-500', 'bg-red-50');
        input.classList.add('border-green-500', 'bg-green-50');
        
        // Clear error message if inputValidator is available
        if (typeof inputValidator !== 'undefined') {
            inputValidator.clearElementErrors(input);
        }
    }
    
    /**
     * Updates quantity input state based on validation
     * @param {HTMLInputElement} input - Quantity input element
     */
    updateQuantityInputState(input) {
        if (!input || typeof inputValidator === 'undefined') return;
        
        const result = inputValidator.validateQuantity(input.value);
        
        if (result.isValid) {
            this.clearInputError(input);
        } else {
            input.classList.add('border-yellow-500');
            input.classList.remove('border-green-500', 'border-red-500');
        }
    }
    
    /**
     * Renders products in a responsive grid layout with performance optimization
     */
    renderProducts() {
        if (!this.elements.productList) {
            console.error('Product list element not found');
            return;
        }
        
        try {
            const products = productsModule.getProducts();
            
            if (products.length === 0) {
                this.elements.productList.innerHTML = this.createEmptyState('No products available');
                return;
            }
            
            // Show loading state
            if (typeof performanceOptimizer !== 'undefined') {
                performanceOptimizer.showLoading(this.elements.productList, 'products');
            }
            
            // Use performance optimizer for large catalogs
            if (typeof performanceOptimizer !== 'undefined' && products.length > 20) {
                const renderResult = performanceOptimizer.optimizeProductRendering(
                    products,
                    this.elements.productList,
                    (product) => this.createProductCard(product)
                );
                
                console.log(`Rendered ${products.length} products using ${renderResult.type} rendering`);
            } else {
                // Standard rendering for smaller catalogs
                this.elements.productList.innerHTML = '';
                
                // Batch render products for better performance
                const batchSize = 10;
                let currentBatch = 0;
                
                const renderBatch = () => {
                    const start = currentBatch * batchSize;
                    const end = Math.min(start + batchSize, products.length);
                    
                    for (let i = start; i < end; i++) {
                        const productCard = this.createProductCard(products[i]);
                        this.elements.productList.appendChild(productCard);
                    }
                    
                    currentBatch++;
                    
                    if (end < products.length) {
                        // Schedule next batch
                        requestAnimationFrame(() => {
                            setTimeout(renderBatch, 0);
                        });
                    } else {
                        // Rendering complete
                        if (typeof performanceOptimizer !== 'undefined') {
                            performanceOptimizer.hideLoading('products');
                        }
                        console.log(`Rendered ${products.length} products in batches`);
                    }
                };
                
                renderBatch();
                return;
            }
            
            // Hide loading state
            if (typeof performanceOptimizer !== 'undefined') {
                performanceOptimizer.hideLoading('products');
            }
            
        } catch (error) {
            console.error('Error rendering products:', error.message);
            this.elements.productList.innerHTML = this.createErrorState('Failed to load products');
            
            if (typeof performanceOptimizer !== 'undefined') {
                performanceOptimizer.hideLoading('products');
            }
            
            if (errorHandler) {
                errorHandler.showError('Failed to load products', {
                    context: 'product-rendering'
                });
            }
        }
    }
    
    /**
     * Creates a product card element
     * @param {Product} product - Product instance
     * @returns {HTMLElement} Product card element
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
        
        card.innerHTML = `
            <div class="relative">
                <img 
                    src="${product.image}" 
                    alt="${product.name}"
                    class="w-full h-48 object-cover"
                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'"
                    loading="lazy"
                />
                <div class="absolute top-2 right-2">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${product.category}
                    </span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    ${product.name}
                </h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-3">
                    ${product.description}
                </p>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-blue-600">
                        $${product.getFormattedPrice()}
                    </span>
                    <button 
                        class="add-to-cart-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        data-product-id="${product.id}"
                        aria-label="Add ${product.name} to cart"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Handles product click events
     * @param {Event} event - Click event
     */
    handleProductClick(event) {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(event.target.dataset.productId);
            this.addToCart(productId);
        }
    }
    
    /**
     * Adds item to cart with UI feedback
     * @param {number} productId - Product ID
     * @param {number} quantity - Quantity to add
     */
    addToCart(productId, quantity = 1) {
        try {
            // Get product details for feedback
            const product = productsModule.getProductById(productId);
            if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
            }
            
            // Add item to cart
            cartModule.addItem(productId, quantity);
            
            // Show success feedback
            this.showAddToCartSuccess(product, quantity);
            
            // Add visual feedback to the button
            this.animateAddToCartButton(productId);
            
        } catch (error) {
            if (errorHandler) {
                errorHandler.handleCartError(error, 'add to cart');
            } else {
                this.showError(error.message);
            }
        }
    }
    
    /**
     * Shows success message for Add to Cart action
     * @param {Product} product - Product that was added
     * @param {number} quantity - Quantity added
     */
    showAddToCartSuccess(product, quantity) {
        const message = `Added ${quantity} ${product.name}${quantity > 1 ? 's' : ''} to cart`;
        if (errorHandler) {
            errorHandler.showSuccess(message, {
                context: 'add-to-cart'
            });
        } else {
            this.createNotification(message, 'success');
        }
    }
    
    /**
     * Animates Add to Cart button after successful addition
     * @param {number} productId - Product ID
     */
    animateAddToCartButton(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"] .add-to-cart-btn`);
        if (button) {
            // Add success animation
            button.classList.add('animate-pulse', 'bg-green-600');
            button.textContent = 'Added!';
            
            // Reset button after animation
            setTimeout(() => {
                button.classList.remove('animate-pulse', 'bg-green-600');
                button.textContent = 'Add to Cart';
            }, 1500);
        }
    }
    
    /**
     * Updates cart display with animations and transitions
     */
    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartTotal();
        this.renderCartItems();
        this.updateCheckoutButtonState();
    }
    
    /**
     * Updates cart count in header with animation
     */
    updateCartCount() {
        if (this.elements.cartCount) {
            const count = cartModule.getCartCount();
            const previousCount = parseInt(this.elements.cartCount.textContent) || 0;
            
            this.elements.cartCount.textContent = count;
            
            // Add visual feedback for count changes
            if (count > 0) {
                this.elements.cartCount.classList.add('bg-red-500', 'text-white');
                this.elements.cartCount.classList.remove('bg-gray-400', 'hidden');
                
                // Add bounce animation for count increases
                if (count > previousCount) {
                    this.elements.cartCount.classList.add('animate-bounce');
                    setTimeout(() => {
                        this.elements.cartCount.classList.remove('animate-bounce');
                    }, 1000);
                }
            } else {
                this.elements.cartCount.classList.add('bg-gray-400', 'hidden');
                this.elements.cartCount.classList.remove('bg-red-500', 'text-white');
            }
        }
    }
    
    /**
     * Updates cart total display
     */
    updateCartTotal() {
        if (this.elements.cartTotal) {
            const total = cartModule.getCartTotal();
            this.elements.cartTotal.textContent = `Total: $${total.toFixed(2)}`;
        }
    }
    
    /**
     * Renders cart items with smooth animations
     */
    renderCartItems() {
        if (!this.elements.cartItems) return;
        
        const items = cartModule.getCartItems();
        
        if (items.length === 0) {
            this.elements.cartItems.innerHTML = this.createEmptyCartState();
            return;
        }
        
        this.elements.cartItems.innerHTML = '';
        
        items.forEach((cartItem, index) => {
            const product = productsModule.getProductById(cartItem.productId);
            if (product) {
                const itemElement = this.createCartItemElement(cartItem, product);
                this.elements.cartItems.appendChild(itemElement);
            }
        });
    }
    
    /**
     * Creates a cart item element
     * @param {CartItem} cartItem - Cart item instance
     * @param {Product} product - Product instance
     * @returns {HTMLElement} Cart item element
     */
    createCartItemElement(cartItem, product) {
        const item = document.createElement('div');
        item.className = 'cart-item bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3';
        
        const subtotal = cartItem.getSubtotal(product.price);
        
        item.innerHTML = `
            <div class="flex items-center space-x-4">
                <img 
                    src="${product.image}" 
                    alt="${product.name}"
                    class="w-16 h-16 object-cover rounded-lg"
                />
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${product.name}</h4>
                    <p class="text-gray-600 text-sm">$${product.getFormattedPrice()} each</p>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-gray-900">$${subtotal.toFixed(2)}</div>
                    <div class="text-sm text-gray-500">Qty: ${cartItem.quantity}</div>
                </div>
            </div>
        `;
        
        // Add quantity controls after creating the basic item
        this.enhanceCartItemWithControls(item, cartItem, product);
        
        return item;
    }
    
    /**
     * Enhances cart item with quantity controls and validation
     * @param {HTMLElement} item - Cart item element
     * @param {CartItem} cartItem - Cart item instance
     * @param {Product} product - Product instance
     */
    enhanceCartItemWithControls(item, cartItem, product) {
        // Find the quantity display and replace with controls
        const quantityDisplay = item.querySelector('.text-sm.text-gray-500');
        if (quantityDisplay) {
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'flex items-center space-x-2 mt-2';
            
            controlsContainer.innerHTML = `
                <button 
                    class="quantity-decrement w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-product-id="${product.id}"
                    aria-label="Decrease quantity"
                    ${cartItem.quantity <= 1 ? 'disabled' : ''}
                >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                    </svg>
                </button>
                <input 
                    type="number" 
                    class="quantity-input w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value="${cartItem.quantity}"
                    min="0"
                    max="999"
                    data-product-id="${product.id}"
                    aria-label="Quantity for ${product.name}"
                />
                <button 
                    class="quantity-increment w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-product-id="${product.id}"
                    aria-label="Increase quantity"
                >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                </button>
                <button 
                    class="remove-item-btn text-red-500 hover:text-red-700 text-xs underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded ml-2"
                    data-product-id="${product.id}"
                    aria-label="Remove ${product.name} from cart"
                >
                    Remove
                </button>
            `;
            
            // Replace the quantity display with controls
            quantityDisplay.parentNode.replaceChild(controlsContainer, quantityDisplay);
        }
    }
    
    /**
     * Creates empty cart state
     * @returns {string} HTML string
     */
    createEmptyCartState() {
        return `
            <div class="empty-cart-state text-center py-8">
                <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                <p class="text-gray-500">Add some products to get started!</p>
            </div>
        `;
    }
    
    /**
     * Creates empty state for products
     * @param {string} message - Empty state message
     * @returns {string} HTML string
     */
    createEmptyState(message) {
        return `
            <div class="empty-state col-span-full flex flex-col items-center justify-center py-12">
                <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"></path>
                    </svg>
                </div>
                <p class="text-gray-500 text-lg">${message}</p>
            </div>
        `;
    }
    
    /**
     * Creates error state
     * @param {string} message - Error message
     * @returns {string} HTML string
     */
    createErrorState(message) {
        return `
            <div class="error-state col-span-full flex flex-col items-center justify-center py-12">
                <div class="text-red-400 mb-4">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                <p class="text-red-500 text-lg">${message}</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                    Retry
                </button>
            </div>
        `;
    }
    
    /**
     * Handles cart change events from cart module
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    handleCartChangeEvent(event, data) {
        // Handle real-time updates with animations
        switch (event) {
            case 'itemAdded':
                this.updateCartDisplay();
                break;
            case 'itemRemoved':
                this.updateCartDisplay();
                break;
            case 'quantityUpdated':
                this.updateCartDisplay();
                break;
            case 'cartCleared':
                this.handleCartClearedEvent();
                break;
            default:
                this.updateCartDisplay();
                break;
        }
    }
    
    /**
     * Handles cart cleared event with special animations
     */
    handleCartClearedEvent() {
        // Update all UI elements
        this.updateCartDisplay();
        
        // Add special animation for cart cleared state
        if (this.elements.cartItems) {
            this.elements.cartItems.classList.add('animate-pulse');
            setTimeout(() => {
                this.elements.cartItems.classList.remove('animate-pulse');
            }, 1000);
        }
        
        // Reset cart count with animation
        if (this.elements.cartCount) {
            this.elements.cartCount.classList.add('animate-bounce');
            setTimeout(() => {
                this.elements.cartCount.classList.remove('animate-bounce');
            }, 1000);
        }
    }
    
    /**
     * Handles window resize
     */
    handleResize() {
        // Responsive adjustments handled by Tailwind CSS
        this.updateResponsiveLayout();
    }
    
    /**
     * Updates responsive layout based on screen size
     */
    updateResponsiveLayout() {
        if (typeof window === 'undefined') return;
        
        const width = window.innerWidth;
        const isMobile = width < 640;
        const isTablet = width >= 640 && width < 1024;
        const isDesktop = width >= 1024;
        
        // Update body classes for responsive styling
        document.body.classList.toggle('mobile-layout', isMobile);
        document.body.classList.toggle('tablet-layout', isTablet);
        document.body.classList.toggle('desktop-layout', isDesktop);
        
        // Announce layout changes to screen readers
        this.announceToScreenReader(`Layout updated for ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'} view`);
    }
    
    /**
     * Sets up keyboard navigation for the application
     */
    setupKeyboardNavigation() {
        if (typeof document === 'undefined') return;
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }
            
            // Tab navigation improvements
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
            
            // Arrow key navigation for product grid
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowNavigation(e);
            }
        });
        
        // Focus management for modal
        this.setupModalFocusManagement();
    }
    
    /**
     * Handles product keydown events for keyboard navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleProductKeydown(event) {
        if (event.target.classList.contains('add-to-cart-btn')) {
            // Enter or Space to activate button
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const productId = parseInt(event.target.dataset.productId);
                this.addToCart(productId);
            }
        }
    }
    
    /**
     * Handles escape key press
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleEscapeKey(event) {
        // Close modal if open
        if (this.elements.checkoutModal && !this.elements.checkoutModal.classList.contains('hidden')) {
            this.closeCheckoutModal();
            event.preventDefault();
        }
    }
    
    /**
     * Handles tab navigation improvements
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleTabNavigation(event) {
        // Ensure proper focus order and skip hidden elements
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        if (event.shiftKey) {
            // Shift+Tab (backward)
            if (currentIndex === 0) {
                event.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
            }
        } else {
            // Tab (forward)
            if (currentIndex === focusableElements.length - 1) {
                event.preventDefault();
                focusableElements[0].focus();
            }
        }
    }
    
    /**
     * Handles arrow key navigation for product grid
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleArrowNavigation(event) {
        if (!this.elements.productList) return;
        
        const productCards = Array.from(this.elements.productList.querySelectorAll('.add-to-cart-btn'));
        const currentIndex = productCards.indexOf(document.activeElement);
        
        if (currentIndex === -1) return;
        
        let newIndex = currentIndex;
        const columns = this.getGridColumns();
        
        switch (event.key) {
            case 'ArrowUp':
                newIndex = Math.max(0, currentIndex - columns);
                break;
            case 'ArrowDown':
                newIndex = Math.min(productCards.length - 1, currentIndex + columns);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                newIndex = Math.min(productCards.length - 1, currentIndex + 1);
                break;
        }
        
        if (newIndex !== currentIndex) {
            event.preventDefault();
            productCards[newIndex].focus();
        }
    }
    
    /**
     * Gets the number of columns in the current grid layout
     * @returns {number} Number of columns
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
     * Gets all focusable elements in the document
     * @returns {Array} Array of focusable elements
     */
    getFocusableElements() {
        const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        return Array.from(document.querySelectorAll(selector)).filter(el => {
            return el.offsetParent !== null && !el.classList.contains('sr-only');
        });
    }
    
    /**
     * Sets up modal focus management
     */
    setupModalFocusManagement() {
        // Focus trap for checkout modal
        if (this.elements.checkoutModal) {
            this.elements.checkoutModal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocusInModal(e);
                }
            });
        }
    }
    
    /**
     * Traps focus within the modal
     * @param {KeyboardEvent} event - Keyboard event
     */
    trapFocusInModal(event) {
        const modal = this.elements.checkoutModal;
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
     * Sets up accessibility announcements
     */
    setupAccessibilityAnnouncements() {
        // Create live region if it doesn't exist
        if (typeof document !== 'undefined' && !document.getElementById('live-region')) {
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
     * @param {string} message - Message to announce
     * @param {string} priority - Priority level ('polite' or 'assertive')
     */
    announceToScreenReader(message, priority = 'polite') {
        if (typeof document === 'undefined') return;
        
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
     * Shows error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (errorHandler) {
            errorHandler.showError(message, {
                context: 'ui-general'
            });
        } else {
            this.createNotification(message, 'error');
        }
    }
    
    /**
     * Creates and shows a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white',
            warning: 'bg-yellow-500 text-black'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="ml-4 text-lg font-bold" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to DOM (only in browser)
        if (typeof document !== 'undefined') {
            document.body.appendChild(notification);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Handles clear cart button click with confirmation
     */
    handleClearCart() {
        try {
            // Check if cart is empty
            if (cartModule.isEmpty()) {
                if (errorHandler) {
                    errorHandler.showError('Cart is already empty', {
                        context: 'clear-cart'
                    });
                } else {
                    this.showError('Cart is already empty');
                }
                return;
            }
            
            // Show confirmation dialog
            const confirmed = this.showClearCartConfirmation();
            
            if (confirmed) {
                // Clear the cart
                cartModule.clearCart();
                
                // Show success message
                if (errorHandler) {
                    errorHandler.showSuccess('Cart cleared successfully', {
                        context: 'clear-cart'
                    });
                } else {
                    this.createNotification('Cart cleared successfully', 'success');
                }
                
                // Update all UI elements immediately
                this.updateCartDisplay();
            }
            
        } catch (error) {
            console.error('Error clearing cart:', error.message);
            if (errorHandler) {
                errorHandler.handleCartError(error, 'clear cart');
            } else {
                this.showError('Failed to clear cart: ' + error.message);
            }
        }
    }
    
    /**
     * Shows confirmation dialog for clearing cart
     * @returns {boolean} True if user confirmed
     */
    showClearCartConfirmation() {
        const itemCount = cartModule.getCartCount();
        const message = `Are you sure you want to clear your cart? This will remove all ${itemCount} item${itemCount !== 1 ? 's' : ''} from your cart.`;
        
        // Use native confirm dialog for now (can be enhanced with custom modal later)
        return confirm(message);
    }
    
    /**
     * Handles checkout button click
     */
    handleCheckout() {
        try {
            // Check if cart is empty
            if (cartModule.isEmpty()) {
                if (errorHandler) {
                    errorHandler.showError('Your cart is empty. Add some items before checkout.', {
                        context: 'checkout'
                    });
                } else {
                    this.showError('Your cart is empty. Add some items before checkout.');
                }
                return;
            }
            
            // Show checkout modal
            this.showCheckoutModal();
            
        } catch (error) {
            console.error('Error during checkout:', error.message);
            if (errorHandler) {
                errorHandler.handleCartError(error, 'checkout');
            } else {
                this.showError('Failed to proceed to checkout: ' + error.message);
            }
        }
    }
    
    /**
     * Shows the checkout modal with order summary
     */
    showCheckoutModal() {
        if (!this.elements.checkoutModal) {
            console.error('Checkout modal element not found');
            return;
        }
        
        try {
            // Get cart summary
            const summary = cartModule.getCartSummary();
            
            // Render checkout items
            this.renderCheckoutItems(summary.items);
            
            // Update totals
            this.updateCheckoutTotals(summary);
            
            // Show modal
            this.elements.checkoutModal.classList.remove('hidden');
            
            // Focus management for accessibility
            if (this.elements.closeCheckoutBtn) {
                this.elements.closeCheckoutBtn.focus();
            }
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error showing checkout modal:', error.message);
            if (errorHandler) {
                errorHandler.showError('Failed to display checkout summary', {
                    context: 'checkout-modal'
                });
            } else {
                this.showError('Failed to display checkout summary');
            }
        }
    }
    
    /**
     * Closes the checkout modal
     */
    closeCheckoutModal() {
        if (this.elements.checkoutModal) {
            this.elements.checkoutModal.classList.add('hidden');
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Return focus to checkout button
            if (this.elements.checkoutBtn) {
                this.elements.checkoutBtn.focus();
            }
        }
    }
    
    /**
     * Renders checkout items in the modal
     * @param {Array} items - Array of cart items with product details
     */
    renderCheckoutItems(items) {
        if (!this.elements.checkoutItems) {
            console.error('Checkout items element not found');
            return;
        }
        
        if (items.length === 0) {
            this.elements.checkoutItems.innerHTML = this.createEmptyCheckoutState();
            return;
        }
        
        this.elements.checkoutItems.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = this.createCheckoutItemElement(item);
            this.elements.checkoutItems.appendChild(itemElement);
        });
    }
    
    /**
     * Creates a checkout item element
     * @param {Object} item - Item with product, quantity, and subtotal
     * @returns {HTMLElement} Checkout item element
     */
    createCheckoutItemElement(item) {
        const element = document.createElement('div');
        element.className = 'checkout-item flex items-center justify-between p-4 bg-gray-50 rounded-lg';
        
        element.innerHTML = `
            <div class="flex items-center space-x-4">
                <img 
                    src="${item.product.image}" 
                    alt="${item.product.name}"
                    class="w-16 h-16 object-cover rounded-lg"
                    onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI4IiBjeT0iMjgiIHI9IjMiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+PC9wYXRoPgo8L3N2Zz4K'"
                />
                <div>
                    <h4 class="font-semibold text-gray-900">${item.product.name}</h4>
                    <p class="text-sm text-gray-600">${item.product.getFormattedPrice()} × ${item.quantity}</p>
                </div>
            </div>
            <div class="text-right">
                <div class="font-semibold text-gray-900">$${item.subtotal.toFixed(2)}</div>
                <div class="text-sm text-gray-500">Qty: ${item.quantity}</div>
            </div>
        `;
        
        return element;
    }
    
    /**
     * Updates checkout totals display
     * @param {Object} summary - Cart summary with totals
     */
    updateCheckoutTotals(summary) {
        const tax = summary.subtotal * 0.08; // 8% tax rate
        const total = summary.subtotal + tax;
        
        if (this.elements.checkoutSubtotal) {
            this.elements.checkoutSubtotal.textContent = `$${summary.subtotal.toFixed(2)}`;
        }
        
        if (this.elements.checkoutTax) {
            this.elements.checkoutTax.textContent = `$${tax.toFixed(2)}`;
        }
        
        if (this.elements.checkoutTotal) {
            this.elements.checkoutTotal.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    /**
     * Creates empty checkout state
     * @returns {string} HTML string
     */
    createEmptyCheckoutState() {
        return `
            <div class="empty-checkout-state text-center py-8">
                <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">No items to checkout</h3>
                <p class="text-gray-500">Your cart is empty. Add some products first!</p>
            </div>
        `;
    }
    
    /**
     * Handles place order button click
     */
    handlePlaceOrder() {
        try {
            // Get final cart summary
            const summary = cartModule.getCartSummary();
            
            if (summary.items.length === 0) {
                throw new Error('Cannot place order with empty cart');
            }
            
            // Calculate final total with tax
            const tax = summary.subtotal * 0.08;
            const finalTotal = summary.subtotal + tax;
            
            // Show order confirmation
            const orderNumber = this.generateOrderNumber();
            const confirmationMessage = `Order #${orderNumber} placed successfully!\n\nTotal: $${finalTotal.toFixed(2)}\nItems: ${summary.itemCount}\n\nThank you for your purchase!`;
            
            // Clear cart after successful order
            cartModule.clearCart();
            
            // Close modal
            this.closeCheckoutModal();
            
            // Show success message
            if (errorHandler) {
                errorHandler.showSuccess(confirmationMessage, {
                    context: 'order-placed',
                    duration: 8000
                });
            } else {
                alert(confirmationMessage);
            }
            
            // Update UI
            this.updateCartDisplay();
            
        } catch (error) {
            console.error('Error placing order:', error.message);
            if (errorHandler) {
                errorHandler.handleCartError(error, 'place order');
            } else {
                this.showError('Failed to place order: ' + error.message);
            }
        }
    }
    
    /**
     * Generates a random order number
     * @returns {string} Order number
     */
    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${timestamp}${random}`;
    }
    
    /**
     * Updates checkout button state based on cart contents
     */
    updateCheckoutButtonState() {
        if (this.elements.checkoutBtn) {
            const isEmpty = cartModule.isEmpty();
            
            if (isEmpty) {
                this.elements.checkoutBtn.disabled = true;
                this.elements.checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                this.elements.checkoutBtn.classList.remove('hover:bg-green-600');
            } else {
                this.elements.checkoutBtn.disabled = false;
                this.elements.checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                this.elements.checkoutBtn.classList.add('hover:bg-green-600');
            }
        }
    }

    // Placeholder methods for compatibility
    handleCartClick() {}
    handleCartInput() {}
    handleCartKeydown() {}
    handleCartBlur() {}
}

// Create global UI instance
const uiModule = new UIModule();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIModule, uiModule };
    // Make available globally for Node.js testing
    global.UIModule = UIModule;
    global.uiModule = uiModule;
} else {
    window.UIModule = UIModule;
    window.uiModule = uiModule;
}