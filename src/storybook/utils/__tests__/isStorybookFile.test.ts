import { isStorybookFile } from "../isStorybookFile";

describe("isStorybookFile", () => {
  it("should return true/false if the file is a storybook file", () => {
    expect(isStorybookFile("a.story.tsx")).toBe(false);
    expect(isStorybookFile("a.stories.tsx")).toBe(true);
    expect(isStorybookFile("a.stories.js")).toBe(true);
    expect(isStorybookFile("a.stories.jsx")).toBe(true);
    expect(isStorybookFile("a.stories.ts")).toBe(true);
    expect(isStorybookFile("a.stories.tsx")).toBe(true);
  });
});
