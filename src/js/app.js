/**
 * Main Application Initialization Module
 * Coordinates startup, module loading, and error recovery
 */

/**
 * Application class that manages the entire shopping cart application
 */
class ShoppingCartApp {
    constructor() {
        this.modules = new Map();
        this.initialized = false;
        this.startupErrors = [];
        this.dependencies = new Map();
        this.initializationOrder = [];
        
        // Define module dependencies
        this.setupDependencies();
        
        // Initialize when DOM is ready
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                // DOM already loaded, initialize immediately
                setTimeout(() => this.initialize(), 0);
            }
        }
    }
    
    /**
     * Sets up module dependencies and initialization order
     */
    setupDependencies() {
        // Define dependencies - modules that must be loaded before others
        this.dependencies.set('errorHandler', []);
        this.dependencies.set('models', []);
        this.dependencies.set('validation', ['errorHandler']);
        this.dependencies.set('products', ['models', 'errorHandler']);
        this.dependencies.set('cart', ['models', 'products', 'errorHandler', 'validation']);
        this.dependencies.set('ui', ['products', 'cart', 'errorHandler', 'validation']);
        this.dependencies.set('accessibility', ['ui']);
        
        // Calculate initialization order based on dependencies
        this.initializationOrder = this.calculateInitializationOrder();
    }
    
    /**
     * Calculates the correct initialization order based on dependencies
     * @returns {Array} Array of module names in initialization order
     */
    calculateInitializationOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        
        const visit = (moduleName) => {
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected involving ${moduleName}`);
            }
            
            if (visited.has(moduleName)) {
                return;
            }
            
            visiting.add(moduleName);
            
            const deps = this.dependencies.get(moduleName) || [];
            for (const dep of deps) {
                visit(dep);
            }
            
            visiting.delete(moduleName);
            visited.add(moduleName);
            order.push(moduleName);
        };
        
        // Visit all modules
        for (const moduleName of this.dependencies.keys()) {
            visit(moduleName);
        }
        
        return order;
    }
    
    /**
     * Main initialization method
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Application already initialized');
            return;
        }
        
        console.log('Initializing Shopping Cart Application...');
        
        try {
            // Check for required global objects
            await this.checkRequiredGlobals();
            
            // Initialize modules in dependency order
            await this.initializeModules();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize cart from storage
            await this.initializeCartFromStorage();
            
            // Perform initial UI render
            await this.performInitialRender();
            
            // Set up error recovery mechanisms
            this.setupErrorRecovery();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('Shopping Cart Application initialized successfully');
            
            // Show success message if no startup errors
            if (this.startupErrors.length === 0) {
                this.showStartupSuccess();
            } else {
                this.showStartupWarnings();
            }
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleStartupError(error);
        }
    }
    
    /**
     * Checks for required global objects and modules
     */
    async checkRequiredGlobals() {
        const requiredGlobals = [
            { name: 'Product', type: 'function' },
            { name: 'CartItem', type: 'function' },
            { name: 'ErrorHandler', type: 'function' },
            { name: 'errorHandler', type: 'object' }
        ];
        
        const missing = [];
        
        for (const global of requiredGlobals) {
            if (typeof window !== 'undefined') {
                if (typeof window[global.name] !== global.type) {
                    missing.push(global.name);
                }
            } else if (typeof global !== 'undefined') {
                if (typeof global[global.name] !== global.type) {
                    missing.push(global.name);
                }
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Missing required globals: ${missing.join(', ')}`);
        }
    }
    
    /**
     * Initializes all modules in the correct order
     */
    async initializeModules() {
        for (const moduleName of this.initializationOrder) {
            try {
                await this.initializeModule(moduleName);
            } catch (error) {
                this.startupErrors.push({
                    module: moduleName,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`Failed to initialize ${moduleName} module:`, error);
                
                // Decide whether to continue or abort based on module criticality
                if (this.isCriticalModule(moduleName)) {
                    throw new Error(`Critical module ${moduleName} failed to initialize: ${error.message}`);
                }
            }
        }
    }
    
    /**
     * Initializes a specific module
     * @param {string} moduleName - Name of the module to initialize
     */
    async initializeModule(moduleName) {
        console.log(`Initializing ${moduleName} module...`);
        
        switch (moduleName) {
            case 'errorHandler':
                await this.initializeErrorHandler();
                break;
                
            case 'models':
                await this.initializeModels();
                break;
                
            case 'validation':
                await this.initializeValidation();
                break;
                
            case 'products':
                await this.initializeProducts();
                break;
                
            case 'cart':
                await this.initializeCart();
                break;
                
            case 'ui':
                await this.initializeUI();
                break;
                
            case 'accessibility':
                await this.initializeAccessibility();
                break;
                
            default:
                console.warn(`Unknown module: ${moduleName}`);
        }
        
        this.modules.set(moduleName, { initialized: true, timestamp: Date.now() });
    }
    
    /**
     * Initializes the error handler module
     */
    async initializeErrorHandler() {
        // Error handler should already be initialized by its own script
        // Just verify it's working
        if (typeof errorHandler !== 'undefined' && errorHandler.showInfo) {
            // Test the error handler
            console.log('Error handler module verified');
        } else {
            throw new Error('Error handler not properly initialized');
        }
    }
    
    /**
     * Initializes the data models
     */
    async initializeModels() {
        // Verify Product and CartItem classes are available
        if (typeof Product === 'undefined' || typeof CartItem === 'undefined') {
            throw new Error('Data model classes not available');
        }
        
        // Test model creation
        try {
            const testProduct = new Product(1, 'Test', 'Test product', 9.99, 'test.jpg');
            const testCartItem = new CartItem(1, 1);
            console.log('Data models verified');
        } catch (error) {
            throw new Error(`Model validation failed: ${error.message}`);
        }
    }
    
    /**
     * Initializes the validation module
     */
    async initializeValidation() {
        // Check if validation module is available
        if (typeof InputValidator !== 'undefined') {
            if (typeof inputValidator === 'undefined') {
                // Create global instance if it doesn't exist
                window.inputValidator = new InputValidator();
            }
            console.log('Validation module initialized');
        } else {
            console.warn('Validation module not available - using fallback validation');
        }
    }
    
    /**
     * Initializes the products module
     */
    async initializeProducts() {
        if (typeof productsModule === 'undefined') {
            throw new Error('Products module not available');
        }
        
        // Verify products are loaded
        const products = productsModule.getProducts();
        if (products.length === 0) {
            console.warn('No products loaded - this may be intentional');
        } else {
            console.log(`Products module initialized with ${products.length} products`);
        }
    }
    
    /**
     * Initializes the cart module
     */
    async initializeCart() {
        if (typeof cartModule === 'undefined') {
            throw new Error('Cart module not available');
        }
        
        // Set up cart event listeners for UI updates
        cartModule.addListener((event, data, cart) => {
            this.handleCartEvent(event, data, cart);
        });
        
        console.log('Cart module initialized');
    }
    
    /**
     * Initializes the UI module
     */
    async initializeUI() {
        if (typeof uiModule === 'undefined') {
            throw new Error('UI module not available');
        }
        
        // UI module should initialize itself, just verify it's working
        if (!uiModule.initialized) {
            // Force initialization if needed
            uiModule.initialize();
        }
        
        console.log('UI module initialized');
    }
    
    /**
     * Initializes accessibility features
     */
    async initializeAccessibility() {
        // Check if accessibility module is available
        if (typeof UIAccessibility !== 'undefined') {
            if (typeof uiAccessibility === 'undefined') {
                window.uiAccessibility = new UIAccessibility();
            }
            console.log('Accessibility module initialized');
        } else {
            console.warn('Accessibility module not available');
        }
    }
    
    /**
     * Sets up global event listeners
     */
    setupGlobalEventListeners() {
        if (typeof window === 'undefined') return;
        
        // Handle window errors
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, 'window-error');
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, 'unhandled-promise');
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });
        
        console.log('Global event listeners set up');
    }
    
    /**
     * Initializes cart from storage
     */
    async initializeCartFromStorage() {
        try {
            // Cart module should automatically load from storage during initialization
            // Just verify the process completed successfully
            const storageInfo = cartModule.getStorageInfo();
            
            if (storageInfo.hasStoredData) {
                console.log(`Cart loaded from storage: ${cartModule.getCartCount()} items`);
            } else {
                console.log('No stored cart data found - starting with empty cart');
            }
            
            if (storageInfo.sessionOnly) {
                console.warn('Cart running in session-only mode due to storage issues');
                if (errorHandler) {
                    errorHandler.showWarning('Cart data will not persist between sessions', {
                        context: 'storage-fallback'
                    });
                }
            }
            
        } catch (error) {
            console.error('Error initializing cart from storage:', error);
            if (errorHandler) {
                errorHandler.handleStorageError(error, 'cart-initialization');
            }
        }
    }
    
    /**
     * Performs initial UI render
     */
    async performInitialRender() {
        try {
            // Render products
            if (uiModule && uiModule.renderProducts) {
                uiModule.renderProducts();
            }
            
            // Update cart display
            if (uiModule && uiModule.updateCartDisplay) {
                uiModule.updateCartDisplay();
            }
            
            console.log('Initial UI render completed');
            
        } catch (error) {
            console.error('Error during initial render:', error);
            if (errorHandler) {
                errorHandler.showError('Failed to render initial interface', {
                    context: 'initial-render'
                });
            }
        }
    }
    
    /**
     * Sets up error recovery mechanisms
     */
    setupErrorRecovery() {
        // Set up periodic health checks
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Every 30 seconds
        
        // Set up storage recovery
        if (typeof DataRecovery !== 'undefined') {
            this.dataRecovery = new DataRecovery();
        }
        
        console.log('Error recovery mechanisms set up');
    }
    
    /**
     * Handles cart events for UI updates
     * @param {string} event - Event type
     * @param {Object} data - Event data
     * @param {Object} cart - Cart instance
     */
    handleCartEvent(event, data, cart) {
        try {
            // Update UI based on cart events
            if (uiModule && uiModule.updateCartDisplay) {
                uiModule.updateCartDisplay();
            }
            
            // Log significant events
            switch (event) {
                case 'itemAdded':
                    console.log(`Item ${data.productId} added to cart (quantity: ${data.quantity})`);
                    break;
                case 'itemRemoved':
                    console.log(`Item ${data.productId} removed from cart`);
                    break;
                case 'quantityUpdated':
                    console.log(`Item ${data.productId} quantity updated to ${data.quantity}`);
                    break;
                case 'cartCleared':
                    console.log('Cart cleared');
                    break;
            }
            
        } catch (error) {
            console.error('Error handling cart event:', error);
            if (errorHandler) {
                errorHandler.handleCartError(error, 'cart event handling');
            }
        }
    }
    
    /**
     * Handles global application errors
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where error occurred
     */
    handleGlobalError(error, context) {
        console.error(`Global error [${context}]:`, error);
        
        if (errorHandler) {
            errorHandler.showError(`Application error: ${error.message}`, {
                context: context,
                duration: 8000
            });
        }
        
        // Attempt recovery for certain types of errors
        this.attemptErrorRecovery(error, context);
    }
    
    /**
     * Attempts to recover from certain types of errors
     * @param {Error} error - The error to recover from
     * @param {string} context - Error context
     */
    attemptErrorRecovery(error, context) {
        // Storage-related error recovery
        if (error.message.includes('localStorage') || error.message.includes('storage')) {
            console.log('Attempting storage error recovery...');
            if (cartModule) {
                cartModule.sessionOnly = true;
            }
        }
        
        // UI-related error recovery
        if (context === 'ui-error' && uiModule) {
            console.log('Attempting UI error recovery...');
            setTimeout(() => {
                try {
                    uiModule.initialize();
                } catch (recoveryError) {
                    console.error('UI recovery failed:', recoveryError);
                }
            }, 1000);
        }
    }
    
    /**
     * Handles page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is now hidden - save cart state
            if (cartModule) {
                cartModule.saveToStorage();
            }
        } else {
            // Page is now visible - check for updates
            this.performHealthCheck();
        }
    }
    
    /**
     * Handles page unload
     */
    handlePageUnload() {
        // Save cart state before page unloads
        if (cartModule) {
            cartModule.saveToStorage();
        }
    }
    
    /**
     * Performs application health check
     */
    performHealthCheck() {
        const issues = [];
        
        // Check if modules are still responsive
        try {
            if (cartModule) {
                cartModule.getCartCount(); // Simple operation to test responsiveness
            }
            
            if (productsModule) {
                productsModule.getProducts(); // Test products module
            }
            
            if (uiModule && uiModule.elements) {
                // Check if required DOM elements still exist
                const requiredElements = ['productList', 'cartItems', 'cartCount'];
                for (const elementName of requiredElements) {
                    if (!uiModule.elements[elementName] || !document.contains(uiModule.elements[elementName])) {
                        issues.push(`Missing DOM element: ${elementName}`);
                    }
                }
            }
            
        } catch (error) {
            issues.push(`Module health check failed: ${error.message}`);
        }
        
        if (issues.length > 0) {
            console.warn('Health check issues detected:', issues);
            // Attempt to recover
            this.attemptHealthRecovery(issues);
        }
    }
    
    /**
     * Attempts to recover from health check issues
     * @param {Array} issues - Array of detected issues
     */
    attemptHealthRecovery(issues) {
        for (const issue of issues) {
            if (issue.includes('DOM element')) {
                // Try to re-cache DOM elements
                if (uiModule && uiModule.cacheElements) {
                    try {
                        uiModule.cacheElements();
                        console.log('DOM elements re-cached successfully');
                    } catch (error) {
                        console.error('Failed to re-cache DOM elements:', error);
                    }
                }
            }
        }
    }
    
    /**
     * Checks if a module is critical for application functionality
     * @param {string} moduleName - Name of the module
     * @returns {boolean} True if module is critical
     */
    isCriticalModule(moduleName) {
        const criticalModules = ['errorHandler', 'models', 'products', 'cart', 'ui'];
        return criticalModules.includes(moduleName);
    }
    
    /**
     * Shows startup success message
     */
    showStartupSuccess() {
        if (errorHandler) {
            errorHandler.showSuccess('Shopping cart application loaded successfully!', {
                context: 'startup',
                duration: 3000
            });
        }
    }
    
    /**
     * Shows startup warnings if there were non-critical errors
     */
    showStartupWarnings() {
        if (errorHandler && this.startupErrors.length > 0) {
            const nonCriticalErrors = this.startupErrors.filter(error => 
                !this.isCriticalModule(error.module)
            );
            
            if (nonCriticalErrors.length > 0) {
                errorHandler.showWarning(
                    `Application started with ${nonCriticalErrors.length} non-critical issues. Some features may be limited.`,
                    {
                        context: 'startup-warnings',
                        duration: 6000
                    }
                );
            }
        }
    }
    
    /**
     * Handles critical startup errors
     * @param {Error} error - The startup error
     */
    handleStartupError(error) {
        console.error('Critical startup error:', error);
        
        // Show error message to user
        if (typeof document !== 'undefined') {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'fixed top-0 left-0 w-full bg-red-600 text-white p-4 z-50';
            errorContainer.innerHTML = `
                <div class="container mx-auto">
                    <h2 class="text-lg font-bold mb-2">Application Failed to Start</h2>
                    <p class="mb-2">${error.message}</p>
                    <button onclick="location.reload()" class="bg-red-800 hover:bg-red-900 px-4 py-2 rounded">
                        Reload Page
                    </button>
                </div>
            `;
            document.body.insertBefore(errorContainer, document.body.firstChild);
        }
    }
    
    /**
     * Gets application status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            modules: Object.fromEntries(this.modules),
            startupErrors: this.startupErrors,
            cartItems: cartModule ? cartModule.getCartCount() : 0,
            products: productsModule ? productsModule.getProducts().length : 0
        };
    }
    
    /**
     * Restarts the application (for recovery purposes)
     */
    async restart() {
        console.log('Restarting application...');
        
        // Reset state
        this.initialized = false;
        this.modules.clear();
        this.startupErrors = [];
        
        // Clear any existing error messages
        if (errorHandler) {
            errorHandler.dismissAll();
        }
        
        // Re-initialize
        await this.initialize();
    }
}

// Create and start the application
const shoppingCartApp = new ShoppingCartApp();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCartApp, shoppingCartApp };
    global.ShoppingCartApp = ShoppingCartApp;
    global.shoppingCartApp = shoppingCartApp;
} else {
    window.ShoppingCartApp = ShoppingCartApp;
    window.shoppingCartApp = shoppingCartApp;
}