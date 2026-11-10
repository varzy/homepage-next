## blog-img-zipper

批量压缩图片（生成 `*_compressed.*`）并支持将压缩后的图片批量上传至 sm.ms 图床。

### 配置

本项目不做环境变量管理：请直接在 `src/config.ts` 中配置 token（已存在 `SMMS_TOKEN`）。

sm.ms 官方文档：[`https://doc.sm.ms/`](https://doc.sm.ms/)

### 压缩图片

默认目录：`~/Desktop/Image Compressing`

```bash
bun run compress
```

也可以指定输入/输出目录：

```bash
bun src/index.ts -i /path/to/input -o /path/to/output
```

### 上传压缩后的图片到 sm.ms

脚本会在目标目录中扫描 `*_compressed.*` 并上传。

```bash
bun src/upload.ts --dir /path/to/output
```

可选参数：

- `--concurrency <n>`：并发数（默认 3）
- `--json <path>`：写入上传结果 JSON（默认 `upload-result.smms.json`）
- `--md <path>`：写入上传结果 Markdown（默认 `upload-result.smms.md`）
