# 定时自动发布方案对比

> 目标：将 `pnpm release`（Notion → Telegram 发布流水线）从本机 PM2 管理迁移至云端免费方案。

---

## 方案汇总

| 方案 | 免费额度 | 改动成本 | 推荐指数 |
|---|---|---|---|
| GitHub Actions | 公开仓库无限制，私有 2000 min/月 | 中（需改 config 读取环境变量） | ★★★★★ |
| GitLab CI Scheduled Pipelines | 400 min/月（SaaS） | 中 | ★★★ |
| Codemagic | 500 min/月 | 中 | ★★ |
| Oracle Cloud 免费 VPS | 永久免费实例 | 高（需运维） | ★★★ |

---

## 方案一：GitHub Actions（推荐）

### 为什么推荐

- **无需代理**：GitHub Actions runner 部署在美国/欧洲，可直连 Notion API 和 Telegram，省去本机代理的麻烦。
- **每次运行耗时约 1-2 分钟**，每日一次的话每月约 30-60 分钟，远低于私有仓库 2000 min/月的限制。
- 内置 Secrets 管理，配置简单安全。
- 可手动触发（`workflow_dispatch`），便于调试。

### 前置改动：config.ts 改为读取环境变量

当前 `config.ts` 是硬编码的，需要改为从环境变量读取，才能在 GitHub Actions 中安全注入密钥：

```ts
// src/config.ts
export const config = {
  notion: {
    token: process.env.NOTION_TOKEN!,
    dataSourceId: process.env.NOTION_DATABASE_ID!,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    chatId: process.env.TELEGRAM_CHAT_ID!,
  },
  smms: {
    apiToken: process.env.SMMS_API_TOKEN ?? '',
  },
} as const;
```

### GitHub Actions Workflow 文件

创建 `.github/workflows/release.yml`：

```yaml
name: Scheduled Release

on:
  schedule:
    # 每天北京时间 09:00 触发（UTC 01:00）
    - cron: '0 1 * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  release:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run release
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          SMMS_API_TOKEN: ${{ secrets.SMMS_API_TOKEN }}
        run: pnpm release
```

### 配置 GitHub Secrets

在仓库页面 → **Settings → Secrets and variables → Actions → New repository secret**，依次添加：

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SMMS_API_TOKEN`（可选）

### 注意事项

- GitHub 的 cron 调度**不保证精确时间**，可能延迟 5-30 分钟，且在高峰期（整点）可能更长。如果对时间精度要求不高，完全够用。
- 如果仓库是 **私有仓库**，注意 2000 min/月 的免费额度（Organization 免费计划下 Actions 不可用，需用个人账号或升级）。
- 如果仓库是 **公开仓库**，Actions 完全免费无限额度（但不建议将含有业务逻辑的代码公开）。

---

## 方案二：GitLab CI/CD 定时流水线

如果代码已托管在 GitLab，或者愿意迁移过去，可以使用 GitLab 的 Scheduled Pipelines。

### 劣势对比 GitHub Actions

- SaaS 版每月仅 400 min 免费额度（约 200 次运行）。
- 免费计划下，私有项目的 shared runner 资源更受限。

### 配置示例

`.gitlab-ci.yml`：

```yaml
release:
  image: node:22-slim
  before_script:
    - npm install -g pnpm
    - pnpm install --frozen-lockfile
  script:
    - pnpm release
  variables:
    NOTION_TOKEN: $NOTION_TOKEN
    NOTION_DATABASE_ID: $NOTION_DATABASE_ID
    TELEGRAM_BOT_TOKEN: $TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID: $TELEGRAM_CHAT_ID
    SMMS_API_TOKEN: $SMMS_API_TOKEN
  only:
    - schedules
```

在 GitLab 仓库 → **Build → Pipeline schedules** 中创建定时计划，设置 cron 表达式。

---

## 方案三：Oracle Cloud 免费 VPS

如果不想依赖 CI/CD 平台，可以申请 Oracle Cloud 的永久免费实例（Always Free Tier）：

- **2 个 AMD VM**（每个 1 OCPU + 1 GB RAM）
- **4 个 Ampere ARM VM**（共 4 OCPU + 24 GB RAM）

在 VPS 上用 `crontab` 或 PM2 管理定时任务，等同于本机方案但换成了云端服务器，且该服务器在境外（美国/日本/欧洲可选），**无需代理**。

### 适合场景

- 需要更精确的调度时间控制。
- 除发布任务外还有其他服务需要长期运行。
- 希望完全自主控制运行环境。

### 劣势

- 注册需要信用卡（用于验证身份，不会被扣费）。
- 需要自行维护服务器（系统更新、安全补丁等）。
- Oracle Cloud 偶尔会以"未实际使用"为由回收免费实例，需要定期登录或设置心跳任务。

---

## 最终建议

**直接选 GitHub Actions**，改动量最小，效果最好：

1. 修改 `config.ts` 读取环境变量（约 10 行改动）。
2. 创建 `.github/workflows/release.yml`。
3. 在 GitHub 仓库 Secrets 中填入密钥。

完成后即可删除本机 PM2 任务，享受零维护的云端定时发布。
