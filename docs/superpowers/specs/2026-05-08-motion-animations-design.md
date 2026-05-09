# Motion Animations — Design Spec

## Overview

Add smooth, modern animations to the Todo app using Svelte's built-in `svelte/motion` (spring/tweened) and `svelte/transition` libraries. No external animation dependencies.

## Animation Inventory

### 1. Glow Effects on Hover (CSS transitions)

**Where:** Buttons (`[data-btn]`), Todo cards, Tag badges, Category buttons

**Behavior:**

- Primary buttons glow with a matching colored `box-shadow` on hover
- Todo cards elevate (`translateY(-2px)`) with a subtle blue-tinted shadow
- Tag badges scale up slightly (`scale(1.08)`) and glow in their tag color
- Category filter buttons get a colored underline/glow when active

**Technique:** Pure CSS transitions on `box-shadow`, `transform`, `border-color` — no JS needed, 60fps composited animations.

### 2. Spring-Animated Stats Bar (`svelte/motion`)

**Where:** `StatsBar.svelte`

**Behavior:**

- Stats numbers (active, completed, overdue, total) spring-animate between values
- Uses `spring()` from `svelte/motion` with `stiffness: 0.15, damping: 0.8`

**Technique:** Wrap each stat number in a reactive wrapper that uses `$derived` to feed a spring store.

### 3. Smooth List Transitions (`svelte/transition`)

**Where:** Todo list items in `+page.svelte`

**Behavior:**

- **Enter:** Items scale in from 0.95 + fade in (200ms, elasticOut)
- **Exit:** Items scale down to 0.9 + fade out (150ms, cubicOut)
- **Reorder:** `flip` animation (300ms, cubicOut) for smooth list reflow
- **Staggered delay:** Each successive item enters with a 40ms delay

**Technique:** Custom transition using `scale` + `fade` combined via Svelte's transition function params.

### 4. Toast Spring Bounce (`svelte/transition` + CSS)

**Where:** `Toast.svelte`

**Behavior:**

- Toast slides up from bottom with `slide` transition using spring-like easing
- Add a subtle bounce via custom CSS keyframe on the inner container

**Technique:** Use `slide` transition with custom easing curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

### 5. Checkbox Spring Bounce (CSS)

**Where:** Todo item checkboxes

**Behavior:**

- Checkbox springs to checked state with a brief scale bounce
- Uses `accent-color` + CSS `:checked` transform

### 6. Crossfade Form Views (`svelte/transition`)

**Where:** Add form show/hide in `+page.svelte`

**Behavior:**

- Form crossfades in/out instead of abrupt slide
- Uses `fade` + `scale` combined transition

### 7. Staggered Section Reveals (CSS)

**Where:** Filter bar, category bar, stats bar

**Behavior:**

- Sections fade in on initial load with staggered delays
- Uses CSS `animation` with `animation-delay` staggered per section

## Files to Modify

| File                      | Changes                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| `src/app.css`             | Add glow keyframes, spring checkbox styles, stagger animation classes       |
| `src/lib/StatsBar.svelte` | Add `svelte/motion` `spring()` for animated numbers                         |
| `src/lib/Toast.svelte`    | Enhance toast entrance with spring-bounce easing                            |
| `src/lib/Todo.svelte`     | Add glow hover effects, checkbox bounce, card elevation                     |
| `src/routes/+page.svelte` | Enhanced list transitions, glow effects, crossfade form, staggered sections |

## Reduced Motion

All existing `prefers-reduced-motion` guards are preserved. Any new animation must also check `prefersReducedMotion` and skip/duration=0 when active.
