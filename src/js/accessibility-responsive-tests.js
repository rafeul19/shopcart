/**
 * Accessibility and Responsive Design Test Suite
 */

class AccessibilityResponsiveTests {
    constructor() {
        this.testResults = {};
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.runAllTests();
        });
    }
    
    setupEventListeners() {
        const runAllButton = document.getElementById('run-all-tests');
        if (runAllButton) {
            runAllButton.addEventListener('click', () => this.runAllTests());
        }
        
        const announceButton = document.getElementById('announce-test');
        if (announceButton) {
            announceButton.addEventListener('click', () => this.testScreenReaderAnnouncement());
        }
    }
    
    /**
     * Runs all accessibility and responsive design tests
     */
    async runAllTests() {
        console.log('Running accessibility and responsive design tests...');
        
        // Accessibility Tests
        await this.testSemanticHTML();
        await this.testARIALabels();
        await this.testKeyboardNavigation();
        await this.testFocusManagement();
        await this.testScreenReaderSupport();
        
        // Responsive Design Tests
        await this.testViewportConfiguration();
        await this.testResponsiveBreakpoints();
        await this.testResponsiveTypography();
        await this.testTouchTargets();
        
        // High Contrast Tests
        await this.testColorContrast();
        
        // Performance Tests
        await this.testReducedMotion();
        
        // Generate summary
        this.generateTestSummary();
    }
    
    /**
     * Tests semantic HTML structure
     */
    async testSemanticHTML() {
        const testName = 'Semantic HTML';
        let passed = true;
        const issues = [];
        
        // Check for proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            passed = false;
            issues.push('No heading elements found');
        }
        
        // Check for main element
        const main = document.querySelector('main');
        if (!main) {
            passed = false;
            issues.push('No main element found');
        }
        
        // Check for header element
        const header = document.querySelector('header');
        if (!header) {
            passed = false;
            issues.push('No header element found');
        }
        
        // Check for proper list structure
        const lists = document.querySelectorAll('ul, ol');
        lists.forEach(list => {
            const listItems = list.querySelectorAll('li');
            if (listItems.length === 0) {
                passed = false;
                issues.push('Empty list found');
            }
        });
        
        this.updateTestResult('semantic-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests ARIA labels and roles
     */
    async testARIALabels() {
        const testName = 'ARIA Labels';
        let passed = true;
        const issues = [];
        
        // Check for buttons without accessible names
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const hasAccessibleName = button.textContent.trim() || 
                                    button.getAttribute('aria-label') || 
                                    button.getAttribute('aria-labelledby');
            if (!hasAccessibleName) {
                passed = false;
                issues.push(`Button ${index + 1} lacks accessible name`);
            }
        });
        
        // Check for images without alt text
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.hasAttribute('alt')) {
                passed = false;
                issues.push(`Image ${index + 1} missing alt attribute`);
            }
        });
        
        // Check for form inputs without labels
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach((input, index) => {
            const hasLabel = input.getAttribute('aria-label') || 
                           input.getAttribute('aria-labelledby') ||
                           document.querySelector(`label[for="${input.id}"]`) ||
                           input.closest('label');
            if (!hasLabel) {
                passed = false;
                issues.push(`Input ${index + 1} lacks proper label`);
            }
        });
        
        // Check for live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        if (liveRegions.length === 0) {
            issues.push('No live regions found for dynamic content');
        }
        
        this.updateTestResult('aria-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests keyboard navigation
     */
    async testKeyboardNavigation() {
        const testName = 'Keyboard Navigation';
        let passed = true;
        const issues = [];
        
        // Check for focusable elements
        const focusableElements = document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
            passed = false;
            issues.push('No focusable elements found');
        }
        
        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        let hasSkipToMain = false;
        skipLinks.forEach(link => {
            if (link.textContent.toLowerCase().includes('skip') && 
                link.textContent.toLowerCase().includes('main')) {
                hasSkipToMain = true;
            }
        });
        
        if (!hasSkipToMain) {
            issues.push('No skip to main content link found');
        }
        
        // Test tab order
        let tabOrderIssues = 0;
        focusableElements.forEach((element, index) => {
            const tabIndex = element.getAttribute('tabindex');
            if (tabIndex && parseInt(tabIndex) > 0) {
                tabOrderIssues++;
            }
        });
        
        if (tabOrderIssues > 0) {
            issues.push(`${tabOrderIssues} elements with positive tabindex found (may disrupt tab order)`);
        }
        
        this.updateTestResult('keyboard-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests focus management
     */
    async testFocusManagement() {
        const testName = 'Focus Management';
        let passed = true;
        const issues = [];
        
        // Check for visible focus indicators
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        let elementsWithFocusStyles = 0;
        focusableElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element, ':focus');
            if (computedStyle.outline !== 'none' || 
                computedStyle.boxShadow !== 'none' ||
                element.classList.contains('focus:ring') ||
                element.classList.contains('focus:outline')) {
                elementsWithFocusStyles++;
            }
        });
        
        if (elementsWithFocusStyles < focusableElements.length * 0.8) {
            issues.push('Many elements lack visible focus indicators');
        }
        
        // Check for focus traps in modals
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        if (modals.length === 0) {
            issues.push('No modals found to test focus trapping');
        }
        
        this.updateTestResult('focus-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests screen reader support
     */
    async testScreenReaderSupport() {
        const testName = 'Screen Reader Support';
        let passed = true;
        const issues = [];
        
        // Check for live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        if (liveRegions.length === 0) {
            passed = false;
            issues.push('No live regions found for dynamic content announcements');
        }
        
        // Check for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        let headingStructureValid = true;
        
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > previousLevel + 1) {
                headingStructureValid = false;
            }
            previousLevel = level;
        });
        
        if (!headingStructureValid) {
            issues.push('Heading structure skips levels');
        }
        
        // Check for descriptive link text
        const links = document.querySelectorAll('a[href]');
        links.forEach((link, index) => {
            const linkText = link.textContent.trim().toLowerCase();
            if (linkText === 'click here' || linkText === 'read more' || linkText === 'here') {
                issues.push(`Link ${index + 1} has non-descriptive text: "${linkText}"`);
            }
        });
        
        this.updateTestResult('screen-reader-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests screen reader announcement functionality
     */
    testScreenReaderAnnouncement() {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = 'Test announcement for screen readers';
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 2000);
        }
    }
    
    /**
     * Tests viewport configuration
     */
    async testViewportConfiguration() {
        const testName = 'Viewport Configuration';
        let passed = true;
        const issues = [];
        
        // Check for viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            passed = false;
            issues.push('No viewport meta tag found');
        } else {
            const content = viewportMeta.getAttribute('content');
            if (!content.includes('width=device-width')) {
                issues.push('Viewport meta tag missing width=device-width');
            }
            if (!content.includes('initial-scale=1')) {
                issues.push('Viewport meta tag missing initial-scale=1');
            }
        }
        
        this.updateTestResult('viewport-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests responsive breakpoints
     */
    async testResponsiveBreakpoints() {
        const testName = 'Responsive Breakpoints';
        let passed = true;
        const issues = [];
        
        const testGrid = document.getElementById('responsive-grid');
        if (!testGrid) {
            passed = false;
            issues.push('Test grid not found');
            this.updateTestResult('breakpoint-test-result', testName, passed, issues);
            this.testResults[testName] = { passed, issues };
            return;
        }
        
        // Test different viewport sizes
        const originalWidth = window.innerWidth;
        const breakpoints = [
            { width: 320, name: 'Mobile', expectedCols: 1 },
            { width: 640, name: 'Small tablet', expectedCols: 2 },
            { width: 1024, name: 'Desktop', expectedCols: 3 },
            { width: 1280, name: 'Large desktop', expectedCols: 4 }
        ];
        
        // Note: We can't actually resize the window in tests, so we check CSS classes
        const gridClasses = testGrid.className;
        const hasResponsiveClasses = gridClasses.includes('sm:grid-cols') && 
                                   gridClasses.includes('lg:grid-cols') && 
                                   gridClasses.includes('xl:grid-cols');
        
        if (!hasResponsiveClasses) {
            issues.push('Grid lacks responsive column classes');
        }
        
        this.updateTestResult('breakpoint-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests responsive typography
     */
    async testResponsiveTypography() {
        const testName = 'Responsive Typography';
        let passed = true;
        const issues = [];
        
        // Check for responsive text classes
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let responsiveHeadings = 0;
        
        headings.forEach(heading => {
            const classes = heading.className;
            if (classes.includes('sm:text-') || classes.includes('md:text-') || classes.includes('lg:text-')) {
                responsiveHeadings++;
            }
        });
        
        if (responsiveHeadings === 0 && headings.length > 0) {
            issues.push('No responsive typography classes found on headings');
        }
        
        // Check base font size
        const bodyStyle = window.getComputedStyle(document.body);
        const fontSize = parseInt(bodyStyle.fontSize);
        if (fontSize < 16) {
            issues.push(`Base font size (${fontSize}px) is smaller than recommended 16px`);
        }
        
        this.updateTestResult('typography-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests touch target sizes
     */
    async testTouchTargets() {
        const testName = 'Touch Target Sizes';
        let passed = true;
        const issues = [];
        
        const touchTargets = document.querySelectorAll('button, a, input, .touch-target');
        let smallTargets = 0;
        
        touchTargets.forEach((target, index) => {
            const rect = target.getBoundingClientRect();
            const minSize = 44; // WCAG recommended minimum
            
            if (rect.width < minSize || rect.height < minSize) {
                smallTargets++;
            }
        });
        
        if (smallTargets > 0) {
            issues.push(`${smallTargets} touch targets are smaller than 44px minimum`);
        }
        
        this.updateTestResult('touch-target-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests color contrast ratios
     */
    async testColorContrast() {
        const testName = 'Color Contrast';
        let passed = true;
        const issues = [];
        
        // This is a simplified test - in a real scenario, you'd use a color contrast library
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, a');
        let lowContrastElements = 0;
        
        textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const color = style.color;
            const backgroundColor = style.backgroundColor;
            
            // Simple check for very light text on light backgrounds
            if (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) {
                lowContrastElements++;
            }
        });
        
        if (lowContrastElements > 0) {
            issues.push(`${lowContrastElements} elements may have low color contrast`);
        }
        
        this.updateTestResult('contrast-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Tests reduced motion support
     */
    async testReducedMotion() {
        const testName = 'Reduced Motion Support';
        let passed = true;
        const issues = [];
        
        // Check if CSS respects prefers-reduced-motion
        const motionElement = document.getElementById('motion-test');
        if (motionElement) {
            // Check if there's CSS that handles reduced motion
            const stylesheets = Array.from(document.styleSheets);
            let hasReducedMotionCSS = false;
            
            try {
                stylesheets.forEach(stylesheet => {
                    if (stylesheet.cssRules) {
                        Array.from(stylesheet.cssRules).forEach(rule => {
                            if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
                                hasReducedMotionCSS = true;
                            }
                        });
                    }
                });
            } catch (e) {
                // Cross-origin stylesheets may not be accessible
                issues.push('Could not check all stylesheets for reduced motion support');
            }
            
            if (!hasReducedMotionCSS) {
                issues.push('No CSS found that respects prefers-reduced-motion preference');
            }
        }
        
        this.updateTestResult('motion-test-result', testName, passed, issues);
        this.testResults[testName] = { passed, issues };
    }
    
    /**
     * Updates test result display
     */
    updateTestResult(elementId, testName, passed, issues) {
        const resultElement = document.getElementById(elementId);
        if (!resultElement) return;
        
        const parentSection = resultElement.closest('.test-case') || resultElement.closest('.test-section');
        
        if (passed && issues.length === 0) {
            resultElement.textContent = '✅ PASSED';
            resultElement.className = 'test-result text-green-600';
            if (parentSection) {
                parentSection.classList.add('test-passed');
                parentSection.classList.remove('test-failed');
            }
        } else {
            const status = passed ? '⚠️ PASSED WITH WARNINGS' : '❌ FAILED';
            resultElement.innerHTML = `${status}<br><small>${issues.join('<br>')}</small>`;
            resultElement.className = passed ? 'test-result text-yellow-600' : 'test-result text-red-600';
            if (parentSection) {
                parentSection.classList.add('test-failed');
                parentSection.classList.remove('test-passed');
            }
        }
    }
    
    /**
     * Generates test summary
     */
    generateTestSummary() {
        const summaryElement = document.getElementById('summary-results');
        if (!summaryElement) return;
        
        const totalTests = Object.keys(this.testResults).length;
        const passedTests = Object.values(this.testResults).filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;
        
        let summaryHTML = `
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="font-bold text-lg mb-2">Test Summary</h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-green-100 p-3 rounded">
                        <div class="text-2xl font-bold text-green-600">${passedTests}</div>
                        <div class="text-sm text-green-700">Passed</div>
                    </div>
                    <div class="bg-red-100 p-3 rounded">
                        <div class="text-2xl font-bold text-red-600">${failedTests}</div>
                        <div class="text-sm text-red-700">Failed</div>
                    </div>
                    <div class="bg-blue-100 p-3 rounded">
                        <div class="text-2xl font-bold text-blue-600">${totalTests}</div>
                        <div class="text-sm text-blue-700">Total</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add detailed results
        summaryHTML += '<div class="mt-4 space-y-2">';
        Object.entries(this.testResults).forEach(([testName, result]) => {
            const status = result.passed ? '✅' : '❌';
            const issueCount = result.issues.length;
            const issueText = issueCount > 0 ? ` (${issueCount} issue${issueCount > 1 ? 's' : ''})` : '';
            summaryHTML += `<div class="flex justify-between items-center bg-white p-2 rounded">
                <span>${status} ${testName}</span>
                <span class="text-sm text-gray-600">${issueText}</span>
            </div>`;
        });
        summaryHTML += '</div>';
        
        summaryElement.innerHTML = summaryHTML;
        
        console.log('Test Results Summary:', this.testResults);
    }
}

// Initialize tests
new AccessibilityResponsiveTests();