import fs from "fs";

/**
 * 📌 .storybook/main.ts의 `stories` 배열을 업데이트 (주석 포함 제거)
 */
export function updateStorybookStories(configPath: string, stories: string[]) {
  let content = fs.readFileSync(configPath, "utf-8");

  // ✅ `// stories:`로 시작하는 주석 제거
  content = content.replace(/^\s*\/\/?\s*stories:\s*\[[^\]]*\]\s*,?/gm, "");
  // stories 배열만 교체 (주석 무시)
  const storiesRegex = /stories:\s*\[[^\]]*\]/;

  const formattedStories = `stories: ${JSON.stringify(stories, null, 2)}`;
  content = content.replace(storiesRegex, formattedStories);

  fs.writeFileSync(configPath, content, "utf-8");
}
