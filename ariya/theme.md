# 🎨 Web3 Event Management App – Color Theme Guide

This guide outlines the primary, secondary, accent, and neutral colors for implementing a consistent and modern UI across **light and dark themes** using **rare but powerful colors**.

---

## 🌗 Theme System Overview

- The design supports both **light** and **dark** themes.
- All colors are carefully selected to retain contrast, readability, and modern aesthetics in both modes.
- Color tokens (CSS variables or Tailwind config) are used for seamless switching between themes.

---

## 🎯 Color Tokens

| Token Name            | Description                     | Light Mode            | Dark Mode             |
|-----------------------|----------------------------------|------------------------|------------------------|
| `--color-primary`     | Main brand color (nav, CTA)     | `#264653` (Indigo Dye) | `#264653`             |
| `--color-secondary`   | Accent (event tags, highlights) | `#C48E88` (Ash Rose)   | `#C48E88`             |
| `--color-success`     | Success / Confirmations         | `#CAD2C5` (Matcha)     | `#CAD2C5`             |
| `--color-accent`      | Hover effects / banners         | `#F4A896` (Dusty Peach)| `#F4A896`             |
| `--color-background`  | Page background                 | `#FAFAFA`              | `#1C1C1C`             |
| `--color-surface`     | Cards, inputs, surfaces         | `#FFFFFF`              | `#2A2A2A`             |
| `--color-text`        | Primary text color              | `#1C1C1C`              | `#EAEAEA`             |
| `--color-muted-text`  | Subtext, hints                  | `#6E6E6E`              | `#B3B3B3`             |
| `--color-border`      | Borders, outlines               | `#E0E0E0`              | `#3B3B3B`             |

---

## 🧩 Usage Examples

### Navbar
- Background: `--color-primary`
- Text: `--color-text`
- Hover: `--color-accent`

### Buttons
- Primary: Background `--color-primary`, Text `--color-surface`
- Secondary: Border `--color-secondary`, Text `--color-secondary`

### Event Tags / Labels
- Background: `--color-secondary`
- Text: White or `--color-surface`

### Cards & Modals
- Background: `--color-surface`
- Border: `--color-border`
- Text: `--color-text`

---

## 🌘 Dark Theme Tips

- Maintain `--color-primary` and `--color-secondary` without alteration (they contrast well in dark UIs).
- Use a **rich dark neutral** (`#1C1C1C` or `#2A2A2A`) for backgrounds to ensure sufficient contrast.
- Text should be bright (`#EAEAEA`) for readability.

---

## ☀️ Light Theme Tips

- Use white (`#FAFAFA` or `#FFFFFF`) for page and card backgrounds.
- Keep text in dark charcoal (`#1C1C1C`).
- Secondary and accent colors can pop without overwhelming the design.

---

## 🛠️ Tailwind CSS Integration

If using Tailwind CSS, you can define your theme like so:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#264653',
      secondary: '#C48E88',
      success: '#CAD2C5',
      accent: '#F4A896',
      background: {
        light: '#FAFAFA',
        dark: '#1C1C1C',
      },
      surface: {
        light: '#FFFFFF',
        dark: '#2A2A2A',
      },
      text: {
        light: '#1C1C1C',
        dark: '#EAEAEA',
      },
      muted: {
        light: '#6E6E6E',
        dark: '#B3B3B3',
      },
      border: {
        light: '#E0E0E0',
        dark: '#3B3B3B',
      },
    },
  },
},
