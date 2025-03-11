import fs from "fs";

export function updateStorybookStories(configPath: string, focusedDir: string) {
  let content = fs.readFileSync(configPath, "utf-8");

  // ✅ `// stories:`로 시작하는 주석 제거
  content = content.replace(/^\s*\/\/?\s*stories:\s*\[[^\]]*\]\s*,?/gm, "");
  // stories 배열만 교체 (주석 무시)
  const newStoriesPath = `${focusedDir.replace(
    /\\/g,
    "/"
  )}/**/*.stories.@(js|jsx|ts|tsx)`;
  const storiesRegex = /stories:\s*\[[^\]]*\]/;

  content = content.replace(storiesRegex, `stories: ['${newStoriesPath}']`);

  fs.writeFileSync(configPath, content, "utf-8");
}
