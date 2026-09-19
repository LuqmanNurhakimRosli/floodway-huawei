---
name: addy-code-review
description: "Addy Osmani production code review checklist: audit performance bottlenecks, bundle overhead, memory leaks, rendering loops, WCAG accessibility, and API boundary robustness."
---

# Addy Osmani Production Code Review Checklist

When auditing or reviewing code:

1. **Performance**: Are there unnecessary re-renders, unmemoized expensive calculations, or large dependencies added for tiny helpers?
2. **Resilience**: Are network requests wrapped with proper error handling and fallback UI?
3. **Accessibility**: Do all interactive elements have keyboard navigation, ARIA roles, and readable contrast?
4. **Clean Code**: Is code self-documenting, modular, and free of dead logic?
