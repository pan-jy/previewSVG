// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

class PreviewSVG {
  webviewTemplate = "";
  extensionPath: string;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  private openPreviewPanel() {
    const panel = vscode.window.createWebviewPanel(
      "previewSVG",
      "Preview SVG",
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
      }
    );
    return panel;
  }

  private isSVG(text: string) {
    return new RegExp(/^<svg.*>.*<\/svg>$/, "s").test(text);
  }

  private extractSVGFromText(text: string) {
    const startIndex = text.indexOf("<svg");
    const endIndex = text.indexOf("</svg>") + 6;
    const svgText = text.substring(startIndex, endIndex).trim();
    if (!this.isSVG(svgText)) {
      return;
    }
    return {
      svgText,
      startIndex,
      endIndex,
    };
  }

  private getSVGFileContent() {
    const editor = vscode.window.activeTextEditor;
    const text = editor?.document.getText().trim() ?? "";

    if (this.isSVG(text)) {
      return text;
    }
  }

  private getActiveSVG() {
    const editor = vscode.window.activeTextEditor;
    const activeLine = editor?.selection.active.line;
    if (!editor?.document || activeLine === undefined) {
      return;
    }
    const { svgText } = this.findSVGInDoc(editor?.document, activeLine) ?? {};
    return svgText;
  }

  private getSVGFromSelection() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    const text = editor?.document.getText(selection) ?? "";
    return this.extractSVGFromText(text)?.svgText;
  }

  private async getWebviewContent(svgText: string) {
    if (!this.webviewTemplate) {
      const templatePath = vscode.Uri.file(
        path.join(this.extensionPath, "src", "webview.html")
      );
      const template = vscode.workspace.fs.readFile(templatePath);
      this.webviewTemplate = (await template).toString();
    }

    return this.webviewTemplate.replace("{{svg}}", svgText);
  }

  findSVGInDoc(doc: vscode.TextDocument, start: number) {
    let startLine,
      endLine,
      svgText = "";
    // 从当前行开始向上查找，直到找到 svg 标签, 以此作为起始行
    for (startLine = start; startLine >= 0; startLine--) {
      const lineText = doc.lineAt(startLine).text;
      // 如果先找到结束标签，则直接返回
      if (lineText.includes("</svg>")) {
        return;
      }
      if (lineText.includes("<svg")) {
        break;
      }
    }
    // 从起始行开始向下查找，直到找到 svg 标签结束
    for (endLine = startLine; endLine < doc.lineCount; endLine++) {
      let lineText = doc.lineAt(endLine).text.trim();
      // 跳过注释和空行
      if (
        !lineText ||
        lineText.startsWith("<!--") ||
        lineText.startsWith("//")
      ) {
        continue;
      }
      // 如果不是以 < 开头（属性），则添加一个空格
      if (!lineText.startsWith("<")) {
        lineText = " " + lineText;
      }
      svgText += lineText;
      if (lineText.includes("</svg>")) {
        break;
      }
    }
    const extractRes = this.extractSVGFromText(svgText);
    if (!extractRes) {
      return;
    }
    const { startIndex, endIndex } = extractRes;
    svgText = extractRes.svgText;
    // 将 style={{ ... }} 转换为 style="..."
    svgText = svgText.replace(
      /style={{\s?(.*?)\s?}}/g,
      (_, $1) => `style="${$1}"`
    );
    // 将驼峰转换为中划线
    // svgText = svgText.replace(/([A-Z])/g, "-$1").toLowerCase();
    console.log(svgText);

    return { svgText, startLine, endLine, startIndex, endIndex };
  }

  async previewSVGFile() {
    const svgText = this.getSVGFileContent();
    if (!svgText) {
      return vscode.window.showErrorMessage("No SVG found in this file");
    }
    const panel = this.openPreviewPanel();
    const content = await this.getWebviewContent(svgText);
    panel.webview.html = content;
  }

  async previewActiveSVG() {
    const svgText = this.getActiveSVG();
    if (!svgText) {
      return vscode.window.showErrorMessage(
        "Mouse is not focused inside SVG",
      );
    }
    const panel = this.openPreviewPanel();
    const content = await this.getWebviewContent(svgText);
    panel.webview.html = content;
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Your extension "PreviewSVG" is now active!');

  const previewSVG = new PreviewSVG(context.extensionPath);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const previewSVGFile = vscode.commands.registerCommand(
    "previewsvg.previewSVGFile",
    () => {
      previewSVG.previewSVGFile();
    }
  );

  const previewActiveSVG = vscode.commands.registerCommand(
    "previewsvg.previewActiveSVG",
    () => {
      previewSVG.previewActiveSVG();
    }
  );

  context.subscriptions.push(previewSVGFile);
  context.subscriptions.push(previewActiveSVG);

  // 鼠标悬浮预览选中的 SVG 内容
  vscode.languages.registerHoverProvider(["typescriptreact", "xml"], {
    provideHover(doc: vscode.TextDocument, position: vscode.Position) {
      const editor = vscode.window.activeTextEditor;
      const activeLine = editor?.selection.active.line;
      // 如果当前鼠标悬浮的行不是聚焦的行，则返回
      if (activeLine !== position.line) {
        return;
      }

      const result = previewSVG.findSVGInDoc(doc, position.line);
      if (!result) {
        return;
      }
      const { svgText, startLine, endLine, startIndex, endIndex } = result;

      const hoverRange = new vscode.Range(
        new vscode.Position(startLine, startIndex),
        new vscode.Position(endLine, endIndex)
      );
      return {
        // 显示 svg 图片
        contents: [
          new vscode.MarkdownString(
            `![SVG](data:image/svg+xml,${encodeURIComponent(svgText)})`
          ),
        ],
        // 鼠标识别出的 svg 范围
        range: hoverRange,
      };
    },
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
