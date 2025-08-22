/**
 * Validation Module - Comprehensive client-side validation and input sanitization
 */

// Import error handler if available
let errorHandler;
if (typeof window !== 'undefined' && window.errorHandler) {
    errorHandler = window.errorHandler;
} else if (typeof global !== 'undefined' && global.errorHandler) {
    errorHandler = global.errorHandler;
}

/**
 * Input Validator Class - Handles all form validation and input sanitization
 */
class InputValidator {
    constructor() {
        this.validationRules = new Map();
        this.sanitizers = new Map();
        this.errorMessages = new Map();
        
        this.initializeDefaultRules();
        this.initializeDefaultSanitizers();
        this.initializeErrorMessages();
    }
    
    /**
     * Initializes default validation rules
     */
    initializeDefaultRules() {
        // Quantity validation rules
        this.validationRules.set('quantity', {
            required: true,
            type: 'number',
            min: 0,
            max: 999,
            integer: true,
            custom: (value) => {
                if (value === 0) return true; // Allow zero for removal
                return value > 0;
            }
        });
        
        // Product ID validation rules
        this.validationRules.set('productId', {
            required: true,
            type: 'number',
            min: 1,
            integer: true,
            custom: (value) => {
                // Check if product exists (if products module is available)
                if (typeof productsModule !== 'undefined') {
                    return productsModule.getProductById(value) !== null;
                }
                return true;
            }
        });
        
        // Price validation rules
        this.validationRules.set('price', {
            required: true,
            type: 'number',
            min: 0,
            max: 99999.99,
            precision: 2
        });
        
        // Text input validation rules
        this.validationRules.set('text', {
            required: false,
            type: 'string',
            minLength: 0,
            maxLength: 1000,
            pattern: /^[a-zA-Z0-9\s\-_.,!?()]*$/
        });
        
        // Email validation rules
        this.validationRules.set('email', {
            required: false,
            type: 'string',
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 254
        });
        
        // Phone validation rules
        this.validationRules.set('phone', {
            required: false,
            type: 'string',
            pattern: /^[\+]?[1-9][\d]{0,15}$/,
            minLength: 10,
            maxLength: 17
        });
    }
    
    /**
     * Initializes default input sanitizers
     */
    initializeDefaultSanitizers() {
        // Number sanitizer
        this.sanitizers.set('number', (value) => {
            if (value === null || value === undefined || value === '') {
                return null;
            }
            
            // If already a number, return it
            if (typeof value === 'number' && !isNaN(value)) {
                return value;
            }
            
            // Convert to string first to handle various input types
            const stringValue = String(value).trim();
            
            // Remove any non-numeric characters except decimal point and minus sign
            const cleaned = stringValue.replace(/[^\d.-]/g, '');
            
            // Parse as float
            const parsed = parseFloat(cleaned);
            
            // Return null if not a valid number
            return isNaN(parsed) ? null : parsed;
        });
        
        // Integer sanitizer
        this.sanitizers.set('integer', (value) => {
            const numberValue = this.sanitizers.get('number')(value);
            if (numberValue === null) return null;
            
            return Math.floor(numberValue); // Keep sign, just remove decimals
        });
        
        // Text sanitizer
        this.sanitizers.set('text', (value) => {
            if (value === null || value === undefined) {
                return '';
            }
            
            return String(value)
                .trim()
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/[<>]/g, ''); // Remove potential HTML tags
        });
        
        // Email sanitizer
        this.sanitizers.set('email', (value) => {
            if (value === null || value === undefined) {
                return '';
            }
            
            return String(value)
                .trim()
                .toLowerCase()
                .replace(/[^\w@.-]/g, ''); // Keep only valid email characters
        });
        
