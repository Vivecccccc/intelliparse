import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Parser from 'web-tree-sitter';

import { decideLanguageFromUri } from '../utils/utils';

async function getParser(uri: vscode.Uri, context: vscode.ExtensionContext): Promise<Parser> {
    await Parser.init();

    const targetLang = decideLanguageFromUri(uri);
    let parserLang: Parser.Language;

    switch (targetLang) {
        case 'c':
            const cGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-c.wasm').fsPath;
            parserLang = await Parser.Language.load(cGrammarPath);
            break;
        case 'cpp':
            const cppGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-cpp.wasm').fsPath;
            parserLang = await Parser.Language.load(cppGrammarPath);
            break;
        case 'csharp':
            const csharpGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-c_sharp.wasm').fsPath;
            parserLang = await Parser.Language.load(csharpGrammarPath);
            break;
        case 'go':
            const goGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-go.wasm').fsPath;
            parserLang = await Parser.Language.load(goGrammarPath);
            break;
        case 'java':
            const javaGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-java.wasm').fsPath;
            parserLang = await Parser.Language.load(javaGrammarPath);
            break;
        case 'javascript':
            const jsGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-javascript.wasm').fsPath;
            parserLang = await Parser.Language.load(jsGrammarPath);
            break;
        case 'python':
            const pyGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-python.wasm').fsPath;
            parserLang = await Parser.Language.load(pyGrammarPath);
            break;
        case 'rust':
            const rustGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-rust.wasm').fsPath;
            parserLang = await Parser.Language.load(rustGrammarPath);
            break;
        case 'typescript':
            const tsGrammarPath = vscode.Uri.joinPath(context.extensionUri, './resources/grammars/tree-sitter-typescript.wasm').fsPath;
            parserLang = await Parser.Language.load(tsGrammarPath);
            break;
        default:
            throw new Error('Language not supported');
    }
    const parser = new Parser();
    parser.setLanguage(parserLang);

    return parser;
}

export async function parseFile(uri: vscode.Uri, context: vscode.ExtensionContext): Promise<Parser.SyntaxNode> {
    return getParser(uri, context).then(parser => {
        const fileText = fs.readFileSync(uri.fsPath, 'utf-8');
        return parser.parse(fileText).rootNode;
    });
}

function getFunctionFromTree(node: Parser.SyntaxNode) {
    const root = node;
}