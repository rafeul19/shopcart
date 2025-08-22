/**
 * Cart Module - Manages cart state, operations, and persistence
 */

// Import error handler if available
let errorHandler;
if (typeof window !== 'undefined' && window.errorHandler) {
    errorHandler = window.errorHandler;
} else if (typeof global !== 'undefined' && global.errorHandler) {
    errorHandler = global.errorHandler;
}

/**
 * Cart Module Class
 */
class CartModule {
    constructor() {
        this.items = new Map(); // Using Map for better performance with product IDs
        this.listeners = new Set(); // Event listeners for cart changes
        this.storageKey = 'shopping-cart-items';
        this.timestampKey = 'shopping-cart-timestamp';
        this.sessionOnly = false; // Flag for fallback mode
        
        // Load cart from storage on initialization
        this.loadFromStorage();
    }
    
    /**
     * Adds item to cart with comprehensive validation
     * @param {number} productId - Product ID to add
     * @param {number} quantity - Quantity to add (default: 1)
     * @throws {Error} If validation fails
     */
    addItem(productId, quantity = 1) {
        // Use comprehensive validation if available
        if (typeof inputValidator !== 'undefined') {
            // Validate product ID
            const productIdResult = inputValidator.validateProductId(productId);
            if (!productIdResult.isValid) {
                throw new Error(`Invalid product ID: ${productIdResult.errors.join(', ')}`);
            }
            
            // Validate quantity
            const quantityResult = inputValidator.validateQuantity(quantity);
            if (!quantityResult.isValid) {
                throw new Error(`Invalid quantity: ${quantityResult.errors.join(', ')}`);
            }
            
            // Use sanitized values
            productId = productIdResult.sanitizedValue;
            quantity = quantityResult.sanitizedValue;
        } else {
            // Fallback validation
            if (typeof productId !== 'number' || productId <= 0) {
                throw new Error('Product ID must be a positive number');
            }
            
            if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
                throw new Error('Quantity must be a non-negative integer');
            }
        }
        
        if (quantity === 0) {
            return; // No-op for zero quantity
        }
        
