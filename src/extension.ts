// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { scanWorkspaceForTasks, getColumnsConfig } from './scanner/workspaceScanner';
import { getWebviewContent } from './webview/ui/getWebviewContent';
import { TodoTreeDataProvider } from './sidebar/TodoTreeDataProvider';

// Keeps track of whether the board is already open
let currentPanel: vscode.WebviewPanel | undefined = undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "todokanban" is now active!');

	// Initialize the Tree Data Provider for the side panel
	const todoTreeDataProvider = new TodoTreeDataProvider();
	vscode.window.registerTreeDataProvider('todoKanban.welcomeView', todoTreeDataProvider);

	// TODO {M} [optimization, background] (M): Optimize the updateBoard function to debounce if called multiple times in a row.
	const updateBoard = async () => {
		todoTreeDataProvider.refresh(); // Refresh the side panel as well
		if (currentPanel) {
			const tasks = await scanWorkspaceForTasks();
			const columns = getColumnsConfig();
			currentPanel.webview.postMessage({ command: 'updateTasks', tasks: tasks, columns: columns });
		}
	};

	// Auto-update when a file is saved
	vscode.workspace.onDidSaveTextDocument(() => {
		updateBoard();
	});

	// Register openFile command for the sidebar
	const openFileDisposable = vscode.commands.registerCommand('todokanban.openFile', (filePath: string, line: number) => {
		vscode.workspace.openTextDocument(filePath).then(doc => {
			vscode.window.showTextDocument(doc, {
				viewColumn: vscode.ViewColumn.Active,
				selection: new vscode.Range(line, 0, line, 0),
				preserveFocus: false
			});
		});
	});
	context.subscriptions.push(openFileDisposable);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('todokanban.showBoard', async () => {
		// The code you place here will be executed every time your command is executed
		
		if (currentPanel) {
			// If the board is already open, bring it to the front and update
			currentPanel.reveal(vscode.ViewColumn.One);
			updateBoard();
			return;
		}

		vscode.window.showInformationMessage('Scanning workspace for tasks...');
		const tasks = await scanWorkspaceForTasks();
		const columns = getColumnsConfig();

		// Create and show the Webview
		currentPanel = vscode.window.createWebviewPanel(
			'todoKanban', // Internal ID
			'ToDo Kanban Board', // Title in the tab
			vscode.ViewColumn.One, // Column to open in
			{ 
				enableScripts: true, 
				retainContextWhenHidden: true // Ensures UI is not reset when hidden
			}
		);

		// Set the HTML content via your function
		currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionUri);

		// Send tasks to the Webview's JavaScript
		currentPanel.webview.postMessage({ command: 'updateTasks', tasks: tasks, columns: columns });

		// Listen for messages from the Webview (e.g. clicking a task card)
		currentPanel.webview.onDidReceiveMessage(async message => {
			if (message.command === 'openFile') {
				vscode.workspace.openTextDocument(message.payload.filePath).then(doc => {
					vscode.window.showTextDocument(doc, {
						viewColumn: vscode.ViewColumn.Beside, // Open file next to the board!
						selection: new vscode.Range(message.payload.line, 0, message.payload.line, 0),
						preserveFocus: false
					});
				});
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
						
						// Replace the old keyword with the new keyword (case-insensitive replace of the first occurrence)
						// We need a regex to match the old keyword specifically (accounting for // and spacing)
						// Example: // TODO: -> // IN PROGRESS:
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
		}, undefined, context.subscriptions);

		// Reset reference when the user manually closes the tab
		currentPanel.onDidDispose(() => {
			currentPanel = undefined;
		}, null, context.subscriptions);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// FIXME {S} [memory, cleanup] (H): We should probably dispose of the currentPanel properly here to avoid memory leaks.
}
