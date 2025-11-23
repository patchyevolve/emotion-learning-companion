# 📱 Quick Reference - Mobile Responsive EALC

> **Quick lookup guide for common patterns and code snippets**

---

## 🎯 Essential Breakpoints

```css
/* Mobile First */
Base: 320px+     /* Mobile */
@media (min-width: 768px)  /* Tablet */
@media (min-width: 900px)  /* Desktop */
@media (min-width: 1440px) /* Large Desktop */
```

---

## 🎨 CSS Variables (Copy-Paste Ready)

```css
:root {
  /* Colors */
  --accent: #667eea;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --bg: #ffffff;
  --card-bg: rgba(255, 255, 255, 0.95);
  --border: #e5e7eb;
  
  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Typography */
  --font-xs: clamp(12px, 2vw, 14px);
  --font-sm: clamp(14px, 2.5vw, 16px);
  --font-base: clamp(16px, 3vw, 18px);
  --font-lg: clamp(18px, 3.5vw, 22px);
  --font-xl: clamp(24px, 5vw, 32px);
}

[data-theme="dark"] {
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --bg: #111827;
  --card-bg: rgba(31, 41, 55, 0.95);
  --border: #374151;
}
```

---

## 🧭 Hamburger Menu (Complete)

```html
<!-- Button -->
<button id="menuBtn" class="mobile-menu-btn">☰</button>

<!-- Overlay -->
<div id="overlay" class="overlay"></div>

<!-- Drawer -->
<div id="drawer" class="drawer">
  <button onclick="closeMenu()">×</button>
  <nav><!-- Menu items --></nav>
</div>
```

```css
.mobile-menu-btn { display: none; }
@media (max-width: 768px) {
  .mobile-menu-btn { display: block; }
}

.drawer {
  position: fixed;
  top: 0;
  right: -100%;
  width: 280px;
  height: 100vh;
  background: var(--bg);
  transition: right 0.3s ease;
  z-index: 1001;
}
.drawer.active { right: 0; }

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: 1000;
}
.overlay.active {
  opacity: 1;
  pointer-events: all;
}
```

```javascript
function openMenu() {
  document.getElementById('drawer').classList.add('active');
  document.getElementById('overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  document.getElementById('drawer').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('menuBtn').onclick = openMenu;
document.getElementById('overlay').onclick = closeMenu;
```

---

## 🎨 Theme Toggle (Complete)

```html
<button id="themeToggle">🌙</button>
```

```javascript
function initTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').innerText = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('themeToggle').innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

document.getElementById('themeToggle').onclick = toggleTheme;
initTheme();
```

---

## 📐 Responsive Grid

```css
/* Auto-fit grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(16px, 3vw, 24px);
}
```

---

## 🎴 Card Component

```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: clamp(16px, 3vw, 24px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px);
  }
}
```

---

## 🔘 Button Component

```css
.btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s ease;
}

@media (hover: hover) {
  .btn:hover {
    transform: translateY(-2px);
  }
}
```

---

## 📝 Input Component

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid var(--border);
  background: var(--bg);
  color: var(--text-primary);
  font-size: 16px; /* Prevents iOS zoom */
  min-height: 44px;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

---

## 🪟 Modal/Panel

```css
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  background: var(--bg);
  border-radius: 16px;
  padding: 24px;
  z-index: 1001;
}

@media (max-width: 480px) {
  .modal {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    top: 0;
    left: 0;
    transform: none;
  }
}
```

---

## 📜 Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.6);
}
```

---

## 🎬 Animations

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.animate-fade { animation: fadeIn 0.3s ease; }
.animate-slide { animation: slideIn 0.3s ease; }
```

---

## 🔧 Utility Classes

```css
/* Spacing */
.mt-sm { margin-top: 8px; }
.mt-md { margin-top: 16px; }
.mt-lg { margin-top: 24px; }

.p-sm { padding: 8px; }
.p-md { padding: 16px; }
.p-lg { padding: 24px; }

/* Text */
.text-center { text-align: center; }
.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Flex */
.flex { display: flex; }
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Responsive */
.hide-mobile { display: block; }
.show-mobile { display: none; }

@media (max-width: 768px) {
  .hide-mobile { display: none; }
  .show-mobile { display: block; }
}
```

---

## 🎯 Touch Optimization

```css
/* Touch-friendly sizing */
button, a, input {
  min-height: 44px;
  min-width: 44px;
}

/* Disable text selection on buttons */
button {
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Only hover on hover-capable devices */
@media (hover: hover) {
  .btn:hover { background: blue; }
}

@media (hover: none) {
  .btn:active { background: blue; }
}
```

---

## 🚨 Common Fixes

```css
/* Prevent horizontal scroll */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Responsive images */
img {
  max-width: 100%;
  height: auto;
}

/* Fix iOS input zoom */
input, textarea {
  font-size: 16px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Box sizing */
*, *::before, *::after {
  box-sizing: border-box;
}
```

---

## 📱 Meta Tags

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#667eea">
<meta name="description" content="Your description">

<!-- iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

<!-- Android -->
<meta name="mobile-web-app-capable" content="yes">
```

---

## 🎨 Loading Spinner

```html
<div class="spinner"></div>
```

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📊 Toast Notification

```javascript
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

```css
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 9999;
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}

.toast-success { border-left: 4px solid #10b981; }
.toast-error { border-left: 4px solid #ef4444; }
.toast-warning { border-left: 4px solid #f59e0b; }
.toast-info { border-left: 4px solid #3b82f6; }
```

---

*Use this as a quick reference while implementing mobile responsiveness!*
