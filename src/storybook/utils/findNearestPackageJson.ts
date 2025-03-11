import path from "path";
import fs from "fs";

export function findNearestPackageJson(dir: string): string | null {
  let currentDir = dir;
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}
