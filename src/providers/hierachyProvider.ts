import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { decideLanguageFromUri } from '../utils/utils';

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

    shouldEmphasised(pickedLang: string | undefined): boolean {
        const stat = fs.statSync(this.uri.fsPath);
        if (stat.isFile()) {
            const srcLang = decideLanguageFromUri(this.uri);
            return srcLang === pickedLang;
        } else if (stat.isDirectory()) {
            const children = fs.readdirSync(this.uri.fsPath);
            for (let i = 0; i < children.length; i++) {
                let childUri = vscode.Uri.file(path.join(this.uri.fsPath, children[i]));
                let childItem = new HierachyTreeItem(childUri, vscode.TreeItemCollapsibleState.None, this.prefix, false);
                if (childItem.shouldEmphasised(pickedLang)) {
                    return true;
                }
            }
        }
        return false;
    }
}

// class FunctionTreeItem extends HierachyTreeItem {
//     constructor(
//         public readonly uri: vscode.Uri,
//         public readonly collapsibleState: vscode.TreeItemCollapsibleState,
//         public readonly prefix: string = '',
//         public readonly isRoot: boolean = false,
//         public readonly functionName: string,
//         public readonly offset: number,
//     ) {
//         super(uri, collapsibleState, prefix, isRoot);
//         this.iconPath = new vscode.ThemeIcon('symbol-function');
//         this.label = functionName;
//         this.contextValue = 'function';
//     }
// }

export class HierachyTreeProvider implements vscode.TreeDataProvider<HierachyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HierachyTreeItem | undefined> = new vscode.EventEmitter<HierachyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<HierachyTreeItem | undefined> = this._onDidChangeTreeData.event;

    constructor(
        public folders: vscode.Uri[], 
        public pickedLang: string | undefined
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: HierachyTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.shouldEmphasised(this.pickedLang)) {
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
            const children = fs.readdirSync(element.uri.fsPath).map(child => {
                let uri = vscode.Uri.file(path.join(element.uri.fsPath, child));
                const stat = fs.statSync(uri.fsPath);
                // get the path execpt for the basename of the file
                const prefix = element.uri.fsPath + path.sep;
                return new HierachyTreeItem(
                    uri, 
                    stat.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, 
                    prefix, 
                    false);
            });
            const filteredChildren = children.filter(child => {
                let isDirectory = fs.statSync(child.uri.fsPath).isDirectory();
                let fileLang = decideLanguageFromUri(child.uri);
                return isDirectory || fileLang === this.pickedLang;
            });
            return Promise.resolve(filteredChildren);
        } else {
            // get the common prefix of the root items
            const prefix = this.getCommonPath();
            const rootItems = this.folders.map(folder => new HierachyTreeItem(
                folder, 
                vscode.TreeItemCollapsibleState.Collapsed, 
                prefix, 
                true
                ));
            return Promise.resolve(rootItems);
        }
    }

    getCommonPath(): string {
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
}