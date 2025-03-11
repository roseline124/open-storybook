import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { findNearestStorybookConfig } from "./utils/findNearestStorybookConfig";
import { findNearestPackageJson } from "./utils/findNearestPackageJson";
import { getStorybookCommandFromPackageJson } from "./utils/getStorybookCommandFromPackageJson";
import { getPackageName } from "./utils/getPackageName";
import { activeStorybookTerminals, packageStoriesMap } from "./globals";

export async function openFocusedStorybook() {
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

  const packageJsonPath = findNearestPackageJson(storybookConfigPath);
  if (!packageJsonPath) {
    vscode.window.showErrorMessage("No package.json found.");
    return;
  }

  const packageName = packageJsonPath ? getPackageName(packageJsonPath) : null;
  if (!packageName) {
    vscode.window.showErrorMessage("Could not determine package name.");
    return;
  }

  // 3️⃣ 기존 스토리북 터미널이 실행 중이면 종료
  if (activeStorybookTerminals[packageName]) {
    const terminal = activeStorybookTerminals[packageName];

    // ✅ Storybook 프로세스 종료 (Ctrl+C 시그널 전송)
    terminal.sendText("\u0003", true); // Equivalent to pressing Ctrl+C in the terminal
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기 (정상 종료 보장)

    terminal.dispose(); // 터미널 정리
    delete activeStorybookTerminals[packageName];
  }

  if (!packageStoriesMap[packageName]) {
    packageStoriesMap[packageName] = [focusedFile];
  } else {
    packageStoriesMap[packageName].push(focusedFile);
  }

  updateStorybookStories(storybookConfigPath, packageStoriesMap[packageName]);

  const terminal = vscode.window.createTerminal({
    name: `Storybook (${packageName})`,
    cwd: path.dirname(path.dirname(storybookConfigPath)),
  });

  vscode.window.onDidCloseTerminal(async (closedTerminal) => {
    closedTerminal.sendText("\u0003", true); // Equivalent to pressing Ctrl+C in the terminal
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기 (정상 종료 보장)
    delete activeStorybookTerminals[packageName];
  });

  activeStorybookTerminals[packageName] = terminal;

  // 4️⃣ package.json에서 storybook 실행 명령어 찾기

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
