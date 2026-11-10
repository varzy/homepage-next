## imgtiny (blog-img-zipper)

批量压缩图片（生成 `*_compressed.*`）并支持将压缩后的图片批量上传至 sm.ms 图床。

压缩管线来自 `@zy/shared`（与 homepage、no2tg2 共用同一套）：EXIF 朝向修正、Ultra HDR gain map 剥离、最长边缩放、HEIC 自动转 JPEG。

### 配置

sm.ms 上传 token 通过 `packages/imgtiny/.env` 提供（参考 `.env.example`，已被 gitignore）：

```env
SMMS_TOKEN=xxx
```

sm.ms 官方文档：[`https://doc.sm.ms/`](https://doc.sm.ms/)

### 压缩图片

默认目录：`~/Desktop/Imgtiny`

```bash
pnpm imgtiny:compress        # 仓库根目录
# 或
pnpm --filter imgtiny compress
```

指定目录与参数（flag 直接透传，无需 `--`）：

```bash
pnpm imgtiny:compress --input /path/to/input --output /path/to/output
```

参数：

- `-i <path>`：输入目录
- `-o <path>`：输出目录（默认同输入目录）
- `-w <number>`：最长边上限 px（默认 1920）
- `-q <number>`：质量 1-100（默认 90）
- `-k`：保持原格式（默认开；关掉则统一转 WebP）
- `-c`：先清空输出目录中旧的压缩产物

输出扩展名跟随压缩后的实际格式（如 HEIC → `xxx_compressed.jpg`）。已存在同名压缩产物的图片会自动跳过。

### 上传压缩后的图片到 sm.ms

脚本会在目标目录中扫描 `*_compressed.*` 并上传。

```bash
pnpm --filter imgtiny upload --dir /path/to/output
```

可选参数：

- `--dir <path>`：目标目录
- `--concurrency <n>`：并发数（默认 3）
- `--json <path>`：写入上传结果 JSON（默认 `upload-result.smms.json`）
- `--md <path>`：写入上传结果 Markdown（默认 `upload-result.smms.md`）

### 监听目录变化自动压缩

```bash
pnpm --filter imgtiny watch
```
