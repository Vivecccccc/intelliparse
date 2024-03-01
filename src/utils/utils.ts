import * as vscode from 'vscode';
import * as path from 'path';

export function decideLanguageFromUri(uri: vscode.Uri): string {
    const ext = path.extname(uri.fsPath).slice(1);
    let lang: string;
    switch (ext) {
        case 'c':
            lang = 'c';
            break;
        case 'cpp':
            lang = 'cpp';
            break;
        case 'cs':
            lang = 'csharp';
            break;
        case 'go':
            lang = 'go';
            break;
        case 'java':
            lang = 'java';
            break;
        case 'js':
            lang = 'javascript';
            break;
        case 'py':
            lang = 'python';
            break;
        case 'rs':
            lang = 'rust';
            break;
        case 'ts':
            lang = 'typescript';
            break;
        default:
            lang = '';
    }
    return lang;
}
