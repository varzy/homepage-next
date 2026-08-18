# s.ee → R2 迁移执行指导（阶段一）

只有两个脚本带 `--apply`（`migrate:rewrite` 与 `cleanup:r2`），两者都默认 dry-run；download/upload 虽无 `--apply` 但本身幂等可随时重跑。核心原则：**写/删类操作一律先 dry-run，审完再 `--apply`；download/upload/rewrite 出错直接原样重跑**。

> 关联文档：[实施设计](./migrate-image-to-r2-implementation.md)、[PRD](./migrate-image-to-r2-PRD.md)。
> 本文随代码同步，命令对应 `scripts/` 下的 `preflight-check.ts` / `download-see-images.ts` / `upload-legacy-to-r2.ts` / `rewrite-notion-urls.ts` / `verify-r2.ts` / `cleanup-r2-orphans.ts`。

---

## 阶段 0｜前置（代码外，一次性）

1. **Cloudflare**：把 `cdn.varzy.me` 绑定到 R2 桶 `homepage`（Custom Domain）。
2. **`.env`**：
   - `R2_PUBLIC_DOMAIN=https://cdn.varzy.me` ← 关键，preflight/rewrite 的硬门槛
   - `R2_BUCKET_NAME=homepage`、`R2_KEY_PREFIX=images` 保持不变

> 这两项没就绪，后面所有步骤都会在域名门上报错退出。

---

## 阶段 1｜连通性自检

```bash
pnpm verify:r2
```

**做什么**：上传一张 1×1 测试 PNG → 经 `cdn.varzy.me` GET 回来 → 字节比对 → 删除。

**看到什么才算过**：最后一行 `🎉 R2 验证通过：上传、公开读取、删除、过渡期判定均正常。`

**失败排查**：GET 失败 = `cdn.varzy.me` 没绑好或 `.env` 域名写错；上传失败 = R2 凭证/桶名错。

---

## 阶段 2｜预检（只读，不改任何数据）

```bash
pnpm migrate:preflight
# 想先小范围试：pnpm migrate:preflight -- --only taste --limit 3
```

**做什么**：环境校验 + R2 连通 + content.prod 结构对齐断言 + cover/icon 扫描 + legacy key 冲突检测。输出 `tmp/migration-preflight.json`。

**逐项核对**（控制台汇总段）：

| 指标 | 期望 | 不符怎么办 |
|---|---|---|
| 四库 `对齐 N / 不匹配 0` | 每库 `不匹配==0` | rewrite 会自动跳过这些页；>0 时翻 JSON 的 `mismatchedPageList` 确认是已知的少量边角页 |
| `无 content.prod` | 少量或 0 | 这些是新页，rewrite 跳过其块回写（合理） |
| `child_page 子树图片` | 0 或极少 | 这是唯一盲区，需人工复核 |
| `页面 cover s.ee` / `icon s.ee` | 0 / 0（无页面级图片时） | 若非 0 说明有页面级图片，需另处理 |
| `legacy key 冲突` | 0 | >0 翻 JSON 看是哪两条 s.ee 映射到同一 key |
| `content.prod 独立 s.ee URL` | 记下这个数 N | 这就是阶段 3 的下载目标规模 |

**门槛**：`不匹配` 与 `key 冲突` 都为 0（或你已理解的非 0 项）→ 进入阶段 3。

---

## 阶段 3｜下载 s.ee 图到本地

```bash
# 可选冒烟：先下 5 张验证流程
pnpm migrate:download -- --limit 5 --skip-live-covers
# 全量（无 cover/icon 时加 --skip-live-covers 跳过那步空查询）
pnpm migrate:download -- --skip-live-covers
```

**做什么**：扫 content.prod 的 s.ee URL，下到 `tmp/see-cache/<legacyKey>`（路径与 R2 key 一致）。

**看到什么才算过**：
- `待下载（去重）：N 张` —— N 应≈ 阶段 2 的独立 s.ee URL 数
- `✅ 完成：下载 X，跳过 Y，失败 0` —— **失败必须为 0**
- 失败会写 `tmp/see-cache/_failures.json`

**失败处理**：直接重跑同一条命令（幂等，已下的跳过，只补失败项）。若某些是持续 404（s.ee 上图已删），记下——这些块在阶段 5 会被 R2 门跳过并标记，需人工处理。

**门槛**：`失败 == 0`（或已知可接受的少量）→ 进入阶段 4。

---

## 阶段 4｜上传到 R2 `/legacy/`

```bash
pnpm migrate:upload
# 可选先小试：pnpm migrate:upload -- --limit 10
```

**做什么**：把 `tmp/see-cache/*` 原样上传到 R2，key = `legacy/...`（绕过 `images/` 前缀）。HEAD 探测已存在则跳过，PUT 后抽 5 个公开 URL 字节比对。

**看到什么才算过**：
- `待上传：N 个文件` —— N = 下载成功数
- `✅ 完成：上传 X，跳过 Y，失败 0`
- `抽样校验：5/5 字节一致` —— **抽样必须全过**

**失败处理**：重跑同命令（幂等）。字节不一致 = 上传损坏，重跑该对象。

