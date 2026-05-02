import * as vscode from 'vscode';

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const nonce = getNonce();

    // IN PROGRESS {M} [refactor, html] (H): Refactoring this huge HTML string into a separate HTML file.
    // TODO {W} [ui, config] (L): Add support for custom CSS themes passed from user settings.
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ToDo Kanban</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                height: 100vh;
                box-sizing: border-box;
            }
            h1 {
                margin-top: 0;
                flex-shrink: 0;
            }
            #kanban-board {
                display: flex;
                gap: 16px;
                flex-grow: 1;
                overflow-x: auto;
                align-items: flex-start;
            }
            .kanban-column {
                flex: 1;
                min-width: 250px;
                background-color: var(--vscode-sideBar-background);
                border: 1px solid var(--vscode-sideBar-border);
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                max-height: 100%;
            }
            .kanban-column-header {
                padding: 12px;
                font-weight: 600;
                border-bottom: 1px solid var(--vscode-sideBar-border);
                background-color: var(--vscode-sideBarTitle-background);
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                position: sticky;
                top: 0;
            }
            .kanban-column-content {
                padding: 8px;
                overflow-y: auto;
                flex-grow: 1;
                min-height: 50px;
            }
            .kanban-column-content.drag-over {
                background-color: var(--vscode-list-hoverBackground);
            }
            .task-card {
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-widget-border);
                padding: 10px;
                margin-bottom: 8px;
                border-radius: 4px;
                cursor: grab;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .task-card:active {
                cursor: grabbing;
            }
            .task-card:hover {
                border-color: var(--vscode-focusBorder);
            }
            .task-card.dragging {
                opacity: 0.5;
            }
            .task-keyword {
                font-weight: 600;
                color: var(--vscode-symbolIcon-keywordForeground);
                margin-bottom: 4px;
                display: inline-block;
            }
            .task-moscow, .task-priority {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 0.8em;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                margin-left: 4px;
            }
            .task-labels {
                margin-top: 4px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }
            .task-label {
                font-size: 0.75em;
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                padding: 2px 4px;
                border-radius: 3px;
            }
            .task-message {
                margin-top: 6px;
                margin-bottom: 6px;
                word-wrap: break-word;
            }
            .task-location {
                font-size: 0.8em;
                color: var(--vscode-descriptionForeground);
                text-align: right;
                margin-top: 8px;
                cursor: pointer;
            }
            .task-location:hover {
                text-decoration: underline;
                color: var(--vscode-textLink-activeForeground);
            }
        </style>
    </head>
    <body>
        <h1>ToDo Kanban Board</h1>
        <div id="kanban-board"></div>

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const kanbanBoard = document.getElementById('kanban-board');
            let currentTasks = [];
            let currentColumns = [];

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateTasks') {
                    currentTasks = message.tasks || [];
                    currentColumns = message.columns || [];
                    renderBoard();
                }
            });

            function handleDragStart(e) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
                e.dataTransfer.effectAllowed = 'move';
            }

            function handleDragEnd(e) {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.kanban-column-content').forEach(col => {
                    col.classList.remove('drag-over');
                });
            }

            function renderBoard() {
                if (!kanbanBoard) return;
                kanbanBoard.innerHTML = '';

                if (currentColumns.length === 0) {
                    kanbanBoard.innerHTML = '<p>No columns configured.</p>';
                    return;
                }

                currentColumns.forEach(column => {
                    const colDiv = document.createElement('div');
                    colDiv.className = 'kanban-column';
                    
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'kanban-column-header';
                    const colTasks = currentTasks.filter(t => t.columnName === column.name);
                    headerDiv.textContent = \`\${column.name} (\${colTasks.length})\`;
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'kanban-column-content';
                    contentDiv.dataset.columnName = column.name;

                    contentDiv.addEventListener('dragover', e => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        contentDiv.classList.add('drag-over');
                    });

                    contentDiv.addEventListener('dragleave', e => {
                        contentDiv.classList.remove('drag-over');
                    });

                    contentDiv.addEventListener('drop', e => {
                        e.preventDefault();
                        contentDiv.classList.remove('drag-over');
                        const taskId = e.dataTransfer.getData('text/plain');
                        const targetColumnName = contentDiv.dataset.columnName;
                        
                        const task = currentTasks.find(t => t.id === taskId);
                        if (task && task.columnName !== targetColumnName) {
                            // Optimistically update UI
                            task.columnName = targetColumnName;
                            renderBoard();

                            // Notify extension to update source code
                            vscode.postMessage({
                                command: 'moveTask',
                                payload: {
                                    taskId: task.id,
                                    filePath: task.filePath,
                                    line: task.line,
                                    oldKeyword: task.keyword,
                                    originalPrefix: task.originalPrefix,
                                    newColumn: targetColumnName
                                }
                            });
                        }
                    });

                    colTasks.forEach(task => {
                        const card = document.createElement('div');
                        card.className = 'task-card';
                        card.draggable = true;
                        card.dataset.taskId = task.id;

                        card.addEventListener('dragstart', handleDragStart);
                        card.addEventListener('dragend', handleDragEnd);

                        let labelsHtml = '';
                        if (task.labels && task.labels.length > 0) {
                            labelsHtml = \`<div class="task-labels">\` + 
                                task.labels.map(l => \`<span class="task-label">\${l}</span>\`).join('') + 
                            \`</div>\`;
                        }

                        let metaHtml = '';
                        if (task.moscow) metaHtml += \`<span class="task-moscow" title="MoSCoW">{\${task.moscow}}</span>\`;
                        if (task.priority) metaHtml += \`<span class="task-priority" title="Priority">(\${task.priority})</span>\`;

                        const fileName = task.filePath.split(/[\\\\/]/).pop();

                        card.innerHTML = \`
                            <div>
                                <span class="task-keyword">\${task.keyword}</span>
                                \${metaHtml}
                            </div>
                            <div class="task-message">\${task.message}</div>
                            \${labelsHtml}
                            <div class="task-location" title="\${task.filePath}">
                                \${fileName}:\${task.line + 1}
                            </div>
                        \`;
                        
                        // Add click listener to location only
                        const locationEl = card.querySelector('.task-location');
                        locationEl.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent drag
                            vscode.postMessage({
                                command: 'openFile',
                                payload: { filePath: task.filePath, line: task.line }
                            });
                        });

                        contentDiv.appendChild(card);
                    });

                    colDiv.appendChild(headerDiv);
                    colDiv.appendChild(contentDiv);
                    kanbanBoard.appendChild(colDiv);
                });
            }
        </script>
    </body>
    </html>`;
}