# Style & Conventions

## File Naming
- **React Components/Pages**: `kebab-case.tsx` (e.g., `simulator-view.tsx`, `page.tsx`). *Note: While file names are kebab-case, the default export is often PascalCase.*
- **Utilities/Logic**: `kebab-case.ts` (e.g., `utils.ts`, `validation-schema.ts`).
- **Directories**: `kebab-case` (e.g., `_components`, `api`).

## Code Styling
- **Components**: Use **PascalCase** for component names (e.g., `function LatestPost()`).
- **Hooks**: Use **camelCase** prefixed with `use` (e.g., `useSimulation`).
- **Variables/Functions**: Use **camelCase**.
- **Types/Interfaces**: Use **PascalCase**.

## Imports
- **Alias**: Always use the `~` alias for internal imports to avoid relative path hell.
  - `~/trpc/...`
  - `~/server/...`
  - `~/app/_components/...`
- **Grouping**: Group imports by:
  1. External packages (e.g., `react`, `next`).
  2. Internal absolute imports (`~/...`).
  3. Relative imports (`./...`).

## Component Structure
- **Client Components**: Explicitly add `"use client";` at the top of the file if hooks or interactivity are used.
- **Exports**: Named exports are preferred for components (`export function MyComponent() {}`).

## Styling
- **Framework**: Use **Tailwind CSS**.
- **Practices**:
  - Avoid large `style={{}}` blocks; use Tailwind utility classes.
  - Use `clsx` or `tailwind-merge` for conditional class names.
