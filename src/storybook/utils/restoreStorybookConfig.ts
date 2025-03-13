import fs from "fs";
import * as vscode from "vscode";
import zlib from "zlib";
/**
 * 📌 스토리북 설정 원래대로 복원
 */
export function restoreStorybookConfig(
  configPath: string,
  compressedConfig: string
) {
  const originalConfig = zlib
    .gunzipSync(Buffer.from(compressedConfig, "base64"))
    .toString();
  fs.writeFileSync(configPath, originalConfig);
  vscode.window.showInformationMessage(
    `Restored Storybook config: ${configPath}`
  );
}
