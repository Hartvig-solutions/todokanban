# ToDoKanban Future Roadmap & Ideas

This file tracks potential features, enhancements, and known technical debt for the ToDoKanban extension.

## Feature Ideas

### 1. GitHub Integration (Phase 3)
- TODO {S} [feature, github] (H): Connect workspace tasks with actual GitHub Issues.
- TODO {M} [feature, sync] (M): Two-way sync: Closing a task on the board closes the GitHub issue, and vice versa.
- TODO {C} [ui, github] (L): Show GitHub avatars on task cards.

### 2. Enhanced Scanning
- DONE {M} [feature, scanner] (H): Support multi-line block comments (e.g., `/* TODO: ... */`) and JS Doc strings.
- TODO {C} [feature, scanner] (M): Add support for detecting assignees, e.g., `// TODO(@Jackie): do this`.
- TODO {S} [feature, config] (M): Allow the scanner to be configured to ignore specific directories beyond `node_modules` and `out`.

### 3. UI/UX Improvements
- TODO {W} [ui, ux] (L): Allow drag-and-drop reordering *within* a column (persisting the order via a lightweight local cache).
- TODO {S} [ui, feature] (M): Add a search/filter bar to the Webview to quickly find tasks.
- TODO {C} [ui, config] (M): Allow users to customize column colors in the VS Code settings.
- TODO {S} [ui, markdown] (M): Support markdown rendering within the task description on the cards.

### 4. Technical Debt & Refactoring
- TODO {M} [refactor, tech-debt] (H): Extract the webview HTML generation into a separate templating file instead of a string literal.
- TODO {M} [testing, tech-debt] (H): Add comprehensive Unit Tests and Integration Tests using the VS Code Test API.

### 5. Task Creation & Management
- TODO {S} [feature, ui] (H): Add ability to create new TODOs directly from the Kanban board or Sidebar.
- TODO {S} [feature, file-handling] (H): Newly created tasks should automatically be saved into a central `TODO.md` or `.todo` file.

### 6. DevOps & Release Workflow
- TODO {S} [infrastructure, devops] (M): Implement `release-please` for automated versioning and changelog generation.
- TODO {S} [infrastructure, devops] (M): Establish a formal branching strategy/flow for future development.
