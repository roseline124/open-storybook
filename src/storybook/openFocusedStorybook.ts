import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { findNearestStorybookConfig } from "./utils/findNearestStorybookConfig";
import { findNearestPackageJson } from "./utils/findNearestPackageJson";
import { getStorybookCommandFromPackageJson } from "./utils/getStorybookCommandFromPackageJson";

const storybookSessions = new Map<
  vscode.Terminal,
  { configPath: string; backupPath: string }
>();

export function openFocusedStorybook() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No active storybook file.");
    return;
  }

  const focusedFile = activeEditor.document.uri.fsPath;
  const fileDir = path.dirname(focusedFile);
  const storybookConfigPath = findNearestStorybookConfig(fileDir);

  if (!storybookConfigPath) {
    vscode.window.showErrorMessage("No Storybook config found.");
    return;
  }

  const sessionId = new Date().getTime();
  // const backupPath = `${storybookConfigPath}.backup-${sessionId}`;
  // fs.copyFileSync(storybookConfigPath, backupPath);

  updateStorybookStories(storybookConfigPath, [focusedFile]);

  const terminal = vscode.window.createTerminal({
    name: `Storybook (${sessionId})`,
    cwd: path.dirname(path.dirname(storybookConfigPath)),
  });

  // storybookSessions.set(terminal, {
  //   configPath: storybookConfigPath,
  //   backupPath,
  // });

  vscode.window.onDidCloseTerminal((closedTerminal) => {
    const session = storybookSessions.get(closedTerminal);
    if (session) {
      // restoreStorybookConfig(session.configPath, session.backupPath);
      storybookSessions.delete(closedTerminal);
    }
  });

  // 4️⃣ package.json에서 storybook 실행 명령어 찾기
  const packageJsonPath = findNearestPackageJson(storybookConfigPath);
  const storybookCommand = packageJsonPath
    ? getStorybookCommandFromPackageJson(packageJsonPath)
    : null;

  if (storybookCommand) {
    terminal.sendText(storybookCommand);
  } else {
    terminal.sendText("npx storybook dev -p 6006");
  }
  terminal.show();
}

// function restoreStorybookConfig(configPath: string, backupPath: string) {
//   if (fs.existsSync(backupPath)) {
//     fs.copyFileSync(backupPath, configPath);
//     vscode.window.showInformationMessage(
//       `Restored: ${path.basename(configPath)}`
//     );
//   }

//   fs.unlinkSync(backupPath);
// }

function updateStorybookStories(configPath: string, newStories: string[]) {
  let content = fs.readFileSync(configPath, "utf-8");
  content = content.replace(/^\s*\/\/?\s*stories:\s*\[[^\]]*\]\s*,?/gm, "");
  const updatedContent = content.replace(
    /stories:\s*\[[^\]]*\]/,
    `stories: ${JSON.stringify(newStories, null, 2)}`
  );
  fs.writeFileSync(configPath, updatedContent, "utf-8");
}