**门槛**：`失败 == 0` 且抽样全过 → 进入阶段 5。

---

## 阶段 5｜回写 Notion（dry-run → 审 → apply）⚠️唯一真正改 Notion 的一步

### 5a. dry-run（默认，不写）

```bash
pnpm migrate:rewrite
# 想先小范围：pnpm migrate:rewrite -- --only taste --limit 3
```

**做什么**：逐页配对 `blockId[i] ↔ content.prod url[i]`，打印 `from → to` 配对表 + R2 存在性门结果，输出 `tmp/migration-rewrite.json`。

**逐页核对**：
- 每个 `from → to`：`from` 是 s.ee 或旧 R2-hash 链；`to` 必须形如 `https://cdn.varzy.me/legacy/<原 s.ee 路径>`
- 行尾标记：`will-write`（待写）、`skip_idempotent`（已是 legacy，跳过）、`r2:✗`（R2 缺失，跳过）

**汇总段必须满足以下全部，才可加 `--apply`**：

| 条件 | 期望 | 不符怎么办 |
|---|---|---|
| `R2 缺失跳过` | 0 | >0 回阶段 3/4 补齐（rewrite 不会写指向缺失对象的 URL，安全但不完整） |
| `target 形状异常` | 0 | >0 说明域名/legacy 构造有问题，停手排查 |
| `待写` | >0 且合理（≈待迁移图片数） | 为 0 说明全已迁移，跳到阶段 6 |
| `幂等跳过` | 首次 0（重跑时会变多） | — |
| `非 s.ee 跳过` | ~0（content.prod 应全是 s.ee） | >0 翻 JSON 看 URL |
| `块数不匹配` 页数 | == 阶段 2 预检的不匹配数 | 应一致 |
| `sha1 诊断` | 任意（非阻断） | 这些是曾指向他图的块，rewrite 会按位置覆盖修正 |

> `sha1 诊断` 不为 0 是正常的——它只是提示某些块之前被错指过，本次按 content.prod 位置覆盖修正。

### 5b. apply（真正回写）

```bash
pnpm migrate:rewrite -- --apply
```

**看到什么才算过**：
- `回写中...` 逐项执行（每项间隔 100ms）
- `已回写 N，回写错误 0` —— N 应≈ 5a 的 `待写`

**失败处理**：`回写错误 > 0` 时直接重跑 `--apply`（幂等：已写的变 `skip_idempotent`，只补失败的）。

**门槛**：`回写错误 == 0` → 进入阶段 6。

---

## 阶段 6｜重建本地 + 验收无 s.ee 拋留

```bash
pnpm sync:all
```

**做什么**：从（已改写的）Notion 重建 `content/`。

**验收 s.ee 拋留应为 0**：

```bash
grep -rnE "https://[^/]*\.(see\.you|sa\.net|sm\.ms|seecdn\.(com|net)|seeusercontent\.com)" content/ | wc -l
```

> 期望 `0`。若 >0，这些来自阶段 5 跳过的页（不匹配/无 content.prod/R2 缺失），翻 `tmp/migration-rewrite.json` 的 `r2MissingOps` / `mismatchedPages` 人工收尾。

**站点目检**：

```bash
pnpm dev
```

打开页面，确认图片正常显示（legacy URL 可访问）。

---

## 阶段 7｜清理 R2 旧 `images/` 孤儿（dry-run → apply）

```bash
pnpm cleanup:r2            # dry-run，列孤儿
pnpm cleanup:r2 -- --apply # 真删
```

**做什么**：扫 `images/` 前缀下、公开 URL 未被任何 Notion 页面引用的对象。**`legacy/` 前缀不在扫描范围，绝不会被删**。

**dry-run 核对**：
- `孤儿` 清单应全是旧 hash 对象（形如 `images/posts_<pageId>_<16hex>.jpg`）
- `保留` 清单 = 仍被 Notion 引用的 `images/` 对象（来自阶段 5 跳过的页），核对合理
- 不应出现任何 `legacy/` 开头的 key

确认后 `--apply` 删除。

---

## 阶段 8｜收尾全检

```bash
pnpm exam   # format + lint + typecheck + test
```

全绿即完成。

---

## 一句话决策表

| 脚本 | 默认行为 | 何时 `--apply` |
|---|---|---|
| `verify:r2` | 直接执行（自检） | 无此参数 |
| `migrate:preflight` | 只读 | 无此参数 |
| `migrate:download` | 直接执行（幂等） | 无，出错重跑 |
| `migrate:upload` | 直接执行（幂等） | 无，出错重跑 |
| `migrate:rewrite` | dry-run | 5a 审完、R2 缺失=0、配对表无误后 |
| `cleanup:r2` | dry-run | 孤儿清单全是旧 `images/` hash、无 `legacy/` 后 |

**回滚锚点**：全程 `content.prod/` 只读不改，是位置真源与回滚依据；Notion 是 rewrite 唯一写入对象，且 rewrite 幂等——任何时候重跑 `--apply` 都只会把块对齐到 `legacy/`，不会重复写错。
