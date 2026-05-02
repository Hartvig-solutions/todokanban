export interface TodoTask {
    id: string; // Unique identifier for React/Vue keys or GitHub mapping later
    keyword: string; // e.g., 'TODO', 'FIXME'
    columnName: string; // The configured column this task belongs to
    moscow?: string; // e.g., 'M', 'S', 'C', 'W'
    labels: string[]; // e.g., ['frontend', 'bug']
    priority?: string; // e.g., 'H', 'M', 'L'
    originalPrefix: string; // The prefix found before the keyword (e.g., '//', '#', '<!--', or '- ')
    message: string;
    filePath: string;
    line: number; // 0-based index for VS Code's selection API
}
