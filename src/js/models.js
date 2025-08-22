/**
 * Core data models for the Shopping Cart application
 */

/**
 * Product class representing a product in the catalog
 */
class Product {
    constructor(id, name, description, price, image, category = 'general') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.image = image;
        this.category = category;
        this.inStock = true;
        
        this.validate();
    }
    
    /**
     * Validates the product data
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.id || typeof this.id !== 'number') {
            throw new Error('Product ID must be a valid number');
        }
        
        if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
            throw new Error('Product name must be a non-empty string');
        }
        
        if (!this.description || typeof this.description !== 'string') {
            throw new Error('Product description must be a string');
        }
        
        if (typeof this.price !== 'number' || this.price < 0) {
            throw new Error('Product price must be a non-negative number');
        }
        
        if (!this.image || typeof this.image !== 'string') {
            throw new Error('Product image must be a valid string');
        }
        
        if (typeof this.category !== 'string') {
            throw new Error('Product category must be a string');
        }
    }
    
    /**
     * Returns formatted price string
     * @returns {string} Formatted price
     */
    getFormattedPrice() {
        return `$${this.price.toFixed(2)}`;
    }
    
    /**
     * Creates a Product instance from plain object
     * @param {Object} data - Product data
     * @returns {Product} Product instance
     */
    static fromObject(data) {
        return new Product(
            data.id,
            data.name,
            data.description,
            data.price,
            data.image,
            data.category
        );
    }
}

/**
 * CartItem class representing an item in the shopping cart
 */
class CartItem {
    constructor(productId, quantity = 1) {
        this.productId = productId;
        this.quantity = quantity;
        this.addedAt = new Date().toISOString();
        
        this.validate();
    }
    
    /**
     * Validates the cart item data
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.productId || typeof this.productId !== 'number') {
            throw new Error('Product ID must be a valid number');
        }
        
        if (typeof this.quantity !== 'number' || this.quantity < 0 || !Number.isInteger(this.quantity)) {
            throw new Error('Quantity must be a non-negative integer');
        }
    }
    
    /**
     * Updates the quantity with validation
     * @param {number} newQuantity - New quantity value
     * @throws {Error} If quantity is invalid
     */
    updateQuantity(newQuantity) {
        if (typeof newQuantity !== 'number' || newQuantity < 0 || !Number.isInteger(newQuantity)) {
            throw new Error('Quantity must be a non-negative integer');
        }
        this.quantity = newQuantity;
    }
    
    /**
     * Calculates subtotal for this cart item
     * @param {number} productPrice - Price of the product
     * @returns {number} Subtotal amount
     */
    getSubtotal(productPrice) {
        if (typeof productPrice !== 'number' || productPrice < 0) {
            throw new Error('Product price must be a non-negative number');
        }
        return this.quantity * productPrice;
    }
    
    /**
     * Creates a CartItem instance from plain object
     * @param {Object} data - Cart item data
     * @returns {CartItem} CartItem instance
     */
    static fromObject(data) {
        const item = new CartItem(data.productId, data.quantity);
        if (data.addedAt) {
            item.addedAt = data.addedAt;
        }
        return item;
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Product, CartItem };
    // Also make them global for Node.js testing
    global.Product = Product;
    global.CartItem = CartItem;
} else {
    window.Product = Product;
    window.CartItem = CartItem;
}