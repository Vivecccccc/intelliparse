import Parser from 'web-tree-sitter';

import { Lumberjack } from './parser';

export class CLumberjack extends Lumberjack {
    getMethodDefinitionTokens(): string[] {
        return ['function_definition'];
    }
    getMethodNameFieldToken(): string {
        return 'declarator';
    }
    getMethodBodyFieldToken(): string {
        return 'body';
    }

    extractMethodName(node: Parser.SyntaxNode): string | null {
        const methodSignatureNode = node.childForFieldName('declarator');
        if (methodSignatureNode && methodSignatureNode.type === 'function_declarator') {
            const possibleMethodNameNode = methodSignatureNode.childForFieldName(this.methodNameFieldToken);
            if (possibleMethodNameNode && possibleMethodNameNode.type === 'identifier') {
                return possibleMethodNameNode.text;
            }
        }
        return null;
    }
}

// CPP and C are the same
export class CppLumberjack extends CLumberjack { }

export class CSharpLumberjack extends Lumberjack {
    getMethodDefinitionTokens(): string[] {
        return ['method_declaration'];
    }
    getMethodNameFieldToken(): string {
        return 'name';
    }
    getMethodBodyFieldToken(): string {
        return 'body';
    }
}

export class GoLumberjack extends Lumberjack {
    getMethodDefinitionTokens(): string[] {
        return ['function_declaration', 'method_declaration'];
    }
    getMethodNameFieldToken(): string {
        return 'name';
    }
    getMethodBodyFieldToken(): string {
        return 'body';
    }
}

// Java and CSharp are the same
export class JavaLumberjack extends CSharpLumberjack { }

// JS and GO are the same
export class JavaScriptLumberjack extends Lumberjack {
    getMethodDefinitionTokens(): string[] {
        return ['function_declaration', 'method_definition'];
    }
    getMethodNameFieldToken(): string {
        return 'name';
    }
    getMethodBodyFieldToken(): string {
        return 'body';
    }
}

export class PythonLumberjack extends Lumberjack {
    getMethodDefinitionTokens(): string[] {
        return ['function_definition'];
    }
    getMethodNameFieldToken(): string {
        return 'name';
    }
    getMethodBodyFieldToken(): string {
        return 'body';
    }
}

export class RustLumberjack extends Lumberjack {
    getMethodDefinitionTokens(): string[] {
        return ['function_item'];
    }
    getMethodNameFieldToken(): string {
        return 'name';
    }
    getMethodBodyFieldToken(): string {
        return 'body';
    }
}

// TS and JS are the same
export class TypeScriptLumberjack extends JavaScriptLumberjack { }

export function langRouter(pickedLang: string, parser: Parser): Lumberjack {
    switch (pickedLang) {
        case 'c':
            return new CLumberjack(parser);
        case 'cpp':
            return new CppLumberjack(parser);
        case 'csharp':
            return new CSharpLumberjack(parser);
        case 'go':
            return new GoLumberjack(parser);
        case 'java':
            return new JavaLumberjack(parser);
        case 'javascript':
            return new JavaScriptLumberjack(parser);
        case 'python':
            return new PythonLumberjack(parser);
        case 'rust':
            return new RustLumberjack(parser);
        case 'typescript':
            return new TypeScriptLumberjack(parser);
        default:
            return new PythonLumberjack(parser);
    }
    
}