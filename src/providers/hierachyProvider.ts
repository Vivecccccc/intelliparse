import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { decideLanguageFromUri } from '../utils/utils';
import { ParsedMethod } from '../parser/parser';

export class HierachyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly prefix: string,
        public readonly isRoot: boolean,
    ) {
        let trimmedPath = uri.fsPath.replace(prefix, '');
        if (trimmedPath.startsWith(path.sep)) {
            trimmedPath = trimmedPath.substring(1);
        }
        super(trimmedPath, collapsibleState);
        this.resourceUri = uri;
        let isDirectory = fs.statSync(uri.fsPath).isDirectory();
        this.iconPath = isDirectory ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
        this.contextValue = isRoot ? 'rootDir' : 'children';
    }

    shouldEmphasised(uri: vscode.Uri, pickedLang: string): boolean {
        const stat = fs.statSync(uri.fsPath);
        if (stat.isFile()) {
            const srcLang = decideLanguageFromUri(uri);
            return srcLang === pickedLang;
        } else if (stat.isDirectory()) {
            const children = fs.readdirSync(uri.fsPath);
            for (let i = 0; i < children.length; i++) {
                let childUri = vscode.Uri.file(path.join(uri.fsPath, children[i]));
                if (this.shouldEmphasised(childUri, pickedLang)) {
                    return true;
                }
            }
        }
        return false;
    }
}

export class MethodTreeItem extends HierachyTreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly prefix: string,
        public readonly isRoot: boolean,
        public readonly method: ParsedMethod
    ) {
        super(uri, collapsibleState, prefix, isRoot);
        this.iconPath = new vscode.ThemeIcon('symbol-function');
        this.method = method;
        this.label = method.name;
        this.contextValue = 'method';
    }

    shouldEmphasised(uri: vscode.Uri, pickedLang: string): boolean {
        return false;
    }
}

export class HierachyTreeProvider implements vscode.TreeDataProvider<HierachyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HierachyTreeItem | undefined> = new vscode.EventEmitter<HierachyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<HierachyTreeItem | undefined> = this._onDidChangeTreeData.event;

    filesSnapshot: vscode.Uri[] = [];
    methodsSnapshot: { [key: string]: ParsedMethod[] } = {};

    constructor(
        public folders: vscode.Uri[], 
        public pickedLang: string
    ) {
        this.filesSnapshot = this.getConcernedFiles();
        this.injectMethodInFile();
    }

    refresh(): void {
        this.filesSnapshot = this.getConcernedFiles();
        this.injectMethodInFile();
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: HierachyTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.shouldEmphasised(element.uri, this.pickedLang)) {
            let rawLabel = element.label as string;
            element.label = {"highlights": [[0, rawLabel.length]], "label": rawLabel};
        }
        return element;
    }

    getChildren(element?: HierachyTreeItem | undefined): vscode.ProviderResult<HierachyTreeItem[]> {
        if (!this.folders.length) {
            return Promise.resolve([]);
        }
        if (element) {
            const stat = fs.statSync(element.uri.fsPath);
            if (stat.isDirectory()) {
                let children = fs.readdirSync(element.uri.fsPath).map(child => {
                    let uri = vscode.Uri.file(path.join(element.uri.fsPath, child));
                    // get the path execpt for the basename of the file
                    const prefix = element.uri.fsPath + path.sep;
                    return new HierachyTreeItem(
                        uri, 
                        vscode.TreeItemCollapsibleState.Collapsed, 
                        prefix, 
                        false);
                });
                return Promise.resolve(children);
            } else {
                let methods = this.methodsSnapshot[element.uri.fsPath];
                if (methods) {
                    return methods.map(method => new MethodTreeItem(
                        element.uri, 
                        vscode.TreeItemCollapsibleState.None, 
                        '', 
                        false, 
                        method));
                } else {
                    return Promise.resolve([]);
                }
            }
        } else {
            // get the common prefix of the root items
            const prefix = this.getCommonPath();
            const rootItems = this.folders.map(folder => new HierachyTreeItem(
                folder, 
                vscode.TreeItemCollapsibleState.Collapsed, 
                prefix, 
                true));
            return Promise.resolve(rootItems);
        }
    }

    private getCommonPath(): string {
        if (!this.folders.length || this.folders.length === 1) {
            return '';
        }

        const folderPaths = this.folders.map(folder => folder.fsPath.split(path.sep));
        const commonPath = [];

        for (let i = 0; i < folderPaths[0].length; i++) {
            const segment = folderPaths[0][i];

            if (folderPaths.every(folderPath => folderPath[i] === segment)) {
                commonPath.push(segment);
            } else {
                break;
            }
        }

        return commonPath.join(path.sep);
    }

    private getConcernedFiles(): vscode.Uri[] {
        let files: vscode.Uri[] = [];
        this.folders.forEach(folder => {
            const getFiles = (dir: string) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        getFiles(fullPath);
                    } else if (decideLanguageFromUri(vscode.Uri.file(fullPath)) === this.pickedLang) {
                        files.push(vscode.Uri.file(fullPath));
                    }
                }
            };
            getFiles(folder.fsPath);
        });
        return files;
    }

    private injectMethodInFile() {
        // execute command `intelliparse.parseFile` to get the parsed methods
        vscode.commands.executeCommand('intelliparse.parseFile', this.filesSnapshot).then((parsedMethods) => {
            const fileMethodMap = parsedMethods as { [key: string]: ParsedMethod[] };
            this.methodsSnapshot = fileMethodMap;
        });
        this._onDidChangeTreeData.fire(undefined);
    }
}