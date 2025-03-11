import * as fs from "fs";
import * as path from "path";

export function findNearestStorybookConfig(startDir: string): string | null {
  let currentDir = startDir;

  while (true) {
    const storybookDir = path.join(currentDir, ".storybook");
    const mainJsPath = path.join(storybookDir, "main.js");
    const mainTsPath = path.join(storybookDir, "main.ts");

    if (fs.existsSync(mainJsPath)) {
      return mainJsPath;
    }

    if (fs.existsSync(mainTsPath)) {
      return mainTsPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // 루트까지 올라가면 종료
    }

    currentDir = parentDir;
  }

  return null;
}
