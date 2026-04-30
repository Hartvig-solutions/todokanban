import * as vscode from 'vscode';
import { TodoTask } from '../models/task';

export interface ColumnConfig {
    name: string;
    keywords: string[];
}

export function getColumnsConfig(): ColumnConfig[] {
    const config = vscode.workspace.getConfiguration('todokanban');
    return config.get<ColumnConfig[]>('columns', [
        { name: 'To Do', keywords: ['TODO', 'FIXME'] },
        { name: 'In Progress', keywords: ['IN PROGRESS', 'DOING'] },
        { name: 'Done', keywords: ['DONE'] }
    ]);
}

/**
 * Builds a dynamic RegEx based on user-configured keywords.
 * 
 * Target syntax: // KEYWORD {MoSCoW} [label1, label2] (Priority): Message
 * Matches: // fixme {M} [auth, UI] (H): Fix the login crash
 * Matches: // TODO: update this
 */
function buildCommentRegex(keywords: string[]): RegExp {
    const keywordGroup = keywords.join('|');
    
    return new RegExp(
        `\\/\\/\\s*(?<keyword>${keywordGroup})` +      // Match '//' + spacing + Keyword
        `(?:\\s*\\{(?<moscow>[a-zA-Z])\\})?` +         // Optional {MoSCoW}
        `(?:\\s*\\[(?<labels>[^\\]]+)\\])?` +          // Optional [label1, label2]
        `(?:\\s*\\((?<priority>[a-zA-Z])\\))?` +       // Optional (Priority)
        `(?:\\s*:)?\\s*` +                             // Optional colon followed by spacing
        `(?<message>.*)`,                              // The rest is the message
        'ig'                                           // Case-insensitive, global matching
    );
}

/**
 * Scans the workspace for matching inline comments.
 */
export async function scanWorkspaceForTasks(): Promise<TodoTask[]> {
    const tasks: TodoTask[] = [];
    
    const columns = getColumnsConfig();

    const configuredKeywords = columns.flatMap(c => c.keywords);
    if (configuredKeywords.length === 0) {
        return []; // Nothing to scan if no keywords configured
    }

    const regex = buildCommentRegex(configuredKeywords);

    // Map keywords to their column names for quick lookup
    const keywordToColumn: Record<string, string> = {};
    for (const col of columns) {
        for (const kw of col.keywords) {
            keywordToColumn[kw.toUpperCase()] = col.name;
        }
    }

    // Find files, ignoring node_modules and common build folders
    const files = await vscode.workspace.findFiles(
        '**/*.{ts,js,jsx,tsx,html,css}', // Adjust extensions based on target languages
        '**/{node_modules,dist,out,build}/**'
    );

    for (const uri of files) {
        try {
            // Read the file directly via VS Code API to avoid built-in Node/DOM globals
            const document = await vscode.workspace.openTextDocument(uri);
            const lines = document.getText().split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const lineText = lines[i];
                regex.lastIndex = 0; // Reset regex state for the loop
                const match = regex.exec(lineText);

                if (match && match.groups) {
                    const { keyword, moscow, labels, priority, message } = match.groups;

                    // Clean and parse the comma-separated labels safely
                    const parsedLabels = labels 
                        ? labels.split(',').map(label => label.trim()).filter(label => label.length > 0)
                        : [];

                    const normalizedKeyword = keyword.toUpperCase();
                    const columnName = keywordToColumn[normalizedKeyword] || columns[0].name;

                    tasks.push({
                        // Generate a simple ID for Phase 2 deduplication / Webview keys
                        id: `${uri.fsPath}-${i}`,
                        keyword: normalizedKeyword,
                        columnName: columnName,
                        moscow: moscow?.toUpperCase(),
                        labels: parsedLabels,
                        priority: priority?.toUpperCase(),
                        message: message.trim(),
                        filePath: uri.fsPath,
                        line: i
                    });
                }
            }
        } catch (error) {
            // Ignore files that cannot be read (e.g. if they are binary or deleted)
        }
    }

    return tasks;
}
