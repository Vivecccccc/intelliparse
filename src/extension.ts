import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { HierachyTreeItem, HierachyTreeProvider, MethodTreeItem } from './providers/hierachyProvider';
import { ParsedMethod, getParser } from './parser/parser';
import Parser from 'web-tree-sitter';
import { langRouter } from './parser/langAdapter';

export function activate(context: vscode.ExtensionContext) {
	
	let pickedLang: string;
	let hierachyTreeProvider: HierachyTreeProvider;
	let hierachyTreeView: vscode.TreeView<HierachyTreeItem>;
	let parser: Parser;
	
	const disposableSelectLanguage = vscode.commands.registerCommand(
		'intelliparse.selectLang',
		async () => {
			pickedLang = await pickLang();
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
			if (uris && !pickedLang) {
				pickedLang = await pickLang();
			}

			if (uris && uris.length) {
				if (hierachyTreeProvider) {
					hierachyTreeProvider.folders.push(...uris);
					hierachyTreeProvider.pickedLang = pickedLang;
					// remove duplicates
					const uniqueFolders = Array.from(new Set(hierachyTreeProvider.folders.map(folder => folder.fsPath))).map(fsPath => vscode.Uri.file(fsPath));
					// const filteredFolders = uniqueFolders.filter(folder1 => !uniqueFolders.some(folder2 => folder1.fsPath.startsWith(folder2.fsPath + path.sep)));
					const filteredFolders = removeSubFolders(uniqueFolders);
					hierachyTreeProvider.folders = filteredFolders;
					hierachyTreeProvider.refresh();
				} else {
					hierachyTreeProvider = new HierachyTreeProvider(uris, pickedLang);
					hierachyTreeView = vscode.window.createTreeView('intelliparse.hierachy', {
						treeDataProvider: hierachyTreeProvider
					});
					hierachyTreeView.onDidChangeSelection(async (e) => {
						if (e.selection && e.selection.length > 0) {
							let item = e.selection[0];
							if (item instanceof MethodTreeItem) {
								let itemMethod = item as MethodTreeItem;
								// open file and jump to method by method.position
								vscode.window.showTextDocument(item.uri).then(editor => {
									let startPosition = new vscode.Position(itemMethod.method.position[0][0], itemMethod.method.position[0][1]);
									let endPosition = new vscode.Position(itemMethod.method.position[1][0], itemMethod.method.position[1][1]);
									editor.selection = new vscode.Selection(startPosition, endPosition);
									editor.revealRange(new vscode.Range(startPosition, endPosition), vscode.TextEditorRevealType.InCenter);
								});
							}
							else if (item instanceof HierachyTreeItem) {
								// open only file
								if (!fs.statSync(item.uri.fsPath).isDirectory()) {
									vscode.window.showTextDocument(item.uri);
								}
							}
						}
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

	const disposableParseFile = vscode.commands.registerCommand(
		'intelliparse.parseFile',
		async (files: vscode.Uri[] | undefined) => {
			if (!pickedLang) {
				pickedLang = await pickLang();
			}
			parser = await getParser(pickedLang, context);
			
			const concernedFiles = files ? files : hierachyTreeProvider.filesSnapshot;
			
			const lumberjack = langRouter(pickedLang, parser);
			// initialize a dictionary to store the parsed methods and their file paths
			const parsedMethods: Map<string, ParsedMethod[]> = new Map();
			for (let i = 0; i < concernedFiles.length; i++) {
				const file = concernedFiles[i];
				const methods = lumberjack.parseFile(file);
				parsedMethods.set(file.fsPath, methods);
			}
			return parsedMethods;
		}
	);

	async function pickLang(): Promise<string> {
		const languages = ["C", "C++", "C#", "Go", "Java", "JavaScript", "Python", "Rust", "TypeScript"];
		const languagesMap = new Map<string, string>([
			["C", "c"],
			["C++", "cpp"],
			["C#", "csharp"],
			["Go", "go"],
			["Java", "java"],
			["JavaScript", "javascript"],
			["Python", "python"],
			["Rust", "rust"],
			["TypeScript", "typescript"]
		]);
		let targetLang = await vscode.window.showQuickPick(languages, { canPickMany: false, placeHolder: 'Please specify a language'});
		if (!targetLang || !languagesMap.has(targetLang)) {
			// tell user that language is required
			let config = vscode.workspace.getConfiguration('intelliparse');
			let defaultLang = config.get('parserDefaultLanguage') as string;
			vscode.window.showWarningMessage('No language selected. Falling back to default language [' + defaultLang + '].');
			return defaultLang;
		}
		targetLang = languagesMap.get(targetLang) as string;
		return targetLang;
	}

	context.subscriptions.push(...[disposableAddFolders, disposableClearFolders, disposableRemoveFolder, disposableSelectLanguage, disposableParseFile]);
}

function removeSubFolders(folders: vscode.Uri[]): vscode.Uri[] {
	folders.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
	const filteredFolders = folders.filter((folder, index, self) => {
		if (index === 0) {
			return true;
		}
		const prev = self[index - 1];
		return !folder.fsPath.startsWith(prev.fsPath + path.sep);
	});
	return filteredFolders;
}