import { defineConfig } from "vitest/config";

// 暗号・スキーマの単体テストは Node で実行する (Cloudflare プラグインは読み込まない)
export default defineConfig({
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
