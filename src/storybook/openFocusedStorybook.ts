import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { findNearestStorybookConfig } from "./utils/findNearestStorybookConfig";
import { findNearestPackageJson } from "./utils/findNearestPackageJson";
import { getStorybookCommandFromPackageJson } from "./utils/getStorybookCommandFromPackageJson";
import { getPackageName } from "./utils/getPackageName";
import { activeStorybookTerminals, packageStoriesMap } from "./globals";
import { isStorybookFile } from "./utils/isStorybookFile";
import { getCurrentStorybookConfig } from "./utils/getCurrentStorybookConfig";
import { restoreStorybookConfig } from "./utils/restoreStorybookConfig";
import { updateStorybookStories } from "./utils/updateStorybookStories";

export async function openFocusedStorybook() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No active storybook file.");
    return;
  }

  const focusedFile = activeEditor.document.uri.fsPath;
  if (!isStorybookFile(focusedFile)) {
    vscode.window.showErrorMessage(`It's not a storybook file: ${focusedFile}`);
    return;
  }

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

  // ✅ 기존 `stories` 경로를 저장 (되돌리기 위해)
  if (!packageStoriesMap[packageName]) {
    packageStoriesMap[packageName] = {
      current: [],
      backup: getCurrentStorybookConfig(storybookConfigPath),
    };
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

  if (!packageStoriesMap[packageName].current.includes(focusedFile)) {
    packageStoriesMap[packageName].current.push(focusedFile);
  }

  updateStorybookStories(
    storybookConfigPath,
    packageStoriesMap[packageName].current
  );

  const terminal = vscode.window.createTerminal({
    name: `Storybook (${packageName})`,
    cwd: path.dirname(path.dirname(storybookConfigPath)),
  });

  vscode.window.onDidCloseTerminal(async (closedTerminal) => {
    closedTerminal.sendText("\u0003", true); // Equivalent to pressing Ctrl+C in the terminal
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기 (정상 종료 보장)
    restoreStorybookConfig(
      storybookConfigPath,
      packageStoriesMap[packageName].backup
    );
    delete activeStorybookTerminals[packageName];
    packageStoriesMap[packageName].current = [];
  });

  activeStorybookTerminals[packageName] = terminal;

  // 4️⃣ package.json에서 storybook 실행 명령어 찾기

  const storybookCommand = packageJsonPath
    ? getStorybookCommandFromPackageJson(packageJsonPath)
    : null;

  if (storybookCommand) {
    terminal.sendText(`${storybookCommand} -- --ci`);
  } else {
    terminal.sendText("npx storybook dev -- --y");
  }
  terminal.show();
}
