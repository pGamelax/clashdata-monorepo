/**
 * Initialize theme with custom primary color from environment variable
 * This script runs early to set CSS custom properties based on VITE_PRIMARY_COLOR
 */

import { getPrimaryColor } from './theme-utils';

/**
 * Initialize theme colors on page load
 */
export function initTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primaryColor = getPrimaryColor();

  // Set primary color and variants as OKLCH
  root.style.setProperty('--primary', primaryColor);
  root.style.setProperty('--primary-oklch', primaryColor);
  root.style.setProperty('--ring', primaryColor);
  root.style.setProperty('--sidebar-primary', primaryColor);
  root.style.setProperty('--sidebar-ring', primaryColor);

  // Ensure dark class is always applied
  root.classList.remove('light');
  root.classList.add('dark');

  // Store theme state
  localStorage.setItem('vite-ui-theme', 'dark');
  
  console.log('[Theme] 🎨 Theme initialized with primary color:', primaryColor);
}

/**
 * Apply theme immediately when script loads
 */
initTheme();

/**
 * Re-apply theme when DOM is ready (in case script loaded before DOM)
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

