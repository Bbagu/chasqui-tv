---
name: chasqui-ui
description: Design system guidelines for Chasqui TV, including Tailwind colors, fonts, and banner slot positions. Use when creating new UI components or editing existing pages to ensure brand consistency.
---

# Chasqui UI

## Overview

This skill ensures that all visual modifications to Chasqui TV adhere to the established brand identity and technical structure.

## Identity Guidelines

### Color Palette
- **Amarillo**: `#F5C400` (Main accents, logos)
- **Rojo**: `#CC1818` (Alerts, categories, live indicator)
- **Negro**: `#111111` (Headers, backgrounds)
- **Gris Oscuro**: `#1E1E1E` (Navigation, secondary backgrounds)
- **Gris Claro**: `#F8F8F8` (Main page background)

### Typography
- **Headings**: `Bebas Neue`, sans-serif (Bold, uppercase)
- **Subheadings/Condensed**: `Barlow Condensed`, sans-serif
- **Body Text**: `Barlow`, sans-serif
- **Article Body**: `Lora`, serif (For better readability)

## Technical Architecture

### Banner Slots (IDs)
Use these IDs in HTML to ensure banners load correctly via `main.js`:
1. `header-banner`: Top of page, under nav.
2. `sidebar-banner`: Right column in home and articles.
3. `article-banner`: Inside the news content.
4. `footer-banner`: Bottom of page, above footer.

### Tailwind Components
- **Buttons**: `bg-amarillo text-negro font-bebas` or `bg-rojo text-white font-bebas`.
- **Containers**: `max-w-7xl mx-auto px-6`.
- **Live Indicator**: `w-3 h-3 bg-rojo rounded-full animate-ping`.

## UI Workflows

### 1. Creating a New Component
1. Wrap in a responsive Tailwind container.
2. Use `Bebas Neue` for titles and `Barlow` for descriptions.
3. Apply `hover:scale-105 transition duration-500` for interactive cards.

### 2. Updating Live URL Player
Ensure the iframe has `id="livePlayer"` and the container is `aspect-video`.
