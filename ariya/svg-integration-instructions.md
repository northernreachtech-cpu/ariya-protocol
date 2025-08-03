
# 🎨 SVG Integration for African Traditional Instruments in Web3 App

## Overview

This file provides guidance for using **custom-made SVG illustrations** of African traditional music instruments in our Web3 event management app. The goal is to add **animated, culturally-relevant visual elements** without relying on third-party libraries.

## 🎯 Why Custom SVGs?

- **Lightweight** and fully responsive
- No need for external assets or dependencies
- Fully customizable with TailwindCSS or vanilla CSS
- Perfect for both **light and dark themes**

---

## 🛠️ How to Use the SVGs

### Step 1: Choose Instruments
The following instruments will be designed as SVG components:

- Talking Drum (Hourglass shape)
- Djembe (Goblet-shaped drum)
- Kora (Harp-like instrument)
- Shekere (Beaded gourd shaker)
- Udu (Clay pot drum)

### Step 2: Embed Inline or Use as Components

#### Example: Inline SVG in a Component

```tsx
<div className="w-24 h-40">
  <svg width="100" height="160" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
    <!-- Talking Drum SVG -->
    <path d="M20 10 Q50 40 80 10 Q50 80 80 150 Q50 120 20 150 Q50 80 20 10" fill="#8B4513" stroke="#5C3317" strokeWidth="2"/>
    <ellipse cx="50" cy="10" rx="30" ry="8" fill="#D2B48C" stroke="#5C3317"/>
    <ellipse cx="50" cy="150" rx="30" ry="8" fill="#D2B48C" stroke="#5C3317"/>
    <line x1="20" y1="10" x2="80" y2="150" stroke="#FFF" strokeWidth="1"/>
    <line x1="80" y1="10" x2="20" y2="150" stroke="#FFF" strokeWidth="1"/>
  </svg>
</div>
```

#### Or: Import as React Component

1. Save each instrument as `InstrumentName.svg` in `/assets/svg`
2. Use `@svgr/webpack` or similar loader if using Webpack

```tsx
import TalkingDrum from '@/assets/svg/TalkingDrum.svg';

<TalkingDrum className="w-24 h-auto" />
```

---

## 🎨 Styling Guidelines

- Use TailwindCSS for responsiveness and animations.
- Add `fill-current` or `stroke-current` to allow dynamic theme switching.
- Wrap in motion elements (`framer-motion`) for entry/hover animations.

---

## 🌗 Theme Compatibility

Ensure SVGs adapt to both themes by:

```html
<svg className="text-gray-900 dark:text-yellow-100" ...>
  <!-- Use stroke="currentColor" and fill="currentColor" -->
</svg>
```

---

## ✅ Next Steps

- [ ] Generate clean SVGs for each instrument
- [ ] Convert to reusable React components
- [ ] Animate key parts (ropes shaking, strings vibrating)
- [ ] Apply theme-aware styles

---

For more instrument SVGs or help animating them, please reach out.
