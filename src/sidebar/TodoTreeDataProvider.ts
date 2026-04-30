import * as vscode from 'vscode';
import * as path from 'path';
import { scanWorkspaceForTasks, getColumnsConfig } from '../scanner/workspaceScanner';
import { TodoTask } from '../models/task';

export class TodoTreeDataProvider implements vscode.TreeDataProvider<TodoTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TodoTreeItem | undefined | void> = new vscode.EventEmitter<TodoTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TodoTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private tasks: TodoTask[] = [];

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TodoTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TodoTreeItem): Promise<TodoTreeItem[]> {
        if (!element) {
            // Root level: Return configured columns
            this.tasks = await scanWorkspaceForTasks();
            const columns = getColumnsConfig();
            
            return columns.map(col => {
                const colTasks = this.tasks.filter(t => t.columnName === col.name);
                return new TodoTreeItem(
                    `${col.name} (${colTasks.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'column',
                    col.name
                );
            });
        } else if (element.type === 'column' && element.columnName) {
            // Child level: Return tasks for the column
            const colTasks = this.tasks.filter(t => t.columnName === element.columnName);
            return colTasks.map(task => {
                const fileName = path.basename(task.filePath);
                return new TodoTreeItem(
                    `${task.keyword}: ${task.message}`,
                    vscode.TreeItemCollapsibleState.None,
                    'task',
                    task.columnName,
                    task,
                    `${fileName}:${task.line + 1}`
                );
            });
        }
        
        return [];
    }
}

export class TodoTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'column' | 'task',
        public readonly columnName?: string,
        public readonly task?: TodoTask,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.label;
        this.description = description;

        if (type === 'task' && task) {
            // Make the item clickable
            this.command = {
                command: 'todokanban.openFile',
                title: 'Open File',
                arguments: [task.filePath, task.line]
            };
            
            // Icon for tasks
            this.iconPath = new vscode.ThemeIcon('checklist');
        } else {
            // Icon for columns
            this.iconPath = new vscode.ThemeIcon('layout-sidebar-right');
        }
    }
}
