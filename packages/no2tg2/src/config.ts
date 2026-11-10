function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少必需的环境变量：${name}`);
  }
  return value;
}

export const config = {
  notion: {
    token: requireEnv('NOTION_TOKEN'),
    dataSourceId: requireEnv('NOTION_DATABASE_ID'),
  },
  telegram: {
    botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    chatId: requireEnv('TELEGRAM_CHAT_ID'),
  },
  r2: {
    accountId: requireEnv('R2_ACCOUNT_ID'),
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    bucket: 'homepage',
    publicDomain: 'https://cdn.varzy.me',
    label: 'no2tg2',
  },
} as const;

/** R2 是否已完整配置（账号、Access Key、Secret 三者齐全）。 */
export function isR2Configured(): boolean {
  return Boolean(config.r2.accountId && config.r2.accessKeyId && config.r2.secretAccessKey);
}
