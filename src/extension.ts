// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

function getSVGFileContent() {
  const editor = vscode.window.activeTextEditor;
  const text = editor?.document.getText() ?? "";
  const isSVG = new RegExp(/<svg.*>.*<\/svg>/, "s").test(text);

  return isSVG ? text : "No SVG found in the editor";
}

function getSVGSelectionContent() {
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;
  const text = editor?.document.getText(selection) ?? "";
  const isSVG = new RegExp(/<svg.*>.*<\/svg>/, "s").test(text);

  return isSVG ? text : "No SVG found in the selection";
}

function getWebviewContent(svg: string) {
  return `<!DOCTYPE html>
						<html lang="en">
							<head>
								<meta charset="UTF-8" />
								<meta name="viewport" content="width=device-width, initial-scale=1.0" />
								<title>Preview SVG</title>
							</head>
							<body>${svg}</body>
						</html>`;
}

function openPreviewPanel() {
  const panel = vscode.window.createWebviewPanel(
    "previewSVG",
    "Preview SVG",
    vscode.ViewColumn.Two,
    {}
  );
  return panel;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "previewsvg" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const previewSVGFile = vscode.commands.registerCommand(
    "previewsvg.previewSVGFile",
    () => {
      const panel = openPreviewPanel();
      const svg = getSVGFileContent();
      const content = getWebviewContent(svg);

      panel.webview.html = content;
    }
  );

  const previewSelectionSVG = vscode.commands.registerCommand(
    "previewsvg.previewSelectionSVG",
    () => {
      const panel = openPreviewPanel();
      const svg = getSVGSelectionContent();
      const content = getWebviewContent(svg);

      panel.webview.html = content;
    }
  );

  // 鼠标悬浮预览选中的 SVG 内容
  vscode.languages.registerHoverProvider(["typescriptreact", "xml"], {
    provideHover(doc: vscode.TextDocument, position: vscode.Position) {
      let svgText = "";
      let startLine, endLine;
      // 从当前行开始向上查找，直到找到 svg 标签, 以此作为起始行
      for (startLine = position.line; startLine >= 0; startLine--) {
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
          lineText === "" ||
          lineText.startsWith("<!--") ||
          lineText.startsWith("//")
        ) {
          continue;
        }
        if (!lineText.startsWith("<")) {
          lineText = " " + lineText;
        }
        svgText += lineText;
        if (lineText.includes("</svg>")) {
          break;
        }
      }
      if (!svgText.includes("<svg") || !svgText.includes("</svg>")) {
        return;
      }

      const startIndex = svgText.indexOf("<svg");
      const endIndex = svgText.indexOf("</svg>") + 6;
      svgText = svgText.substring(startIndex, endIndex).trim();
      // 将 style={{ ... }} 转换为 style="..."
      svgText = svgText.replace(
        /style={{\s?(.*?)\s?}}/g,
        (_, $1) => `style="${$1}"`
      );
      // 将驼峰转换为中划线
      // svgText = svgText.replace(/([A-Z])/g, "-$1").toLowerCase();
      console.log(svgText);
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
        range: hoverRange,
      };
    },
  });

  context.subscriptions.push(previewSVGFile);
  context.subscriptions.push(previewSelectionSVG);
}

// This method is called when your extension is deactivated
export function deactivate() {}
