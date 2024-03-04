import * as vscode from 'vscode';
import * as fs from 'fs';
import Parser from 'web-tree-sitter';


export async function getParser(pickedLang: string, context: vscode.ExtensionContext): Promise<Parser> {
    await Parser.init();

    let parserLang: Parser.Language;

    switch (pickedLang) {
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

export class ParsedMethod {
    name: string;
    body: string;
    full: string;
    position: number[][];
    
    constructor(name: string, body: string, full: string, position: number[][]) {
        this.name = name;
        this.body = body;
        this.full = full;
        this.position = position;
    }

    // implement a hash function for the class for comparison
    hashCode(): string {
        const signature = this.full;
        return signature;
    }
}

export abstract class Lumberjack {
    parser: Parser;
    methodDefinitionTokens: string[];
    methodNameFieldToken: string;
    methodBodyFieldToken: string;

    constructor(parser: Parser) {
        this.parser = parser;
        this.methodDefinitionTokens = this.getMethodDefinitionTokens();
        this.methodNameFieldToken = this.getMethodNameFieldToken();
        this.methodBodyFieldToken = this.getMethodBodyFieldToken();
    }

    abstract getMethodDefinitionTokens(): string[];
    abstract getMethodNameFieldToken(): string;
    abstract getMethodBodyFieldToken(): string;

    parseFile(uri: vscode.Uri): ParsedMethod[] {
        const fileContent = fs.readFileSync(uri.fsPath, 'utf-8');
        const tree = this.parser.parse(fileContent).rootNode;
        return this.extractAllMethods(tree);
    }

    extractAllMethods(node: Parser.SyntaxNode): ParsedMethod[] {
        const methods: ParsedMethod[] = [];

        if (this.methodDefinitionTokens.includes(node.type)) {
            const name = this.extractMethodName(node);
            const body = this.extractMethodBody(node);
            const position = [[node.startPosition.row, node.startPosition.column], [node.endPosition.row, node.endPosition.column]];
            
            if (name && body) {
                const method = new ParsedMethod(name, body, node.text, position);
                methods.push(method);
            }

        } else {
            for (let i = 0; i < node.childCount; i++) {
                let childNode = node.child(i);
                if (childNode) {
                    methods.push(...this.extractAllMethods(childNode));
                }
            }
        }

        return methods;
    }

    protected extractMethodName(node: Parser.SyntaxNode): string | null {
        const possibleMethodNameNode = node.childForFieldName(this.methodNameFieldToken);
        if (possibleMethodNameNode) {
            return possibleMethodNameNode.text;
        }
        return null;
    }

    protected extractMethodBody(node: Parser.SyntaxNode): string | null {
        const possibleBodyNode = node.childForFieldName(this.methodBodyFieldToken);
        if (possibleBodyNode) {
            return possibleBodyNode.text;
        }
        return null;
    }
}