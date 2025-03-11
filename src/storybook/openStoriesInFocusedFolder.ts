import path from "path";
import * as vscode from "vscode";
import { findNearestPackageJson } from "./utils/findNearestPackageJson";
import { findNearestStorybookConfig } from "./utils/findNearestStorybookConfig";
import { getStorybookCommandFromPackageJson } from "./utils/getStorybookCommandFromPackageJson";
import { updateStorybookStories } from "./utils/updateStorybookStories";

export async function openStoriesInFocusedFolder(uri?: vscode.Uri) {
  let focusedDir: string | null = uri ? uri.fsPath : null;
  if (!focusedDir) {
    vscode.window.showErrorMessage(
      "Select a folder in Explorer. Then Right-click and select 'Open Stories in this folder'."
    );
    return;
  }

  // 1️⃣ 가장 가까운 .storybook/main.ts 찾기
  const storybookConfigPath = findNearestStorybookConfig(focusedDir);
  if (!storybookConfigPath) {
    vscode.window.showErrorMessage("No Storybook config found.");
    return;
  }

  // 2️⃣ stories 경로 수정
  updateStorybookStories(storybookConfigPath, focusedDir);

  // 3️⃣ Storybook 실행할 터미널 생성
  const sessionId = new Date().getTime();
  const terminal = vscode.window.createTerminal({
    name: `Storybook (${sessionId})`,
    cwd: path.dirname(path.dirname(storybookConfigPath)), // 프로젝트 루트
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
