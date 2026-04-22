# Accessibility Strategy

## Target: WCAG 2.2 AA

## Keyboard
- Complete keyboard navigation without mouse
- Focus trapping in modals and drawers
- Escape closes overlays
- Tab order follows visual order
- Skip links for main content

## Screen Readers
- Semantic HTML landmarks (main, nav, aside)
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels on icon-only buttons
- Live regions for status updates (save, sync)
- Descriptive link text

## Motion
- Respect `prefers-reduced-motion`
- No auto-playing animations
- Essential animations (progress indicators) continue

## Color
- Minimum 4.5:1 contrast for normal text
- Minimum 3:1 for large text and UI components
- Never rely on color alone for state (icons + text)

## Testing
- axe-core automated checks
- Manual keyboard navigation test
- VoiceOver (macOS) manual testing
- Lighthouse a11y audit > 95
