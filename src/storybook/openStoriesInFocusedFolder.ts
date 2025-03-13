import path from "path";
import * as vscode from "vscode";
import { findNearestPackageJson } from "./utils/findNearestPackageJson";
import { findNearestStorybookConfig } from "./utils/findNearestStorybookConfig";
import { getPackageName } from "./utils/getPackageName";
import { getStorybookCommandFromPackageJson } from "./utils/getStorybookCommandFromPackageJson";
import { updateStorybookStories } from "./utils/updateStorybookStories";
import { activeStorybookTerminals, packageStoriesMap } from "./globals";
import { getCurrentStorybookConfig } from "./utils/getCurrentStorybookConfig";
import { restoreStorybookConfig } from "./utils/restoreStorybookConfig";

export async function openStoriesInFocusedFolder(uri?: vscode.Uri) {
  let focusedDir: string | null = uri ? uri.fsPath : null;
  if (!focusedDir) {
    vscode.window.showInformationMessage(
      "Explorer > Folder > Right-click > Open Stories in this folder"
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

  // 가장 가까운 .storybook/main.ts 찾기
  const storybookConfigPath = findNearestStorybookConfig(focusedDir);
  if (!storybookConfigPath) {
    vscode.window.showErrorMessage("No Storybook config found.");
    return;
  }

  // 기존 `stories` 경로를 저장 (되돌리기 위해)
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

  const newStoriesPath = `${focusedDir.replace(
    /\\/g,
    "/"
  )}/**/*.stories.@(js|jsx|ts|tsx)`;

  if (!packageStoriesMap[packageName].current.includes(newStoriesPath)) {
    packageStoriesMap[packageName].current.push(newStoriesPath);
  }

  // 5️⃣ .storybook/main.ts 업데이트
  updateStorybookStories(
    storybookConfigPath,
    packageStoriesMap[packageName].current
  );

  // 6️⃣ Storybook 실행할 터미널 생성
  const terminal = vscode.window.createTerminal({
    name: `Storybook (${packageName})`,
    cwd: path.dirname(path.dirname(storybookConfigPath)), // 프로젝트 루트
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

  // 7️⃣ package.json에서 storybook 실행 명령어 찾기
  const storybookCommand = getStorybookCommandFromPackageJson(packageJsonPath);

  if (storybookCommand) {
    terminal.sendText(`${storybookCommand} -- --ci`);
  } else {
    terminal.sendText("npx storybook dev");
  }

  terminal.show();
}
