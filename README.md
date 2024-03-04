# Intelliparse VSCode Extension

Intelliparse is a Visual Studio Code extension that allows developers to visualize the hierarchy of methods in their codebase. It supports multiple programming languages and provides a convenient way to navigate through code by organizing methods into a tree view structure.

## Features

- **Language Selection**: Choose from a variety of supported languages for parsing.
- **Folder Management**: Add or remove folders from the workspace to be included in the parsing process.
- **Hierarchy View**: View the parsed methods in a hierarchical tree structure within VSCode.
- **Navigation**: Quickly navigate to the definition of a method by clicking on it within the hierarchy view.
- **Supports Multiple Languages**: Works with C, C++, C#, Go, Java, JavaScript, Python, Rust, and TypeScript.

## Usage

To get started with Intelliparse, follow these steps:

1. **Select Language**: Use the command `intelliparse.selectLang` to pick the programming language of your codebase.
2. **Add Folders**: Add folders to your workspace that you want to parse using the command `intelliparse.addFolders`.
3. **Parse File**: The hierachy tree view will be automatically updated with the command `intelliparse.parseFile`.
4. **Remove Folder**: Remove a folder from the hierarchy view using the command `intelliparse.removeFolder`.
5. **Clear Folders**: Clear all folders from the hierarchy view using the command `intelliparse.clearFolders`.

## Extension Commands

This extension contributes the following commands:

- `intelliparse.selectLang`: Select the language for parsing.
- `intelliparse.addFolders`: Add folders to the hierarchy view.
- `intelliparse.clearFolders`: Clear all folders from the hierarchy view.
- `intelliparse.removeFolder`: Remove a specific folder from the hierarchy view.
- `intelliparse.parseFile`: Parse a file or a set of files to update the hierarchy tree.

## Requirements

This extension requires you to have the following installed:

- Visual Studio Code
- Tree-sitter binaries for the respective language you wish to parse

## Known Issues

Currently, there are no known issues. If you encounter any bugs or have a feature request, please open an issue in the repository of this extension.

## Release Notes

### 0.0.1

Initial release of Intelliparse.

- Supports multiple programming languages.
- Provides tree view for method hierarchy.
- Allows folder management for parsing.

---

For more information or to contribute to the project, please find the repository link attached to the extension's marketplace page.