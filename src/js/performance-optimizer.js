/**
 * Performance Optimizer Module
 * Handles performance optimizations for large product catalogs and smooth UX
 */

class PerformanceOptimizer {
    constructor() {
        this.isVirtualScrollEnabled = false;
        this.visibleItems = new Set();
        this.intersectionObserver = null;
        this.loadingStates = new Map();
        this.debounceTimers = new Map();
        
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
    }
    
    /**
     * Sets up intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined') {
            console.warn('IntersectionObserver not supported, skipping lazy loading');
            return;
        }
        
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.handleElementVisible(entry.target);
                    } else {
                        this.handleElementHidden(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.1
            }
        );
    }
    
    /**
     * Sets up performance monitoring
     */
    setupPerformanceMonitoring() {
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'measure') {
                            this.handlePerformanceMeasure(entry);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure'] });
            } catch (error) {
                console.warn('Performance monitoring not available:', error.message);
            }
        }
    }
    
    /**
     * Optimizes product rendering for large catalogs
     * @param {Array} products - Array of products to render
     * @param {HTMLElement} container - Container element
     * @param {Function} renderFunction - Function to render individual products
     */
    optimizeProductRendering(products, container, renderFunction) {
        if (products.length > 50) {
            return this.enableVirtualScrolling(products, container, renderFunction);
        } else {
            return this.renderWithLazyLoading(products, container, renderFunction);
        }
    }
    
    /**
     * Enables virtual scrolling for large product lists
     * @param {Array} products - Array of products
     * @param {HTMLElement} container - Container element
     * @param {Function} renderFunction - Render function
     */
    enableVirtualScrolling(products, container, renderFunction) {
        this.isVirtualScrollEnabled = true;
        
        // Create virtual scroll container
        const virtualContainer = document.createElement('div');
        virtualContainer.className = 'virtual-scroll-container';
        
        // Calculate item height (estimate)
        const itemHeight = 300; // Approximate height of product card
        const containerHeight = 600; // Visible container height
        const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer items
        
        let scrollTop = 0;
        let startIndex = 0;
        
        const updateVisibleItems = () => {
            const newStartIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(newStartIndex + visibleCount, products.length);
            
            if (newStartIndex !== startIndex) {
                startIndex = newStartIndex;
                this.renderVisibleItems(products, startIndex, endIndex, virtualContainer, renderFunction);
            }
        };
        
        virtualContainer.addEventListener('scroll', this.debounce(() => {
            scrollTop = virtualContainer.scrollTop;
            updateVisibleItems();
        }, 16)); // ~60fps
        
        // Set total height
        virtualContainer.style.height = `${products.length * itemHeight}px`;
        
        // Initial render
        updateVisibleItems();
        
        container.appendChild(virtualContainer);
        
        return {
            type: 'virtual',
            container: virtualContainer,
            itemCount: products.length
        };
    }
    
    /**
     * Renders visible items in virtual scroll
     * @param {Array} products - Products array
     * @param {number} startIndex - Start index
     * @param {number} endIndex - End index
     * @param {HTMLElement} container - Container element
     * @param {Function} renderFunction - Render function
     */
    renderVisibleItems(products, startIndex, endIndex, container, renderFunction) {
        // Clear existing items
        container.innerHTML = '';
        
        // Create spacer for items above
        if (startIndex > 0) {
            const topSpacer = document.createElement('div');
            topSpacer.style.height = `${startIndex * 300}px`;
            container.appendChild(topSpacer);
        }
        
        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
            if (products[i]) {
                const element = renderFunction(products[i]);
                container.appendChild(element);
            }
        }
        
        // Create spacer for items below
        if (endIndex < products.length) {
            const bottomSpacer = document.createElement('div');
            bottomSpacer.style.height = `${(products.length - endIndex) * 300}px`;
            container.appendChild(bottomSpacer);
        }
    }
    
    /**
     * Renders products with lazy loading
     * @param {Array} products - Array of products
     * @param {HTMLElement} container - Container element
     * @param {Function} renderFunction - Render function
     */
    renderWithLazyLoading(products, container, renderFunction) {
        // Clear container
        container.innerHTML = '';
        
        // Render products in batches
        const batchSize = 10;
        let currentBatch = 0;
        
        const renderBatch = () => {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, products.length);
            
            for (let i = start; i < end; i++) {
                const element = renderFunction(products[i]);
                
                // Add lazy loading for images
                this.setupLazyLoading(element);
                
                // Add to intersection observer
                if (this.intersectionObserver) {
                    this.intersectionObserver.observe(element);
                }
                
                container.appendChild(element);
            }
            
            currentBatch++;
            
            // Schedule next batch if there are more items
            if (end < products.length) {
                requestAnimationFrame(() => {
                    setTimeout(renderBatch, 0); // Allow other tasks to run
                });
            }
        };
        
        // Start rendering
        renderBatch();
        
        return {
            type: 'lazy',
            container: container,
            itemCount: products.length
        };
    }
    
    /**
     * Sets up lazy loading for images in an element
     * @param {HTMLElement} element - Element containing images
     */
    setupLazyLoading(element) {
        const images = element.querySelectorAll('img[data-src], img[src]');
        
        images.forEach(img => {
            if (img.dataset.src) {
                // Image has data-src, set up lazy loading
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';
                
                if (this.intersectionObserver) {
                    this.intersectionObserver.observe(img);
                }
            }
            
            // Add loading state
            img.addEventListener('load', () => {
                img.classList.remove('product-skeleton');
                img.classList.add('fade-in');
            });
            
            img.addEventListener('error', () => {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
                img.classList.remove('product-skeleton');
            });
        });
    }
    
    /**
     * Handles when an element becomes visible
     * @param {HTMLElement} element - Visible element
     */
    handleElementVisible(element) {
        this.visibleItems.add(element);
        
        // Load images if they have data-src
        const images = element.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
        
        // Add visible class for animations
        element.classList.add('fade-in');
    }
    
    /**
     * Handles when an element becomes hidden
     * @param {HTMLElement} element - Hidden element
     */
    handleElementHidden(element) {
        this.visibleItems.delete(element);
    }
    
    /**
     * Shows loading state for an element
     * @param {HTMLElement} element - Element to show loading for
     * @param {string} key - Unique key for the loading state
     */
    showLoading(element, key = 'default') {
        if (!element) return;
        
        element.classList.add('loading');
        this.loadingStates.set(key, element);
        
        // Add loading overlay if it doesn't exist
        if (!element.querySelector('.loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10';
            overlay.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>';
            element.style.position = 'relative';
            element.appendChild(overlay);
        }
    }
    
    /**
     * Hides loading state for an element
     * @param {string} key - Unique key for the loading state
     */
    hideLoading(key = 'default') {
        const element = this.loadingStates.get(key);
        if (element) {
            element.classList.remove('loading');
            
            const overlay = element.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            this.loadingStates.delete(key);
        }
    }
    
    /**
     * Debounces a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {string} key - Unique key for the debounce timer
     * @returns {Function} Debounced function
     */
    debounce(func, wait, key = 'default') {
        return (...args) => {
            const existingTimer = this.debounceTimers.get(key);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            
            const timer = setTimeout(() => {
                this.debounceTimers.delete(key);
                func.apply(this, args);
            }, wait);
            
            this.debounceTimers.set(key, timer);
        };
    }
    
    /**
     * Throttles a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Handles performance measurements
     * @param {PerformanceEntry} entry - Performance entry
     */
    handlePerformanceMeasure(entry) {
        if (entry.duration > 100) {
            console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
        }
    }
    
    /**
     * Measures performance of a function
     * @param {string} name - Measurement name
     * @param {Function} func - Function to measure
     * @returns {*} Function result
     */
    measurePerformance(name, func) {
        if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
            performance.mark(`${name}-start`);
            const result = func();
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
            return result;
        } else {
            return func();
        }
    }
    
    /**
     * Optimizes DOM operations by batching them
     * @param {Function[]} operations - Array of DOM operations
     */
    batchDOMOperations(operations) {
        requestAnimationFrame(() => {
            operations.forEach(operation => {
                try {
                    operation();
                } catch (error) {
                    console.error('Error in batched DOM operation:', error);
                }
            });
        });
    }
    
    /**
     * Preloads critical resources
     * @param {string[]} urls - Array of URLs to preload
     */
    preloadResources(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                link.as = 'image';
            } else if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
                link.as = 'font';
                link.crossOrigin = 'anonymous';
            } else if (url.match(/\.css$/i)) {
                link.as = 'style';
            } else if (url.match(/\.js$/i)) {
                link.as = 'script';
            }
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Cleans up resources
     */
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.loadingStates.clear();
        this.visibleItems.clear();
    }
}

// Create global instance
const performanceOptimizer = new PerformanceOptimizer();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer, performanceOptimizer };
    global.PerformanceOptimizer = PerformanceOptimizer;
    global.performanceOptimizer = performanceOptimizer;
} else {
    window.PerformanceOptimizer = PerformanceOptimizer;
    window.performanceOptimizer = performanceOptimizer;
}