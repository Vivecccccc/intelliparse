import * as vscode from 'vscode';
import * as path from 'path';
import { HierachyTreeItem, HierachyTreeProvider } from './providers/hierachyProvider';

export function activate(context: vscode.ExtensionContext) {
	
	let pickedLang: string | undefined;
	let hierachyTreeProvider: HierachyTreeProvider;
	
	const disposableSelectLanguage = vscode.commands.registerCommand(
		'intelliparse.selectLang',
		async () => {
			const languages = ["c", "cpp", "csharp", "go", "java", "javascript", "python", "rust", "typescript"];
			pickedLang = await vscode.window.showQuickPick(languages, { canPickMany: false, placeHolder: 'Please specify a language'});
			if (hierachyTreeProvider) {
				hierachyTreeProvider.pickedLang = pickedLang;
				hierachyTreeProvider.refresh();
			}
		}
	);

	const disposableAddFolders = vscode.commands.registerCommand(
		'intelliparse.addFolders',
		async () => {
			const uris = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: true,
				openLabel: 'Add Folders'
			});
			while (!pickedLang) {
				pickedLang = await vscode.window.showQuickPick(
					["c", "cpp", "csharp", "go", "java", "javascript", "python", "rust", "typescript"], 
					{ canPickMany: false, placeHolder: 'Please specify a language'}
				);

				if (!pickedLang) {
					// tell user that language is required
					vscode.window.showErrorMessage('A language is required to proceed.');
				}
			}

			if (uris && uris.length) {
				if (hierachyTreeProvider) {
					hierachyTreeProvider.folders.push(...uris);
					hierachyTreeProvider.pickedLang = pickedLang;
					// remove duplicates
					const uniqueFolders = Array.from(new Set(hierachyTreeProvider.folders.map(folder => folder.fsPath))).map(fsPath => vscode.Uri.file(fsPath));
					const filteredFolders = uniqueFolders.filter(folder1 => !uniqueFolders.some(folder2 => folder1.fsPath.startsWith(folder2.fsPath + path.sep)));
					hierachyTreeProvider.folders = filteredFolders;
					hierachyTreeProvider.refresh();
				} else {
					hierachyTreeProvider = new HierachyTreeProvider(uris, pickedLang);
					vscode.window.createTreeView('intelliparse.hierachy', {
						treeDataProvider: hierachyTreeProvider
					});
				}
			}
		}
	);
	const disposableClearFolders = vscode.commands.registerCommand(
		'intelliparse.clearFolders',
		() => {
			if (hierachyTreeProvider) {
				hierachyTreeProvider.folders = [];
				hierachyTreeProvider.refresh();
			}
		}
	);
	const disposableRemoveFolder = vscode.commands.registerCommand(
		'intelliparse.removeFolder',
		(hierachyItem: HierachyTreeItem) => {
			if (hierachyTreeProvider) {
				hierachyTreeProvider.folders = hierachyTreeProvider.folders.filter(f => f.fsPath !== hierachyItem.uri.fsPath);
				hierachyTreeProvider.refresh();
			}
		}
	);
	context.subscriptions.push(...[disposableAddFolders, disposableClearFolders, disposableRemoveFolder, disposableSelectLanguage]);
}