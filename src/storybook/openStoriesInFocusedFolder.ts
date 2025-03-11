import path from "path";
import * as vscode from "vscode";
import { findNearestPackageJson } from "./utils/findNearestPackageJson";
import { findNearestStorybookConfig } from "./utils/findNearestStorybookConfig";
import { getPackageName } from "./utils/getPackageName";
import { getStorybookCommandFromPackageJson } from "./utils/getStorybookCommandFromPackageJson";
import { updateStorybookStories } from "./utils/updateStorybookStories";
import { activeStorybookTerminals, packageStoriesMap } from "./globals";

export async function openStoriesInFocusedFolder(uri?: vscode.Uri) {
  let focusedDir: string | null = uri ? uri.fsPath : null;
  if (!focusedDir) {
    vscode.window.showErrorMessage(
      "Select a folder in Explorer. Then Right-click and select 'Open Stories in this folder'."
    );
    return;
  }

  // 1️⃣ 가장 가까운 package.json 찾기 → 패키지 이름 가져오기
  const packageJsonPath = findNearestPackageJson(focusedDir);
  if (!packageJsonPath) {
    vscode.window.showErrorMessage("No package.json found.");
    return;
  }
  const packageName = getPackageName(packageJsonPath);
  if (!packageName) {
    vscode.window.showErrorMessage("Could not determine package name.");
    return;
  }

  // 2️⃣ 가장 가까운 .storybook/main.ts 찾기
  const storybookConfigPath = findNearestStorybookConfig(focusedDir);
  if (!storybookConfigPath) {
    vscode.window.showErrorMessage("No Storybook config found.");
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

  // 4️⃣ 패키지별 stories 경로 업데이트
  if (!packageStoriesMap[packageName]) {
    packageStoriesMap[packageName] = [];
  }
  const newStoriesPath = `${focusedDir.replace(
    /\\/g,
    "/"
  )}/**/*.stories.@(js|jsx|ts|tsx)`;

  if (!packageStoriesMap[packageName].includes(newStoriesPath)) {
    packageStoriesMap[packageName].push(newStoriesPath);
  }

  // 5️⃣ .storybook/main.ts 업데이트
  updateStorybookStories(storybookConfigPath, packageStoriesMap[packageName]);

  // 6️⃣ Storybook 실행할 터미널 생성
  const terminal = vscode.window.createTerminal({
    name: `Storybook (${packageName})`,
    cwd: path.dirname(path.dirname(storybookConfigPath)), // 프로젝트 루트
  });

  vscode.window.onDidCloseTerminal(async (closedTerminal) => {
    closedTerminal.sendText("\u0003", true); // Equivalent to pressing Ctrl+C in the terminal
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기 (정상 종료 보장)
    delete activeStorybookTerminals[packageName];
  });

  activeStorybookTerminals[packageName] = terminal;

  // 7️⃣ package.json에서 storybook 실행 명령어 찾기
  const storybookCommand = getStorybookCommandFromPackageJson(packageJsonPath);

  if (storybookCommand) {
    terminal.sendText(storybookCommand);
  } else {
    terminal.sendText("npx storybook dev -p 6006");
  }

  terminal.show();
}
