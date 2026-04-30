import * as vscode from 'vscode';
import { getWebviewContent } from '../ui/getWebviewContent';
import { scanWorkspaceForTasks, getColumnsConfig } from '../../scanner/workspaceScanner';

export class KanbanPanel {
    public static currentPanel: KanbanPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.html = getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener();
        this.refreshContent();
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor?.viewColumn;

        if (KanbanPanel.currentPanel) {
            KanbanPanel.currentPanel._panel.reveal(column);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'todoKanban',
                'ToDo Kanban Board',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview/ui')]
                }
            );
            KanbanPanel.currentPanel = new KanbanPanel(panel, extensionUri);
        }
    }

    public async refreshContent() {
        const tasks = await scanWorkspaceForTasks();
        const columns = getColumnsConfig();
        this._panel.webview.postMessage({ command: 'updateTasks', tasks, columns });
    }

    private _setWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(
            async (message: { command: string; payload: any }) => {
                if (message.command === 'openFile') {
                    const { filePath, line } = message.payload;
                    const uri = vscode.Uri.file(filePath);
                    const document = await vscode.workspace.openTextDocument(uri);
                    const editor = await vscode.window.showTextDocument(document);

                    const position = new vscode.Position(line, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                } else if (message.command === 'moveTask') {
                    const { filePath, line, newColumn, oldKeyword } = message.payload;
                    const currentColumns = getColumnsConfig();
                    const targetCol = currentColumns.find(c => c.name === newColumn);
                    
                    if (targetCol && targetCol.keywords.length > 0) {
                        const newKeyword = targetCol.keywords[0];
                        const uri = vscode.Uri.file(filePath);
                        
                        try {
                            const document = await vscode.workspace.openTextDocument(uri);
                            const lineText = document.lineAt(line).text;
                            
                            const keywordRegex = new RegExp(`(\\/\\/\\s*)${oldKeyword}`, 'i');
                            const newLineText = lineText.replace(keywordRegex, `$1${newKeyword}`);
                            
                            if (newLineText !== lineText) {
                                const edit = new vscode.WorkspaceEdit();
                                edit.replace(uri, document.lineAt(line).range, newLineText);
                                await vscode.workspace.applyEdit(edit);
                                await document.save(); // Save to trigger updateBoard
                            }
                        } catch (e) {
                            vscode.window.showErrorMessage('Failed to update task: ' + e);
                        }
                    }
                }
            },
            undefined,
            this._disposables
        );
    }

    public dispose() {
        KanbanPanel.currentPanel = undefined;
        this._panel.dispose();
        this._disposables.forEach(disposable => disposable.dispose());
    }
}