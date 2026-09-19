---
name: addy-engineering-standards
description: "Addy Osmani's production-grade engineering skills for AI coding agents: web performance optimization (Core Web Vitals), clean architecture, bundle budget enforcement, accessible UX, and resilient component design."
---

# Addy Osmani Engineering Standards

Production-grade engineering principles for modern web and system applications:

## 1. Core Web Vitals & Web Performance
- **LCP (Largest Contentful Paint)**: Prioritize critical asset delivery, eliminate render-blocking resources, preconnect critical origins.
- **INP (Interaction to Next Paint)**: Keep main thread execution under 50ms chunks. Break down long tasks with `scheduler.yield()` or microtask slicing.
- **CLS (Cumulative Layout Shift)**: Always set explicit width/height or aspect-ratio on images, visual containers, and dynamic skeletons.

## 2. Bundle Overhead & Architecture
- **Tree-Shaking First**: Import specific named exports rather than entire namespace packages.
- **Lazy Load Non-Critical Paths**: Code-split route boundaries, heavy visualization modules, and modal dialogs.
- **Defensive Component Contracts**: Validate props, handle null/empty loading states gracefully, never crash on unhandled edge cases.

## 3. Accessible UX (WCAG AA)
- High contrast color ratios, explicit ARIA labels on icon-only buttons, complete keyboard focusability (`tabindex`, focus rings).
