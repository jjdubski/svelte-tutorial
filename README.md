# 📋 Svelte Todo App

[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![lucide-svelte](https://img.shields.io/badge/lucide--svelte-1.0-F56565?logo=lucide&logoColor=white)](https://lucide.dev/)

A feature-rich todo list application built with **Svelte 5** (runes mode) and **SvelteKit 2**, demonstrating modern Svelte patterns like `$state`, `$derived`, `$effect`, `$props`, transitions, spring animations, and more.

---

## ✨ Features

| Feature                | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| **CRUD Tasks**         | Create, read, update, and delete tasks with inline editing                       |
| **Categories**         | Work, Personal, Ideas — plus custom category creation with auto-assigned colors  |
| **Tags**               | Predefined tags + custom tags with random color generation                       |
| **Priorities**         | High, Medium, Low with color-coded badges                                        |
| **Due Dates**          | Date picker with overdue highlighting (Today/Tomorrow formatting)                |
| **Recurring Tasks**    | Daily, weekly, and monthly recurrence — auto-creates next instance on completion |
| **Subtasks**           | Add, toggle, and track subtask progress per todo                                 |
| **Task Templates**     | Quick-fill from templates: Meeting, Errand, Urgent, Health                       |
| **Batch Operations**   | Select mode to complete or delete multiple tasks at once                         |
| **Drag & Drop**        | Manual reorder via native HTML5 drag-and-drop                                    |
| **Search**             | Real-time full-text search across titles and descriptions                        |
| **Filter & Sort**      | Filter by status (all/active/done) and category; sort by priority or due date    |
| **Dark Mode**          | Toggle with system preference detection and persistent storage                   |
| **Undo Delete**        | Toast notification with undo button (4-second window)                            |
| **Stats Bar**          | Animated counters for active, completed, overdue, and total tasks                |
| **Keyboard Shortcuts** | `Ctrl+N` quick add, `Escape` to exit select mode                                 |
| **Skeleton Loading**   | Animated placeholder while data initializes                                      |
| **Animations**         | Svelte built-in transitions (fade, slide, scale, flip) with spring-eased stats   |
| **Reduced Motion**     | Respects `prefers-reduced-motion` — disables all animations                      |
| **Persistent Storage** | All data saved to `localStorage` automatically                                   |
| **Responsive**         | Adapts from mobile to desktop with rounded card-based layout                     |
| **Dark/Light Themes**  | Runtime CSS custom properties for full theme support                             |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm, yarn, bun)

### Install

```sh
npm install
```

### Development

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```sh
npm run build
```

Preview the production build with `npm run preview`.

---

## 🗂️ Project Structure

```bash
src/
├── app.css                    # Global styles, CSS custom properties (light/dark), animations
├── app.html                   # Shell HTML template
├── lib/
│   ├── assets/
│   │   └── favicon.svg
│   ├── index.js               # Library barrel export
│   ├── SkeletonLoader.svelte  # Animated loading placeholder
│   ├── StatsBar.svelte        # Animated stats counter (active / completed / overdue)
│   ├── Toast.svelte           # Toast notification with undo support
│   └── Todo.svelte            # Individual todo item (view, edit, subtasks, drag)
└── routes/
    ├── +layout.svelte         # Root layout (imports global CSS, sets favicon)
    └── +page.svelte           # Main page: form, filters, list, and all app logic
```

### Key files

| File                            | Purpose                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| `src/routes/+page.svelte`       | Main application — manages all state, filters, sorting, batch ops |
| `src/lib/Todo.svelte`           | Single todo component with inline editing, subtasks, drag handle  |
| `src/lib/StatsBar.svelte`       | Animated stats using Svelte `spring` motion stores                |
| `src/lib/Toast.svelte`          | Bottom-center toast notification with undo                        |
| `src/lib/SkeletonLoader.svelte` | Pulse + shimmer skeleton placeholders                             |
| `src/app.css`                   | CSS custom properties theming, Tailwind imports, glow animations  |

---

## 🧰 Built With

| Technology                                                                                             | Purpose                                                             |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [Svelte 5](https://svelte.dev/)                                                                        | UI framework with runes (`$state`, `$derived`, `$effect`, `$props`) |
| [SvelteKit 2](https://kit.svelte.dev/)                                                                 | Application framework (routing, SSR-ready)                          |
| [Vite 7](https://vite.dev/)                                                                            | Build tool and dev server                                           |
| [Tailwind CSS 4](https://tailwindcss.com/)                                                             | Utility-first CSS via PostCSS                                       |
| [lucide-svelte](https://lucide.dev/)                                                                   | Icon library                                                        |
| [Prettier](https://prettier.io/)                                                                       | Code formatting (+ plugins for Svelte & Tailwind)                   |
| [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) | Pre-commit formatting hooks                                         |

---

## 🧪 Svelte 5 Patterns Used

This project intentionally showcases modern Svelte 5 idioms:

- **Runes**: `$state`, `$derived`, `$derived.by`, `$effect`, `$props`
- **SvelteSet**: Reactive `Set` for batch selection
- **Transitions**: `fade`, `slide`, `scale` with custom easings (`cubicOut`, `elasticOut`)
- **Animations**: `flip` for list reordering
- **Motion**: `spring` store for animated stat counters
- **Snippets** and **event handlers**: All on-element (`onclick`, `onkeydown`, etc.)

---

## 🔧 Scripts

| Script                 | Action                           |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start development server         |
| `npm run build`        | Build for production             |
| `npm run preview`      | Preview production build         |
| `npm run format`       | Format all files with Prettier   |
| `npm run format:check` | Check formatting without writing |
