import fs from "fs";

/**
 * 📌 package.json에서 `name` 필드 값을 가져오기
 */
export function getPackageName(packageJsonPath: string): string | null {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.name || null;
  } catch (error) {
    console.error("Failed to read package.json:", error);
    return null;
  }
}
