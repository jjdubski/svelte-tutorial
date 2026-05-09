# Svelte Todo App

[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![lucide-svelte](https://img.shields.io/badge/lucide--svelte-1.0-F56565?logo=lucide&logoColor=white)](https://lucide.dev/)

A feature-rich todo application built with **Svelte 5** (runes mode) and
**SvelteKit 2**, demonstrating modern Svelte patterns like `$state`, `$derived`,
`$effect`, `$props`, context stores, transitions, spring animations, and more.

---

## Features

| Feature                    | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **CRUD Tasks**             | Create, read, update, and delete tasks with inline editing                                  |
| **Categories**             | Work, Personal, Ideas — plus custom categories with auto-assigned colors                    |
| **Tags**                   | Predefined tags + custom tags with random color generation                                  |
| **Priorities**             | High, Medium, Low with color-coded badges                                                   |
| **Due Dates**              | Date picker with overdue highlighting (Today/Tomorrow formatting)                           |
| **Recurring Tasks**        | Daily, weekly, monthly — auto-creates next instance on completion                           |
| **Subtasks**               | Add, toggle, and track subtask progress per todo                                            |
| **Task Templates**         | Quick-fill from templates: Meeting, Errand, Urgent, Health                                  |
| **Batch Operations**       | Select mode to complete or delete multiple tasks at once                                    |
| **Drag & Drop**            | Manual reorder with custom ghost preview and drop-position indicator                        |
| **Drag-to-Assign**         | Drag a task onto a category or tag pill to assign it                                        |
| **Fuzzy Search**           | Character-wise fuzzy matching across titles and descriptions                                |
| **Advanced Filters**       | Status, priority, category, tag intersection (AND), date range                              |
| **Sort Options**           | Manual, priority, due date, alphabetical (A-Z / Z-A), category                              |
| **Kanban Board**           | `/board` — Pending / In Progress / Done columns with drag between                           |
| **Analytics Dashboard**    | `/stats` — completion rate, streak, productivity chart, priority dist., categories, overdue |
| **Markdown Descriptions**  | Zero-dep renderer for `**bold**`, `*italic*`, `` `code` ``, `[links](url)`, headings, lists |
| **Due Date Notifications** | Web Notifications API + in-app upcoming section with inline opt-in banner                   |
| **Share Task**             | Native Web Share API with clipboard fallback                                                |
| **Quick Add via URL**      | Pre-fill form from query params (`?title=&desc=&due=&priority=...`)                         |
| **Dark Mode**              | Toggle with system preference detection, persistent storage, zero FOUC                      |
| **Undo Delete**            | Toast notification with undo button                                                         |
| **Keyboard Shortcuts**     | `Ctrl+N` quick add, `Escape` exit select / edit mode                                        |
| **Stats Bar**              | Spring-animated counters for active, completed, overdue tasks                               |
| **Skeleton Loading**       | Animated placeholder while data initializes                                                 |
| **Animations**             | fade, slide, scale, flip transitions with spring-eased stats                                |
| **Reduced Motion**         | Respects `prefers-reduced-motion` — disables all animations                                 |
| **Persistent Storage**     | All data saved to `localStorage` with error handling                                        |
| **Responsive**             | Adapts from mobile to desktop with rounded card-based layout                                |
| **Theme System**           | Runtime CSS custom properties for full light/dark theming                                   |
| **Accessibility**          | Skip link, focus-visible rings, aria-labels on all controls, touch-action                   |

---

## Getting Started

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

## Project Structure

```bash
src/
├── app.css                    # Global styles, CSS custom properties (light/dark), animations
├── app.html                   # Shell HTML template (dark mode preload, theme-color meta)
├── lib/
│   ├── __tests__/             # Unit tests (Vitest)
│   │   ├── markdown.test.js
│   │   ├── storage.test.js
│   │   └── todoStore.test.js
│   ├── assets/
│   │   └── favicon.svg
│   ├── index.js               # Library barrel export
│   ├── markdown.js            # Zero-dep markdown renderer
│   ├── NavBar.svelte          # Navigation bar (Tasks / Board / Analytics / Archived)
│   ├── SkeletonLoader.svelte  # Animated loading placeholder
│   ├── StatsBar.svelte        # Spring-animated stat counters
│   ├── storage.js             # Safe localStorage wrapper with error handling
│   ├── Toast.svelte           # Toast notification with undo support
│   ├── Todo.svelte            # Single todo item (view, edit, subtasks, drag, share, markdown)
│   ├── TodoFilters.svelte     # Search, filter, sort, category pills, batch select
│   ├── TodoForm.svelte        # Add-task form with templates, tags, subtasks
│   ├── TodoHeader.svelte      # App title + dark mode toggle
│   ├── TodoList.svelte        # Renders filtered list with loading/empty/due states
│   └── todoStore.svelte.js    # Central store (class + createContext) — all state & logic
├── routes/
│   ├── +layout.svelte         # Root layout (creates store, renders NavBar + page content)
│   ├── +page.svelte           # Main list view (orchestrates header, form, filters, list)
│   ├── archived/
│   │   └── +page.svelte       # Archived tasks view (placeholder)
│   ├── board/
│   │   └── +page.svelte       # Kanban board (Pending / In Progress / Done)
│   └── stats/
│       └── +page.svelte       # Analytics dashboard
e2e/
└── todo.spec.js               # End-to-end tests (Playwright)
```

### Key files

| File                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `src/lib/todoStore.svelte.js` | Central store: class with `$state` fields, exposed via `createContext`  |
| `src/lib/Todo.svelte`         | Single todo with inline editing, subtasks, drag handle, share, markdown |
| `src/lib/TodoForm.svelte`     | Add-task form with templates, tags, subtasks                            |
| `src/lib/TodoFilters.svelte`  | Search, filter, sort, category pills, batch select                      |
| `src/lib/TodoList.svelte`     | Renders filtered list with differentiated empty states                  |
| `src/lib/NavBar.svelte`       | Route navigation with active-state highlighting                         |
| `src/lib/storage.js`          | Safe localStorage wrapper with error handling                           |
| `src/lib/markdown.js`         | Zero-dependency markdown renderer                                       |
| `src/app.css`                 | CSS custom properties, Tailwind imports, glow animations                |

---

## Built With

| Technology                                                                                               | Purpose                                                             |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Svelte 5](https://svelte.dev/)                                                                          | UI framework with runes (`$state`, `$derived`, `$effect`, `$props`) |
| [SvelteKit 2](https://kit.svelte.dev/)                                                                   | Application framework (routing, SSR-ready)                          |
| [Vite 7](https://vite.dev/)                                                                              | Build tool and dev server                                           |
| [Tailwind CSS 4](https://tailwindcss.com/)                                                               | Utility-first CSS via PostCSS                                       |
| [lucide-svelte](https://lucide.dev/)                                                                     | Icon library                                                        |
| [Prettier](https://prettier.io/)                                                                         | Code formatting (+ plugins for Svelte & Tailwind)                   |
| [ESLint](https://eslint.org/) + [eslint-plugin-svelte](https://github.com/sveltejs/eslint-plugin-svelte) | Code linting                                                        |
| [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged)   | Pre-commit formatting and lint hooks                                |
| [Vitest](https://vitest.dev/)                                                                            | Unit testing (45 tests)                                             |
| [Playwright](https://playwright.dev/)                                                                    | End-to-end testing (6 tests)                                        |

---

## Svelte 5 Patterns Used

- **Runes**: `$state`, `$derived`, `$derived.by`, `$effect`, `$props`
- **Context store**: Class-based store with `createContext` / `setContext` / `getContext`
- **SvelteSet**: Reactive `Set` for batch selection
- **Transitions**: `fade`, `slide`, `scale` with custom easings (`cubicOut`, `elasticOut`)
- **Animations**: `flip` for list reordering
- **Motion**: `spring` store for animated stat counters
- **Event handlers**: All on-element (`onclick`, `onkeydown`, etc.)
- **{@render children()}**: Snippet rendering in layout

---

## Scripts

| Script                 | Action                            |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start development server          |
| `npm run build`        | Build for production              |
| `npm run preview`      | Preview production build          |
| `npm run test`         | Run unit tests (Vitest)           |
| `npm run test:watch`   | Run unit tests in watch mode      |
| `npm run test:e2e`     | Run end-to-end tests (Playwright) |
| `npm run lint`         | Lint source code with ESLint      |
| `npm run lint:fix`     | Auto-fix lint issues              |
| `npm run format`       | Format all files with Prettier    |
| `npm run format:check` | Check formatting without writing  |
