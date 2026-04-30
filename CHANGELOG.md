# Changelog

All notable changes to the "ToDoKanban" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - Initial Alpha Release

### Added
- Core workspace file scanning and RegEx parsing for inline comments (e.g., `// TODO:`, `// FIXME:`).
- Advanced syntax parsing for tags: Supports `{MoSCoW}` prioritization, `[labels]`, and `(Priority)` levels.
- Configurable Kanban columns via `todokanban.columns` setting in `settings.json`.
- Interactive HTML5 Drag-and-Drop Webview board for visual task management.
- Sidebar Tree View navigation showing tasks grouped by columns.
- One-click navigation: Click any task on the board or in the sidebar to jump directly to the source code line.
- Automatic two-way source code updates when a task is moved in the Kanban board.
- Background sync that refreshes the board and sidebar automatically when files are saved.