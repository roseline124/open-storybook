import * as vscode from "vscode";

export let activeStorybookTerminals: Record<string, vscode.Terminal> = {};

// ✅ 패키지별 stories 경로를 관리하는 local 변수
export const packageStoriesMap: Record<string, string[]> = {};