        // Phone sanitizer
        this.sanitizers.set('phone', (value) => {
            if (value === null || value === undefined) {
                return '';
            }
            
            return String(value)
                .trim()
                .replace(/[^\d+()-\s]/g, '') // Keep only valid phone characters
                .replace(/\s+/g, ''); // Remove spaces
        });
    }
    
    /**
     * Initializes default error messages
     */
    initializeErrorMessages() {
        this.errorMessages.set('required', 'This field is required');
        this.errorMessages.set('type', 'Invalid data type');
        this.errorMessages.set('min', 'Value is too small');
        this.errorMessages.set('max', 'Value is too large');
        this.errorMessages.set('minLength', 'Text is too short');
        this.errorMessages.set('maxLength', 'Text is too long');
        this.errorMessages.set('pattern', 'Invalid format');
        this.errorMessages.set('integer', 'Must be a whole number');
        this.errorMessages.set('precision', 'Too many decimal places');
        this.errorMessages.set('custom', 'Validation failed');
        this.errorMessages.set('productNotFound', 'Product not found');
        this.errorMessages.set('invalidQuantity', 'Invalid quantity');
        this.errorMessages.set('invalidPrice', 'Invalid price');
    }
    
    /**
     * Validates a single value against specified rules
     * @param {any} value - Value to validate
     * @param {string} ruleType - Type of validation rules to apply
     * @param {Object} customRules - Custom validation rules (optional)
     * @returns {Object} Validation result with isValid and errors
     */
    validate(value, ruleType, customRules = {}) {
        const rules = { ...this.validationRules.get(ruleType), ...customRules };
        const errors = [];
        
        if (!rules) {
            return { isValid: false, errors: ['Unknown validation rule type'], sanitizedValue: value };
        }
        
        // Sanitize input first
        const sanitizedValue = this.sanitize(value, ruleType);
        
        // Required validation
        if (rules.required && (sanitizedValue === null || sanitizedValue === undefined || sanitizedValue === '')) {
            errors.push(this.errorMessages.get('required'));
            return { isValid: false, errors, sanitizedValue };
        }
        
        // Skip further validation if value is empty and not required
        if (!rules.required && (sanitizedValue === null || sanitizedValue === undefined || sanitizedValue === '')) {
            return { isValid: true, errors: [], sanitizedValue };
        }
        
        // Type validation - only fail if sanitization couldn't convert to expected type
        if (rules.type === 'number' && (sanitizedValue === null || typeof sanitizedValue !== 'number' || isNaN(sanitizedValue))) {
            errors.push(this.errorMessages.get('type'));
            return { isValid: false, errors, sanitizedValue };
        }
        
        if (rules.type === 'string' && sanitizedValue !== null && typeof sanitizedValue !== 'string') {
            errors.push(this.errorMessages.get('type'));
            return { isValid: false, errors, sanitizedValue };
        }
        
        // Number-specific validations
        if (rules.type === 'number' && typeof sanitizedValue === 'number' && !isNaN(sanitizedValue)) {
            // Min/Max validation
            if (rules.min !== undefined && sanitizedValue < rules.min) {
                errors.push(`${this.errorMessages.get('min')} (minimum: ${rules.min})`);
            }
            
            if (rules.max !== undefined && sanitizedValue > rules.max) {
                errors.push(`${this.errorMessages.get('max')} (maximum: ${rules.max})`);
            }
            
            // Integer validation
            if (rules.integer && !Number.isInteger(sanitizedValue)) {
                errors.push(this.errorMessages.get('integer'));
            }
            
            // Precision validation
            if (rules.precision !== undefined) {
                const decimalPlaces = (sanitizedValue.toString().split('.')[1] || '').length;
                if (decimalPlaces > rules.precision) {
                    errors.push(`${this.errorMessages.get('precision')} (max ${rules.precision} decimal places)`);
                }
            }
        }
        
        // String-specific validations
        if (rules.type === 'string' && typeof sanitizedValue === 'string') {
            // Length validation
            if (rules.minLength !== undefined && sanitizedValue.length < rules.minLength) {
                errors.push(`${this.errorMessages.get('minLength')} (minimum: ${rules.minLength} characters)`);
            }
            
            if (rules.maxLength !== undefined && sanitizedValue.length > rules.maxLength) {
                errors.push(`${this.errorMessages.get('maxLength')} (maximum: ${rules.maxLength} characters)`);
            }
            
            // Pattern validation
            if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
                errors.push(this.errorMessages.get('pattern'));
            }
        }
        
        // Custom validation
        if (rules.custom && typeof rules.custom === 'function') {
            try {
                const customResult = rules.custom(sanitizedValue);
                if (!customResult) {
                    errors.push(this.errorMessages.get('custom'));
                }
            } catch (error) {
                errors.push(`Custom validation error: ${error.message}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitizedValue
        };
    }
    
    /**
     * Sanitizes input value based on type
     * @param {any} value - Value to sanitize
     * @param {string} type - Type of sanitization to apply
     * @returns {any} Sanitized value
     */
    sanitize(value, type) {
        // Map validation types to sanitizer types
        const sanitizerMap = {
            'quantity': 'integer',
            'productId': 'integer',
            'price': 'number',
            'text': 'text',
            'email': 'email',
            'phone': 'phone'
        };
        
        const sanitizerType = sanitizerMap[type] || type;
        const sanitizer = this.sanitizers.get(sanitizerType);
        
        if (!sanitizer) {
            return value; // Return original value if no sanitizer found
        }
        
        try {
            return sanitizer(value);
        } catch (error) {
            console.warn(`Sanitization error for type ${type}:`, error.message);
            return value;
        }
    }
    
    /**
     * Validates quantity input specifically for cart operations
     * @param {any} quantity - Quantity value to validate
     * @returns {Object} Validation result
     */
    validateQuantity(quantity) {
        return this.validate(quantity, 'quantity', {
            min: 0,
            max: 999,
            integer: true
        });
    }
    
    /**
     * Validates product ID
     * @param {any} productId - Product ID to validate
     * @returns {Object} Validation result
     */
    validateProductId(productId) {
        return this.validate(productId, 'productId');
    }
    
    /**
     * Validates price input
     * @param {any} price - Price value to validate
     * @returns {Object} Validation result
     */
    validatePrice(price) {
        return this.validate(price, 'price', {
            min: 0,
            max: 99999.99,
            precision: 2
        });
    }
    
    /**
     * Validates form data object
     * @param {Object} formData - Object containing form field values
     * @param {Object} fieldRules - Object mapping field names to validation rule types
     * @returns {Object} Validation result with field-specific errors
     */
    validateForm(formData, fieldRules) {
        const results = {};
        const allErrors = [];
        let isValid = true;
        
        for (const [fieldName, ruleType] of Object.entries(fieldRules)) {
            const fieldValue = formData[fieldName];
            const fieldResult = this.validate(fieldValue, ruleType);
            
            results[fieldName] = fieldResult;
            
            if (!fieldResult.isValid) {
                isValid = false;
                allErrors.push(...fieldResult.errors.map(error => `${fieldName}: ${error}`));
            }
        }
        
        return {
            isValid,
            errors: allErrors,
            fieldResults: results
        };
    }
    
    /**
     * Validates and sanitizes DOM input element
     * @param {HTMLInputElement} element - Input element to validate
     * @param {string} ruleType - Validation rule type
     * @param {Object} customRules - Custom validation rules
     * @returns {Object} Validation result
     */
    validateElement(element, ruleType, customRules = {}) {
        if (!element || typeof element.value === 'undefined') {
            return { isValid: false, errors: ['Invalid element'], sanitizedValue: null };
        }
        
        const result = this.validate(element.value, ruleType, customRules);
        
        // Update element classes for visual feedback
        this.updateElementValidationState(element, result.isValid);
        
        return result;
    }
    
    /**
     * Updates DOM element classes based on validation state
     * @param {HTMLElement} element - Element to update
     * @param {boolean} isValid - Whether validation passed
     */
    updateElementValidationState(element, isValid) {
        if (!element || typeof document === 'undefined') return;
        
        // Remove existing validation classes
        element.classList.remove('valid', 'invalid', 'border-green-500', 'border-red-500');
        
        // Add appropriate classes
        if (isValid) {
            element.classList.add('valid', 'border-green-500');
        } else {
            element.classList.add('invalid', 'border-red-500');
        }
    }
    
    /**
     * Shows validation error message near DOM element
     * @param {HTMLElement} element - Element to show error for
     * @param {Array} errors - Array of error messages
     */
    showElementErrors(element, errors) {
        if (!element || !errors || errors.length === 0 || typeof document === 'undefined') {
            return;
        }
        
        // Remove existing error messages
        this.clearElementErrors(element);
        
        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-errors text-red-500 text-sm mt-1';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.setAttribute('aria-live', 'polite');
        
        // Add error messages
        errors.forEach(error => {
            const errorElement = document.createElement('div');
            errorElement.textContent = error;
            errorContainer.appendChild(errorElement);
        });
        
        // Insert after the element
        if (element.parentNode) {
            element.parentNode.insertBefore(errorContainer, element.nextSibling);
        }
    }
    
    /**
     * Clears validation error messages for DOM element
     * @param {HTMLElement} element - Element to clear errors for
     */
    clearElementErrors(element) {
        if (!element || typeof document === 'undefined') return;
        
        // Find and remove existing error containers
        let nextSibling = element.nextSibling;
        while (nextSibling && nextSibling.classList && nextSibling.classList.contains('validation-errors')) {
            const toRemove = nextSibling;
            nextSibling = nextSibling.nextSibling;
            toRemove.remove();
        }
    }
    
    /**
     * Adds real-time validation to DOM element
     * @param {HTMLElement} element - Element to add validation to
     * @param {string} ruleType - Validation rule type
     * @param {Object} options - Validation options
     */
    addRealTimeValidation(element, ruleType, options = {}) {
        if (!element || typeof document === 'undefined') return;
        
        const validateAndUpdate = () => {
            const result = this.validateElement(element, ruleType, options.customRules);
            
            if (options.showErrors) {
                if (result.isValid) {
                    this.clearElementErrors(element);
                } else {
                    this.showElementErrors(element, result.errors);
                }
            }
            
            if (options.callback && typeof options.callback === 'function') {
                options.callback(result, element);
            }
            
            return result;
        };
        
        // Add event listeners
        element.addEventListener('input', validateAndUpdate);
        element.addEventListener('blur', validateAndUpdate);
        element.addEventListener('change', validateAndUpdate);
        
        // Store validation function for later removal
        element._validationFunction = validateAndUpdate;
        element._validationRuleType = ruleType;
    }
    
    /**
     * Removes real-time validation from DOM element
     * @param {HTMLElement} element - Element to remove validation from
     */
    removeRealTimeValidation(element) {
        if (!element || !element._validationFunction) return;
        
        element.removeEventListener('input', element._validationFunction);
        element.removeEventListener('blur', element._validationFunction);
        element.removeEventListener('change', element._validationFunction);
        
        this.clearElementErrors(element);
        this.updateElementValidationState(element, true); // Reset to neutral state
        
        delete element._validationFunction;
        delete element._validationRuleType;
    }
}

/**
 * Data Recovery Module - Handles corrupted localStorage data recovery
 */
class DataRecovery {
    constructor() {
        this.backupKeys = new Set();
        this.recoveryStrategies = new Map();
        
        this.initializeRecoveryStrategies();
    }
    
    /**
     * Initializes data recovery strategies
     */
    initializeRecoveryStrategies() {
        // Cart data recovery strategy
        this.recoveryStrategies.set('cart', {
            validate: (data) => {
                if (!data || typeof data !== 'object') return false;
                if (!Array.isArray(data.items)) return false;
                
                // Validate each item
                return data.items.every(item => 
                    item && 
                    typeof item.productId === 'number' && 
                    typeof item.quantity === 'number' && 
                    item.quantity >= 0
                );
            },
            
            repair: (data) => {
                if (!data || typeof data !== 'object') {
                    return { items: [], timestamp: new Date().toISOString() };
                }
                
                const repairedData = {
                    items: [],
                    timestamp: data.timestamp || new Date().toISOString()
                };
                
                if (Array.isArray(data.items)) {
                    // Filter and repair valid items
                    repairedData.items = data.items.filter(item => {
                        return item && 
                               typeof item.productId === 'number' && 
                               item.productId > 0 &&
                               typeof item.quantity === 'number' && 
                               item.quantity > 0;
                    }).map(item => ({
                        productId: Math.floor(Math.abs(item.productId)),
                        quantity: Math.floor(Math.abs(item.quantity)),
                        addedAt: item.addedAt || new Date().toISOString()
                    }));
                }
                
                return repairedData;
            },
            
            fallback: () => ({
                items: [],
                timestamp: new Date().toISOString()
            })
        });
        
        // User preferences recovery strategy
        this.recoveryStrategies.set('preferences', {
            validate: (data) => {
                return data && typeof data === 'object';
            },
            
            repair: (data) => {
                const defaults = {
                    theme: 'light',
                    currency: 'USD',
                    notifications: true
                };
                
                if (!data || typeof data !== 'object') {
                    return defaults;
                }
                
                return { ...defaults, ...data };
            },
            
            fallback: () => ({
                theme: 'light',
                currency: 'USD',
                notifications: true
            })
        });
    }
    
    /**
     * Attempts to recover corrupted data
     * @param {string} key - Storage key
     * @param {string} dataType - Type of data for recovery strategy
     * @returns {Object} Recovery result
     */
    recoverData(key, dataType) {
        const result = {
            success: false,
            data: null,
            strategy: 'none',
            errors: []
        };
        
        try {
            // Try to get raw data from localStorage
            const rawData = localStorage.getItem(key);
            
            if (!rawData) {
                result.strategy = 'fallback';
                result.data = this.getFallbackData(dataType);
                result.success = true;
                return result;
            }
            
            // Try to parse JSON
            let parsedData;
            try {
                parsedData = JSON.parse(rawData);
            } catch (parseError) {
                result.errors.push(`JSON parse error: ${parseError.message}`);
                
                // Try to repair malformed JSON
                const repairedJson = this.repairMalformedJson(rawData);
                if (repairedJson) {
                    try {
                        parsedData = JSON.parse(repairedJson);
                        result.strategy = 'json-repair';
                    } catch (repairError) {
                        result.errors.push(`JSON repair failed: ${repairError.message}`);
                        result.strategy = 'fallback';
                        result.data = this.getFallbackData(dataType);
                        result.success = true;
                        return result;
                    }
                } else {
                    result.strategy = 'fallback';
                    result.data = this.getFallbackData(dataType);
                    result.success = true;
                    return result;
                }
            }
            
            // Validate parsed data
            const strategy = this.recoveryStrategies.get(dataType);
            if (!strategy) {
                result.errors.push(`No recovery strategy for data type: ${dataType}`);
                result.data = parsedData;
                result.success = true;
                return result;
            }
            
            if (strategy.validate(parsedData)) {
                result.strategy = 'validation-passed';
                result.data = parsedData;
                result.success = true;
            } else {
                // Try to repair the data
                try {
                    result.data = strategy.repair(parsedData);
                    result.strategy = 'data-repair';
                    result.success = true;
                } catch (repairError) {
                    result.errors.push(`Data repair failed: ${repairError.message}`);
                    result.data = strategy.fallback();
                    result.strategy = 'fallback';
                    result.success = true;
                }
            }
            
        } catch (error) {
            result.errors.push(`Recovery error: ${error.message}`);
            result.data = this.getFallbackData(dataType);
            result.strategy = 'fallback';
            result.success = true;
        }
        
        return result;
    }
    
    /**
     * Attempts to repair malformed JSON
     * @param {string} jsonString - Malformed JSON string
     * @returns {string|null} Repaired JSON string or null if unrepairable
     */
    repairMalformedJson(jsonString) {
        try {
            // Common JSON repair strategies
            let repaired = jsonString.trim();
            
            // Fix missing closing braces/brackets
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            
            // Add missing closing brackets first (for arrays)
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                repaired += ']';
            }
            
            // Add missing closing braces (for objects)
            for (let i = 0; i < openBraces - closeBraces; i++) {
                repaired += '}';
            }
            
            // Remove trailing commas
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
            
            // Fix unquoted keys (basic attempt)
            repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
            
            // Test if the repaired JSON is valid
            JSON.parse(repaired);
            
            return repaired;
            
        } catch (error) {
            console.warn('JSON repair failed:', error.message);
            return null;
        }
    }
    
    /**
     * Gets fallback data for a given data type
     * @param {string} dataType - Type of data
     * @returns {any} Fallback data
     */
    getFallbackData(dataType) {
        const strategy = this.recoveryStrategies.get(dataType);
        if (strategy && strategy.fallback) {
            return strategy.fallback();
        }
        
        // Generic fallback
        return null;
    }
    
    /**
     * Creates a backup of current data before modifications
     * @param {string} key - Storage key
     * @param {any} data - Data to backup
     */
    createBackup(key, data) {
        try {
            const backupKey = `${key}_backup_${Date.now()}`;
            const backupData = {
                originalKey: key,
                data: data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            this.backupKeys.add(backupKey);
            
            // Limit number of backups (keep only last 5)
            this.cleanupOldBackups(key);
            
        } catch (error) {
            console.warn('Failed to create backup:', error.message);
        }
    }
    
    /**
     * Cleans up old backup files
     * @param {string} originalKey - Original storage key
     */
    cleanupOldBackups(originalKey) {
        try {
            const backupKeys = [];
            
            // Find all backup keys for this original key
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${originalKey}_backup_`)) {
                    backupKeys.push(key);
                }
            }
            
            // Sort by timestamp (newest first)
            backupKeys.sort((a, b) => {
                const timestampA = parseInt(a.split('_backup_')[1]);
                const timestampB = parseInt(b.split('_backup_')[1]);
                return timestampB - timestampA;
            });
            
            // Remove old backups (keep only 5 most recent)
            for (let i = 5; i < backupKeys.length; i++) {
                localStorage.removeItem(backupKeys[i]);
                this.backupKeys.delete(backupKeys[i]);
            }
            
        } catch (error) {
            console.warn('Failed to cleanup old backups:', error.message);
        }
    }
    
    /**
     * Restores data from the most recent backup
     * @param {string} originalKey - Original storage key
     * @returns {Object} Restore result
     */
    restoreFromBackup(originalKey) {
        try {
            const backupKeys = [];
            
            // Find all backup keys for this original key
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${originalKey}_backup_`)) {
                    backupKeys.push(key);
                }
            }
            
            if (backupKeys.length === 0) {
                return { success: false, error: 'No backups found' };
            }
            
            // Sort by timestamp (newest first)
            backupKeys.sort((a, b) => {
                const timestampA = parseInt(a.split('_backup_')[1]);
                const timestampB = parseInt(b.split('_backup_')[1]);
                return timestampB - timestampA;
            });
            
            // Try to restore from the most recent backup
            const mostRecentBackup = backupKeys[0];
            const backupData = JSON.parse(localStorage.getItem(mostRecentBackup));
            
            // Restore the data
            localStorage.setItem(originalKey, JSON.stringify(backupData.data));
            
            return {
                success: true,
                data: backupData.data,
                backupTimestamp: backupData.timestamp
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * Graceful Degradation Manager - Handles JavaScript feature failures
 */
class GracefulDegradation {
    constructor() {
        this.featureSupport = new Map();
        this.fallbackStrategies = new Map();
        
        this.detectFeatureSupport();
        this.initializeFallbackStrategies();
    }
    
    /**
     * Detects browser feature support
     */
    detectFeatureSupport() {
        // Set default values for Node.js environment
        if (typeof window === 'undefined') {
            this.featureSupport.set('localStorage', false);
            this.featureSupport.set('sessionStorage', false);
            this.featureSupport.set('JSON', typeof JSON !== 'undefined' && typeof JSON.parse === 'function' && typeof JSON.stringify === 'function');
            this.featureSupport.set('es6Classes', true); // Node.js supports ES6
            this.featureSupport.set('es6Modules', true);
            this.featureSupport.set('es6Arrow', true);
            this.featureSupport.set('querySelector', false);
            this.featureSupport.set('addEventListener', false);
            this.featureSupport.set('fetch', typeof fetch !== 'undefined');
            this.featureSupport.set('promises', typeof Promise !== 'undefined');
            this.featureSupport.set('map', typeof Map !== 'undefined');
            this.featureSupport.set('set', typeof Set !== 'undefined');
            return;
        }
        
        // localStorage support
        this.featureSupport.set('localStorage', this.testLocalStorage());
        
        // sessionStorage support
        this.featureSupport.set('sessionStorage', this.testSessionStorage());
        
        // JSON support
        this.featureSupport.set('JSON', typeof JSON !== 'undefined' && typeof JSON.parse === 'function' && typeof JSON.stringify === 'function');
        
        // ES6 features
        this.featureSupport.set('es6Classes', this.testES6Classes());
        this.featureSupport.set('es6Modules', this.testES6Modules());
        this.featureSupport.set('es6Arrow', this.testArrowFunctions());
        
        // DOM features
        this.featureSupport.set('querySelector', typeof document !== 'undefined' && document.querySelector);
        this.featureSupport.set('addEventListener', typeof document !== 'undefined' && document.addEventListener);
        
        // Modern JavaScript features
        this.featureSupport.set('fetch', typeof fetch !== 'undefined');
        this.featureSupport.set('promises', typeof Promise !== 'undefined');
        this.featureSupport.set('map', typeof Map !== 'undefined');
        this.featureSupport.set('set', typeof Set !== 'undefined');
    }
    
    /**
     * Tests localStorage support
     * @returns {boolean} True if localStorage is supported
     */
    testLocalStorage() {
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Tests sessionStorage support
     * @returns {boolean} True if sessionStorage is supported
     */
    testSessionStorage() {
        try {
            const testKey = '__sessionStorage_test__';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Tests ES6 class support
     * @returns {boolean} True if ES6 classes are supported
     */
    testES6Classes() {
        try {
            eval('class TestClass {}');
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Tests ES6 module support
     * @returns {boolean} True if ES6 modules are supported
     */
    testES6Modules() {
        return typeof module !== 'undefined' && module.exports;
    }
    
    /**
     * Tests arrow function support
     * @returns {boolean} True if arrow functions are supported
     */
    testArrowFunctions() {
        try {
            eval('(() => {})');
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Initializes fallback strategies for unsupported features
     */
    initializeFallbackStrategies() {
        // localStorage fallback
        this.fallbackStrategies.set('localStorage', {
            setItem: (key, value) => {
                if (this.featureSupport.get('sessionStorage')) {
                    sessionStorage.setItem(key, value);
                } else {
                    // In-memory fallback
                    this._memoryStorage = this._memoryStorage || {};
                    this._memoryStorage[key] = value;
                }
            },
            
            getItem: (key) => {
                if (this.featureSupport.get('sessionStorage')) {
                    return sessionStorage.getItem(key);
                } else {
                    this._memoryStorage = this._memoryStorage || {};
                    return this._memoryStorage[key] || null;
                }
            },
            
            removeItem: (key) => {
                if (this.featureSupport.get('sessionStorage')) {
                    sessionStorage.removeItem(key);
                } else {
                    this._memoryStorage = this._memoryStorage || {};
                    delete this._memoryStorage[key];
                }
            }
        });
        
        // JSON fallback (for very old browsers)
        this.fallbackStrategies.set('JSON', {
            parse: (str) => {
                try {
                    return eval('(' + str + ')');
                } catch (error) {
                    throw new Error('JSON parse failed');
                }
            },
            
            stringify: (obj) => {
                // Basic JSON stringify implementation
                if (obj === null) return 'null';
                if (typeof obj === 'undefined') return undefined;
                if (typeof obj === 'string') return '"' + obj.replace(/"/g, '\\"') + '"';
                if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
                if (obj instanceof Array) {
                    return '[' + obj.map(item => this.fallbackStrategies.get('JSON').stringify(item)).join(',') + ']';
                }
                if (typeof obj === 'object') {
                    const pairs = [];
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            pairs.push('"' + key + '":' + this.fallbackStrategies.get('JSON').stringify(obj[key]));
                        }
                    }
                    return '{' + pairs.join(',') + '}';
                }
                return '{}';
            }
        });
        
        // Map fallback
        this.fallbackStrategies.set('Map', function() {
            this._data = {};
            this.size = 0;
            
            this.set = function(key, value) {
                if (!this._data.hasOwnProperty(key)) {
                    this.size++;
                }
                this._data[key] = value;
                return this;
            };
            
            this.get = function(key) {
                return this._data[key];
            };
            
            this.has = function(key) {
                return this._data.hasOwnProperty(key);
            };
            
            this.delete = function(key) {
                if (this._data.hasOwnProperty(key)) {
                    delete this._data[key];
                    this.size--;
                    return true;
                }
                return false;
            };
            
            this.clear = function() {
                this._data = {};
                this.size = 0;
            };
        });
    }
    
    /**
     * Gets a feature or its fallback
     * @param {string} featureName - Name of the feature
     * @returns {any} Feature implementation or fallback
     */
    getFeature(featureName) {
        if (this.featureSupport.get(featureName)) {
            // Return native implementation
            switch (featureName) {
                case 'localStorage':
                    return localStorage;
                case 'sessionStorage':
                    return sessionStorage;
                case 'JSON':
                    return JSON;
                case 'Map':
                    return Map;
                default:
                    return null;
            }
        } else {
            // Return fallback implementation
            return this.fallbackStrategies.get(featureName);
        }
    }
    
    /**
     * Checks if a feature is supported
     * @param {string} featureName - Name of the feature
     * @returns {boolean} True if feature is supported
     */
    isSupported(featureName) {
        return this.featureSupport.get(featureName) === true;
    }
    
    /**
     * Gets a report of all feature support
     * @returns {Object} Feature support report
     */
    getFeatureReport() {
        const report = {
            supported: {},
            unsupported: {},
            fallbacksAvailable: {}
        };
        
        for (const [feature, isSupported] of this.featureSupport.entries()) {
            if (isSupported) {
                report.supported[feature] = true;
            } else {
                report.unsupported[feature] = true;
                report.fallbacksAvailable[feature] = this.fallbackStrategies.has(feature);
            }
        }
        
        return report;
    }
}

// Create global instances
const inputValidator = new InputValidator();
const dataRecovery = new DataRecovery();
const gracefulDegradation = new GracefulDegradation();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        InputValidator, 
        DataRecovery, 
        GracefulDegradation,
        inputValidator, 
        dataRecovery, 
        gracefulDegradation 
    };
    // Make available globally for Node.js testing
    global.InputValidator = InputValidator;
    global.DataRecovery = DataRecovery;
    global.GracefulDegradation = GracefulDegradation;
    global.inputValidator = inputValidator;
    global.dataRecovery = dataRecovery;
    global.gracefulDegradation = gracefulDegradation;
} else {
    window.InputValidator = InputValidator;
    window.DataRecovery = DataRecovery;
    window.GracefulDegradation = GracefulDegradation;
    window.inputValidator = inputValidator;
    window.dataRecovery = dataRecovery;
    window.gracefulDegradation = gracefulDegradation;
}