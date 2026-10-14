import { betterAuth } from "better-auth";

/**
 * 認証・セッションは Better Auth に任せる (独自実装しない)。
 * ログイン手段は OAuth のみでパスワードを保持しない。
 * E2E の鍵はログインとは別のパスフレーズで守るため、ここが破られても内容は読めない。
 */
export function createAuth(env: Env) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [env.BETTER_AUTH_URL],
    socialProviders: {
      // スコープは各プロバイダの既定 (プロフィールとメールのみ)
      github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    },
    account: {
      // プロバイダのトークンは使わないが、保存される以上は暗号化しておく
      encryptOAuthTokens: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
    },
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
    },
    telemetry: { enabled: false },
  });
}

export type Auth = ReturnType<typeof createAuth>;