        // Verify product exists
        const product = productsModule.getProductById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }
        
        try {
            // Check if item already exists in cart
            if (this.items.has(productId)) {
                const existingItem = this.items.get(productId);
                const newQuantity = existingItem.quantity + quantity;
                
                // Validate new total quantity
                if (typeof inputValidator !== 'undefined') {
                    const totalQuantityResult = inputValidator.validateQuantity(newQuantity);
                    if (!totalQuantityResult.isValid) {
                        throw new Error(`Total quantity would be invalid: ${totalQuantityResult.errors.join(', ')}`);
                    }
                }
                
                existingItem.updateQuantity(newQuantity);
            } else {
                // Create new cart item
                const cartItem = new CartItem(productId, quantity);
                this.items.set(productId, cartItem);
            }
            
            this._notifyListeners('itemAdded', { productId, quantity });
            this.saveToStorage();
        } catch (error) {
            throw new Error(`Failed to add item to cart: ${error.message}`);
        }
    }
    
    /**
     * Removes item from cart
     * @param {number} productId - Product ID to remove
     * @throws {Error} If product ID is invalid
     */
    removeItem(productId) {
        if (typeof productId !== 'number' || productId <= 0) {
            throw new Error('Product ID must be a positive number');
        }
        
        if (this.items.has(productId)) {
            this.items.delete(productId);
            this._notifyListeners('itemRemoved', { productId });
            this.saveToStorage();
        }
    }
    
    /**
     * Updates quantity of item in cart with comprehensive validation
     * @param {number} productId - Product ID to update
     * @param {number} quantity - New quantity
     * @throws {Error} If validation fails
     */
    updateQuantity(productId, quantity) {
        // Use comprehensive validation if available
        if (typeof inputValidator !== 'undefined') {
            // Validate product ID
            const productIdResult = inputValidator.validateProductId(productId);
            if (!productIdResult.isValid) {
                throw new Error(`Invalid product ID: ${productIdResult.errors.join(', ')}`);
            }
            
            // Validate quantity
            const quantityResult = inputValidator.validateQuantity(quantity);
            if (!quantityResult.isValid) {
                throw new Error(`Invalid quantity: ${quantityResult.errors.join(', ')}`);
            }
            
            // Use sanitized values
            productId = productIdResult.sanitizedValue;
            quantity = quantityResult.sanitizedValue;
        } else {
            // Fallback validation
            if (typeof productId !== 'number' || productId <= 0) {
                throw new Error('Product ID must be a positive number');
            }
            
            if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
                throw new Error('Quantity must be a non-negative integer');
            }
        }
        
        if (!this.items.has(productId)) {
            throw new Error(`Product with ID ${productId} not found in cart`);
        }
        
        if (quantity === 0) {
            // Remove item if quantity is zero
            this.removeItem(productId);
            return;
        }
        
        try {
            const cartItem = this.items.get(productId);
            cartItem.updateQuantity(quantity);
            this._notifyListeners('quantityUpdated', { productId, quantity });
            this.saveToStorage();
        } catch (error) {
            throw new Error(`Failed to update quantity: ${error.message}`);
        }
    }
    
    /**
     * Empties the entire cart
     */
    clearCart() {
        const itemCount = this.items.size;
        this.items.clear();
        
        if (itemCount > 0) {
            this._notifyListeners('cartCleared', {});
            this.saveToStorage();
        }
    }
    
    /**
     * Returns current cart contents
     * @returns {CartItem[]} Array of cart items
     */
    getCartItems() {
        return Array.from(this.items.values());
    }
    
    /**
     * Calculates total price of all items in cart
     * @returns {number} Total price
     */
    getCartTotal() {
        let total = 0;
        
        for (const cartItem of this.items.values()) {
            try {
                const product = productsModule.getProductById(cartItem.productId);
                if (product) {
                    total += cartItem.getSubtotal(product.price);
                }
            } catch (error) {
                console.error(`Error calculating total for product ${cartItem.productId}:`, error.message);
            }
        }
        
        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }
    
    /**
     * Returns total number of items in cart
     * @returns {number} Total item count
     */
    getCartCount() {
        let count = 0;
        for (const cartItem of this.items.values()) {
            count += cartItem.quantity;
        }
        return count;
    }
    
    /**
     * Gets cart item by product ID
     * @param {number} productId - Product ID
     * @returns {CartItem|null} Cart item or null if not found
     */
    getCartItem(productId) {
        if (typeof productId !== 'number') {
            return null;
        }
        return this.items.get(productId) || null;
    }
    
    /**
     * Checks if cart is empty
     * @returns {boolean} True if cart is empty
     */
    isEmpty() {
        return this.items.size === 0;
    }
    
    /**
     * Gets cart summary for checkout
     * @returns {Object} Cart summary with items and totals
     */
    getCartSummary() {
        const items = [];
        let subtotal = 0;
        
        for (const cartItem of this.items.values()) {
            try {
                const product = productsModule.getProductById(cartItem.productId);
                if (product) {
                    const itemSubtotal = cartItem.getSubtotal(product.price);
                    items.push({
                        product: product,
                        quantity: cartItem.quantity,
                        subtotal: itemSubtotal,
                        addedAt: cartItem.addedAt
                    });
                    subtotal += itemSubtotal;
                }
            } catch (error) {
                console.error(`Error getting summary for product ${cartItem.productId}:`, error.message);
            }
        }
        
        return {
            items: items,
            itemCount: this.getCartCount(),
            subtotal: Math.round(subtotal * 100) / 100,
            total: Math.round(subtotal * 100) / 100 // Can add tax/shipping later
        };
    }
    
    /**
     * Adds event listener for cart changes
     * @param {Function} listener - Callback function
     */
    addListener(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
        }
    }
    
    /**
     * Removes event listener
     * @param {Function} listener - Callback function to remove
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    
    /**
     * Notifies all listeners of cart changes
     * @private
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    _notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data, this);
            } catch (error) {
                console.error('Error in cart listener:', error.message);
            }
        }
    }
    
    /**
     * Saves cart data to localStorage with backup and error recovery
     */
    saveToStorage() {
        if (this.sessionOnly) {
            return; // Skip saving in session-only mode
        }
        
        try {
            const cartData = {
                items: Array.from(this.items.entries()).map(([productId, cartItem]) => ({
                    productId: productId,
                    quantity: cartItem.quantity,
                    addedAt: cartItem.addedAt
                })),
                timestamp: new Date().toISOString()
            };
            
            // Create backup before saving if data recovery is available
            if (typeof dataRecovery !== 'undefined') {
                const existingData = localStorage.getItem(this.storageKey);
                if (existingData) {
                    try {
                        const existingCartData = JSON.parse(existingData);
                        dataRecovery.createBackup(this.storageKey, existingCartData);
                    } catch (backupError) {
                        console.warn('Failed to create backup:', backupError.message);
                    }
                }
            }
            
            // Use graceful degradation for storage if available
            let storage = localStorage;
            if (typeof gracefulDegradation !== 'undefined' && !gracefulDegradation.isSupported('localStorage')) {
                storage = gracefulDegradation.getFeature('localStorage');
            }
            
            const serializedData = JSON.stringify(cartData);
            storage.setItem(this.storageKey, serializedData);
            storage.setItem(this.timestampKey, cartData.timestamp);
            
        } catch (error) {
            console.warn('Failed to save cart to localStorage:', error.message);
            this._handleStorageError(error);
            if (errorHandler) {
                errorHandler.handleStorageError(error, 'cart-save');
            }
        }
    }
    
    /**
     * Loads cart data from localStorage with comprehensive error recovery
     */
    loadFromStorage() {
        try {
            // Use data recovery if available
            if (typeof dataRecovery !== 'undefined') {
                const recoveryResult = dataRecovery.recoverData(this.storageKey, 'cart');
                
                if (recoveryResult.success && recoveryResult.data) {
                    const cartData = recoveryResult.data;
                    
                    // Log recovery strategy used
                    if (recoveryResult.strategy !== 'validation-passed') {
                        console.warn(`Cart data recovered using strategy: ${recoveryResult.strategy}`);
                        if (recoveryResult.errors.length > 0) {
                            console.warn('Recovery errors:', recoveryResult.errors);
                        }
                    }
                    
                    // Clear current items
                    this.items.clear();
                    
                    // Load recovered items
                    let loadedCount = 0;
                    let skippedCount = 0;
                    
                    for (const itemData of cartData.items) {
                        try {
                            // Additional validation with inputValidator if available
                            if (typeof inputValidator !== 'undefined') {
                                const productIdResult = inputValidator.validateProductId(itemData.productId);
                                const quantityResult = inputValidator.validateQuantity(itemData.quantity);
                                
                                if (!productIdResult.isValid || !quantityResult.isValid) {
                                    console.warn(`Invalid cart item data for product ${itemData.productId}, skipping`);
                                    skippedCount++;
                                    continue;
                                }
                            }
                            
                            // Verify product still exists
                            const product = productsModule.getProductById(itemData.productId);
                            if (!product) {
                                console.warn(`Product ${itemData.productId} no longer exists, skipping`);
                                skippedCount++;
                                continue;
                            }
                            
                            // Create cart item
                            const cartItem = CartItem.fromObject(itemData);
                            this.items.set(itemData.productId, cartItem);
                            loadedCount++;
                            
                        } catch (error) {
                            console.warn(`Failed to load cart item:`, error.message);
                            skippedCount++;
                        }
                    }
                    
                    if (loadedCount > 0) {
                        console.log(`Loaded ${loadedCount} items from cart storage`);
                    }
                    
                    if (skippedCount > 0) {
                        console.warn(`Skipped ${skippedCount} invalid items from storage`);
                        // Save cleaned cart back to storage
                        this.saveToStorage();
                    }
                    
                    return;
                }
            }
            
            // Fallback to original loading method
            const serializedData = localStorage.getItem(this.storageKey);
            
            if (!serializedData) {
                return; // No saved data
            }
            
            const cartData = JSON.parse(serializedData);
            
            // Validate data structure
            if (!cartData || !Array.isArray(cartData.items)) {
                throw new Error('Invalid cart data structure');
            }
            
            // Clear current items
            this.items.clear();
            
            // Load items with validation
            let loadedCount = 0;
            let skippedCount = 0;
            
            for (const itemData of cartData.items) {
                try {
                    // Validate item data
                    if (!itemData || typeof itemData.productId !== 'number' || typeof itemData.quantity !== 'number') {
                        throw new Error('Invalid item data');
                    }
                    
                    // Additional validation with inputValidator if available
                    if (typeof inputValidator !== 'undefined') {
                        const productIdResult = inputValidator.validateProductId(itemData.productId);
                        const quantityResult = inputValidator.validateQuantity(itemData.quantity);
                        
                        if (!productIdResult.isValid || !quantityResult.isValid) {
                            console.warn(`Invalid cart item data for product ${itemData.productId}, skipping`);
                            skippedCount++;
                            continue;
                        }
                    }
                    
                    // Verify product still exists
                    const product = productsModule.getProductById(itemData.productId);
                    if (!product) {
                        console.warn(`Product ${itemData.productId} no longer exists, skipping`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Create cart item
                    const cartItem = CartItem.fromObject(itemData);
                    this.items.set(itemData.productId, cartItem);
                    loadedCount++;
                    
                } catch (error) {
                    console.warn(`Failed to load cart item:`, error.message);
                    skippedCount++;
                }
            }
            
            if (loadedCount > 0) {
                console.log(`Loaded ${loadedCount} items from cart storage`);
            }
            
            if (skippedCount > 0) {
                console.warn(`Skipped ${skippedCount} invalid items from storage`);
                // Save cleaned cart back to storage
                this.saveToStorage();
            }
            
        } catch (error) {
            console.warn('Failed to load cart from localStorage:', error.message);
            this._handleStorageError(error);
            
            // Try to restore from backup if data recovery is available
            if (typeof dataRecovery !== 'undefined') {
                const restoreResult = dataRecovery.restoreFromBackup(this.storageKey);
                if (restoreResult.success) {
                    console.log('Restored cart from backup:', restoreResult.backupTimestamp);
                    // Retry loading with restored data
                    this.loadFromStorage();
                    return;
                }
            }
            
            // Clear corrupted data
            this._clearStorageData();
            
            if (errorHandler) {
                errorHandler.handleStorageError(error, 'cart-load');
            }
        }
    }
    
    /**
     * Clears all cart data from localStorage
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.timestampKey);
        } catch (error) {
            console.warn('Failed to clear cart storage:', error.message);
        }
    }
    
    /**
     * Gets storage information
     * @returns {Object} Storage status and info
     */
    getStorageInfo() {
        try {
            const hasData = localStorage.getItem(this.storageKey) !== null;
            const timestamp = localStorage.getItem(this.timestampKey);
            const isSessionOnly = this.sessionOnly;
            
            let dataSize = 0;
            if (hasData) {
                const data = localStorage.getItem(this.storageKey);
                dataSize = new Blob([data]).size;
            }
            
            return {
                hasStoredData: hasData,
                lastSaved: timestamp ? new Date(timestamp) : null,
                sessionOnly: isSessionOnly,
                dataSize: dataSize,
                storageAvailable: this._isStorageAvailable()
            };
            
        } catch (error) {
            return {
                hasStoredData: false,
                lastSaved: null,
                sessionOnly: true,
                dataSize: 0,
                storageAvailable: false,
                error: error.message
            };
        }
    }
    
    /**
     * Forces a reload from storage (useful for testing)
     */
    reloadFromStorage() {
        this.loadFromStorage();
    }
    
    /**
     * Handles storage errors and implements fallback strategies
     * @private
     * @param {Error} error - Storage error
     */
    _handleStorageError(error) {
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
            console.warn('localStorage quota exceeded, switching to session-only mode');
            this.sessionOnly = true;
            this._notifyListeners('storageQuotaExceeded', { error: error.message });
            
        } else if (error.name === 'SecurityError' || error.message.includes('access')) {
            console.warn('localStorage access denied, switching to session-only mode');
            this.sessionOnly = true;
            this._notifyListeners('storageAccessDenied', { error: error.message });
            
        } else {
            console.warn('localStorage error, continuing in session-only mode');
            this.sessionOnly = true;
            this._notifyListeners('storageError', { error: error.message });
        }
    }
    
    /**
     * Clears corrupted storage data
     * @private
     */
    _clearStorageData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.timestampKey);
            console.log('Cleared corrupted cart storage data');
        } catch (error) {
            console.warn('Failed to clear corrupted storage data:', error.message);
        }
    }
    
    /**
     * Checks if localStorage is available
     * @private
     * @returns {boolean} True if localStorage is available
     */
    _isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Validates cart state and fixes any issues
     * @returns {Object} Validation results
     */
    validateCart() {
        const issues = [];
        const validItems = new Map();
        
        for (const [productId, cartItem] of this.items.entries()) {
            try {
                // Validate cart item
                cartItem.validate();
                
                // Validate product still exists
                const product = productsModule.getProductById(productId);
                if (!product) {
                    issues.push(`Product ${productId} no longer exists`);
                    continue;
                }
                
                validItems.set(productId, cartItem);
            } catch (error) {
                issues.push(`Invalid cart item ${productId}: ${error.message}`);
            }
        }
        
        // Replace items with only valid ones
        this.items = validItems;
        
        return {
            isValid: issues.length === 0,
            issues: issues,
            fixedItemCount: this.items.size
        };
    }
}

// Create global cart instance
const cartModule = new CartModule();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartModule, cartModule };
    // Make available globally for Node.js testing
    global.CartModule = CartModule;
    global.cartModule = cartModule;
} else {
    window.CartModule = CartModule;
    window.cartModule = cartModule;
}