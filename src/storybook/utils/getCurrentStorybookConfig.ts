import fs from "fs";
import zlib from "zlib";

/**
 * 📌 .storybook/main.ts의 `stories` 배열을 가져오기
 */
export function getCurrentStorybookConfig(configPath: string): string {
  const content = fs.readFileSync(configPath, "utf-8");
  return zlib.gzipSync(content).toString("base64");

  //   const match = content.match(/stories:\s*\[([^\]]*)\]/m);
  //   if (!match) return [];

  //   return match[1]
  //     .split(",")
  //     .map((s) => s.trim().replace(/['"]/g, "")) // 문자열 정리
  //     .filter((s) => s.length > 0 || !s.includes("//")); // 주석 제거, 빈 문자열 제거
}
