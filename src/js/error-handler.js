/**
 * Error Handler Module - Centralized error management and user feedback system
 */

/**
 * Error Handler Class for centralized error management
 */
class ErrorHandler {
    constructor() {
        this.notifications = new Map(); // Track active notifications
        this.notificationCounter = 0;
        this.maxNotifications = 5; // Maximum concurrent notifications
        this.defaultDuration = 5000; // 5 seconds
        
        // Initialize notification container
        this.initializeNotificationContainer();
    }
    
    /**
     * Initializes the notification container in the DOM
     */
    initializeNotificationContainer() {
        // Skip in Node.js environment
        if (typeof document === 'undefined') return;
        
        // Check if container already exists
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(container);
        }
        this.container = container;
    }
    
    /**
     * Shows an error message to the user
     * @param {string} message - Error message to display
     * @param {Object} options - Configuration options
     * @param {number} options.duration - Duration in milliseconds (0 for persistent)
     * @param {boolean} options.dismissible - Whether user can dismiss manually
     * @param {string} options.context - Additional context for logging
     */
    showError(message, options = {}) {
        const config = {
            type: 'error',
            message: message,
            duration: options.duration || this.defaultDuration,
            dismissible: options.dismissible !== false,
            context: options.context || 'general',
            icon: this._getErrorIcon()
        };
        
        // Log error for debugging
        console.error(`Error [${config.context}]:`, message);
        
        return this._createNotification(config);
    }
    
    /**
     * Shows a success message to the user
     * @param {string} message - Success message to display
     * @param {Object} options - Configuration options
     * @param {number} options.duration - Duration in milliseconds
     * @param {boolean} options.dismissible - Whether user can dismiss manually
     * @param {string} options.context - Additional context for logging
     */
    showSuccess(message, options = {}) {
        const config = {
            type: 'success',
            message: message,
            duration: options.duration || 3000, // Shorter duration for success
            dismissible: options.dismissible !== false,
            context: options.context || 'general',
            icon: this._getSuccessIcon()
        };
        
        // Log success for debugging
        console.log(`Success [${config.context}]:`, message);
        
        return this._createNotification(config);
    }
    
    /**
     * Shows a warning message to the user
     * @param {string} message - Warning message to display
     * @param {Object} options - Configuration options
     */
    showWarning(message, options = {}) {
        const config = {
            type: 'warning',
            message: message,
            duration: options.duration || this.defaultDuration,
            dismissible: options.dismissible !== false,
            context: options.context || 'general',
            icon: this._getWarningIcon()
        };
        
        // Log warning for debugging
        console.warn(`Warning [${config.context}]:`, message);
        
        return this._createNotification(config);
    }
    
    /**
     * Shows an info message to the user
     * @param {string} message - Info message to display
     * @param {Object} options - Configuration options
     */
    showInfo(message, options = {}) {
        const config = {
            type: 'info',
            message: message,
            duration: options.duration || this.defaultDuration,
            dismissible: options.dismissible !== false,
            context: options.context || 'general',
            icon: this._getInfoIcon()
        };
        
        // Log info for debugging
        console.info(`Info [${config.context}]:`, message);
        
        return this._createNotification(config);
    }
    
    /**
     * Handles validation errors with specific formatting
     * @param {Error} error - Validation error
     * @param {string} context - Context where validation failed
     */
    handleValidationError(error, context = 'validation') {
        const message = error.message || 'Validation failed';
        return this.showError(`Validation Error: ${message}`, {
            context: context,
            duration: 6000 // Longer duration for validation errors
        });
    }
    
    /**
     * Handles storage errors with fallback information
     * @param {Error} error - Storage error
     * @param {string} context - Context where storage failed
     */
    handleStorageError(error, context = 'storage') {
        let message = 'Storage operation failed';
        let duration = this.defaultDuration;
        
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
            message = 'Storage quota exceeded. Your cart will work in session-only mode.';
            duration = 8000; // Longer duration for important info
        } else if (error.name === 'SecurityError' || error.message.includes('access')) {
            message = 'Storage access denied. Your cart will work in session-only mode.';
            duration = 8000;
        } else {
            message = `Storage error: ${error.message}. Your cart will work in session-only mode.`;
        }
        
        return this.showWarning(message, {
            context: context,
            duration: duration
        });
    }
    
    /**
     * Handles network/API errors
     * @param {Error} error - Network error
     * @param {string} context - Context where network error occurred
     */
    handleNetworkError(error, context = 'network') {
        const message = error.message || 'Network operation failed';
        return this.showError(`Network Error: ${message}`, {
            context: context,
            duration: 7000
        });
    }
    
    /**
     * Handles cart operation errors
     * @param {Error} error - Cart operation error
     * @param {string} operation - The cart operation that failed
     */
    handleCartError(error, operation = 'cart operation') {
        const message = error.message || `${operation} failed`;
        return this.showError(message, {
            context: 'cart',
            duration: 5000
        });
    }
    
    /**
     * Creates and displays a notification
     * @private
     * @param {Object} config - Notification configuration
     * @returns {string} Notification ID
     */
    _createNotification(config) {
        // Skip in Node.js environment
        if (typeof document === 'undefined') {
            return `notification-${++this.notificationCounter}`;
        }
        
        // Ensure container exists
        if (!this.container) {
            this.initializeNotificationContainer();
        }
        
        // Remove oldest notification if at max capacity
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.dismissNotification(oldestId);
        }
        
        const notificationId = `notification-${++this.notificationCounter}`;
        const notification = this._buildNotificationElement(notificationId, config);
        
        // Add to container with animation
        this.container.appendChild(notification);
        this.notifications.set(notificationId, {
            element: notification,
            config: config,
            createdAt: Date.now()
        });
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('notification-enter');
        });
        
        // Auto-dismiss if duration is set
        if (config.duration > 0) {
            setTimeout(() => {
                this.dismissNotification(notificationId);
            }, config.duration);
        }
        
        return notificationId;
    }
    
    /**
     * Builds the notification DOM element
     * @private
     * @param {string} id - Notification ID
     * @param {Object} config - Notification configuration
     * @returns {HTMLElement} Notification element
     */
    _buildNotificationElement(id, config) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${config.type} bg-white border-l-4 rounded-lg shadow-lg p-4 transform translate-x-full transition-transform duration-300 ease-out`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        // Add type-specific styling
        const typeStyles = {
            error: 'border-red-500 bg-red-50',
            success: 'border-green-500 bg-green-50',
            warning: 'border-yellow-500 bg-yellow-50',
            info: 'border-blue-500 bg-blue-50'
        };
        
        notification.className += ` ${typeStyles[config.type] || typeStyles.info}`;
        
        // Build notification content
        const content = document.createElement('div');
        content.className = 'flex items-start';
        
        // Icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'flex-shrink-0 mr-3';
        iconContainer.innerHTML = config.icon;
        content.appendChild(iconContainer);
        
        // Message content
        const messageContainer = document.createElement('div');
        messageContainer.className = 'flex-1 min-w-0';
        
        const message = document.createElement('p');
        message.className = `text-sm font-medium text-gray-900`;
        message.textContent = config.message;
        messageContainer.appendChild(message);
        
        // Add timestamp for debugging
        if (config.context !== 'general') {
            const context = document.createElement('p');
            context.className = 'text-xs text-gray-500 mt-1';
            context.textContent = `Context: ${config.context}`;
            messageContainer.appendChild(context);
        }
        
        content.appendChild(messageContainer);
        
        // Dismiss button
        if (config.dismissible) {
            const dismissButton = document.createElement('button');
            dismissButton.className = 'flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded';
            dismissButton.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            `;
            dismissButton.setAttribute('aria-label', 'Dismiss notification');
            dismissButton.addEventListener('click', () => {
                this.dismissNotification(id);
            });
            content.appendChild(dismissButton);
        }
        
        notification.appendChild(content);
        return notification;
    }
    
    /**
     * Dismisses a notification by ID
     * @param {string} notificationId - ID of notification to dismiss
     */
    dismissNotification(notificationId) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;
        
        const { element } = notificationData;
        
        // Add exit animation
        element.classList.add('notification-exit');
        element.classList.remove('notification-enter');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(notificationId);
        }, 300);
    }
    
    /**
     * Dismisses all notifications
     */
    dismissAll() {
        const notificationIds = Array.from(this.notifications.keys());
        notificationIds.forEach(id => this.dismissNotification(id));
    }
    
    /**
     * Gets count of active notifications
     * @returns {number} Number of active notifications
     */
    getActiveCount() {
        return this.notifications.size;
    }
    
    /**
     * Gets all active notifications
     * @returns {Array} Array of notification data
     */
    getActiveNotifications() {
        return Array.from(this.notifications.entries()).map(([id, data]) => ({
            id: id,
            type: data.config.type,
            message: data.config.message,
            context: data.config.context,
            createdAt: data.createdAt
        }));
    }
    
    /**
     * Clears all notifications and resets state
     */
    clear() {
        this.dismissAll();
        this.notificationCounter = 0;
    }
    
    // Icon methods
    _getErrorIcon() {
        return `
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
        `;
    }
    
    _getSuccessIcon() {
        return `
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    }
    
    _getWarningIcon() {
        return `
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
        `;
    }
    
    _getInfoIcon() {
        return `
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, errorHandler };
    // Make available globally for Node.js testing
    global.ErrorHandler = ErrorHandler;
    global.errorHandler = errorHandler;
} else {
    window.ErrorHandler = ErrorHandler;
    window.errorHandler = errorHandler;
}

// Example for products.js
window.Products = Products;