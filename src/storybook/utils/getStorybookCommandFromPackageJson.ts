import fs from "fs";

export function getStorybookCommandFromPackageJson(
  packageJsonPath: string
): string | null {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const scripts = packageJson.scripts || {};

    // `storybook` 관련된 실행 스크립트 찾기
    for (const [key, command] of Object.entries(scripts)) {
      if (typeof command === "string" && command.includes("storybook")) {
        return `npm run ${key}`;
      }
    }
  } catch (error) {
    console.error("Failed to read package.json:", error);
  }
  return null;
}
