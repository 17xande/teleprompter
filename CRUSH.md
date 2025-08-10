# Project Guidelines for Agentic Coding

This document outlines the conventions and commands for working in the `teleprompter` repository.

## Build/Lint/Test Commands

*   **Build Frontend:** `npm run build`
*   **Build Frontend (Watch Mode):** `npm run build:watch`
*   **Develop Cloudflare Worker:** `npm run dev`
*   **Deploy Cloudflare Worker:** `npm run deploy`
*   **Type Checking:** `npx tsc --noEmit` (to check types without emitting JS)
*   **Run Single Test:** Not explicitly configured. For unit tests, `deno test` would be the likely command if Deno is used for testing. Otherwise, a test runner like Vitest or Jest would need to be integrated.

## Code Style Guidelines

*   **Language:** TypeScript
*   **Imports:** Use relative paths for local modules.
*   **Formatting:**
    *   Indentation: 2 spaces.
    *   Semicolons: Used at the end of statements.
*   **Types:**
    *   Explicit type annotations are preferred for clarity, especially for function parameters and return types.
    *   Leverage TypeScript's type inference where appropriate.
*   **Naming Conventions:**
    *   Variables and functions: `camelCase` (e.g., `myVariable`, `calculateValue`).
    *   Classes: `PascalCase` (e.g., `MyClass`, `TPClockControl`).
    *   HTML Custom Elements: `kebab-case` (e.g., `<my-component>`).
*   **Error Handling:** Use `try...catch` blocks for asynchronous operations and `throw new Error()` for unrecoverable errors. Log errors using `console.error()`.
*   **Comments:** Use sparingly for explaining *why* something is done, especially for complex logic. JSDoc-style comments are acceptable for public APIs.
*   **Frameworks/Libraries:**
    *   Frontend: `esbuild` for bundling, `@shoelace-style/shoelace` for UI components, `quill` for rich text editing.
    *   Worker: `hono` for the API, Cloudflare Workers runtime.
