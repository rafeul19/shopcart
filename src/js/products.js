/**
 * Products Module - Manages product catalog and product-related operations
 */

/**
 * Sample product data for the shopping cart
 */
const SAMPLE_PRODUCTS = [
    {
        id: 1,
        name: "Wireless Headphones",
        description: "High quality wireless headphones with noise cancellation and 30-hour battery life.",
        price: 59.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
        category: "electronics"
    },
    {
        id: 2,
        name: "Smart Watch",
        description: "Track your fitness, notifications, and health metrics with this advanced smartwatch.",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
        category: "electronics"
    },
    {
        id: 3,
        name: "Bluetooth Speaker",
        description: "Portable speaker with deep bass, waterproof design, and 12-hour battery life.",
        price: 39.99,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
        category: "electronics"
    },
    {
        id: 4,
        name: "Fitness Tracker",
        description: "Monitor your health, steps, heart rate, and sleep patterns with this lightweight tracker.",
        price: 79.99,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop",
        category: "electronics"
    },
    {
        id: 5,
        name: "Laptop Stand",
        description: "Ergonomic aluminum laptop stand with adjustable height and cooling design.",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
        category: "accessories"
    },
    {
        id: 6,
        name: "Wireless Mouse",
        description: "Precision wireless mouse with ergonomic design and long-lasting battery.",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop",
        category: "accessories"
    },
    {
        id: 7,
        name: "USB-C Hub",
        description: "Multi-port USB-C hub with HDMI, USB 3.0, and fast charging capabilities.",
        price: 34.99,
        image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=300&fit=crop",
        category: "accessories"
    },
    {
        id: 8,
        name: "Phone Case",
        description: "Durable protective phone case with shock absorption and wireless charging support.",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300&h=300&fit=crop",
        category: "accessories"
    }
];

/**
 * Products Module Class
 */
class ProductsModule {
    constructor() {
        this.products = [];
        this.loadProducts();
    }
    
    /**
     * Loads and validates product data
     */
    loadProducts() {
        try {
            this.products = SAMPLE_PRODUCTS.map(productData => {
                try {
                    // Validate that we have the minimum required data
                    if (!productData || typeof productData !== 'object') {
                        throw new Error('Invalid product data structure');
                    }
                    
                    return Product.fromObject(productData);
                } catch (error) {
                    console.error(`Error loading product ${productData?.id || 'unknown'}:`, error.message);
                    return null;
                }
            }).filter(product => product !== null);
            
            if (this.products.length === 0) {
                console.warn('No valid products were loaded');
            } else {
                console.log(`Loaded ${this.products.length} products successfully`);
            }
        } catch (error) {
            console.error('Critical error loading products:', error.message);
            this.products = [];
            
            // Import error handler if available
            if (typeof window !== 'undefined' && window.errorHandler) {
                window.errorHandler.showError('Failed to load product catalog', {
                    context: 'product-initialization'
                });
            } else if (typeof global !== 'undefined' && global.errorHandler) {
                global.errorHandler.showError('Failed to load product catalog', {
                    context: 'product-initialization'
                });
            }
        }
    }
    
    /**
     * Returns array of all available products
     * @returns {Product[]} Array of Product instances
     */
    getProducts() {
        return [...this.products]; // Return a copy to prevent external modification
    }
    
    /**
     * Retrieves specific product by ID
     * @param {number} id - Product ID
     * @returns {Product|null} Product instance or null if not found
     */
    getProductById(id) {
        if (typeof id !== 'number') {
            throw new Error('Product ID must be a number');
        }
        
        const product = this.products.find(p => p.id === id);
        return product || null;
    }
    
    /**
     * Validates product data structure
     * @param {Object} product - Product data to validate
     * @returns {boolean} True if valid, throws error if invalid
     */
    validateProduct(product) {
        if (!product || typeof product !== 'object') {
            throw new Error('Product must be a valid object');
        }
        
        try {
            // Try to create a Product instance to validate
            new Product(
                product.id,
                product.name,
                product.description,
                product.price,
                product.image,
                product.category
            );
            return true;
        } catch (error) {
            throw new Error(`Product validation failed: ${error.message}`);
        }
    }
    
    /**
     * Gets products by category
     * @param {string} category - Category name
     * @returns {Product[]} Array of products in the category
     */
    getProductsByCategory(category) {
        if (typeof category !== 'string') {
            throw new Error('Category must be a string');
        }
        
        return this.products.filter(product => 
            product.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    /**
     * Searches products by name or description
     * @param {string} query - Search query
     * @returns {Product[]} Array of matching products
     */
    searchProducts(query) {
        if (typeof query !== 'string' || query.trim().length === 0) {
            return this.getProducts();
        }
        
        const searchTerm = query.toLowerCase().trim();
        return this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    /**
     * Gets available categories
     * @returns {string[]} Array of unique categories
     */
    getCategories() {
        const categories = [...new Set(this.products.map(p => p.category))];
        return categories.sort();
    }
}

// Create global instance
const productsModule = new ProductsModule();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductsModule, productsModule, SAMPLE_PRODUCTS };
    // Make available globally for Node.js testing
    global.ProductsModule = ProductsModule;
    global.productsModule = productsModule;
} else {
    window.ProductsModule = ProductsModule;
    window.productsModule = productsModule;
}