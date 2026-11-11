## imgtiny

批量压缩本地图片，生成 `*_compressed.*`。压缩管线来自 `@zy/image-compression`，支持 EXIF 朝向修正、Ultra HDR gain map 剥离、最长边缩放和 HEIC 转 JPEG。

### 压缩图片

默认目录：`~/Desktop/Imgtiny`

```bash
pnpm imgtiny:compress        # 仓库根目录
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
- `-k`：保持原格式（默认）。使用 `--no-keep-format` 统一转为 WebP。
- `-c`：先清空输出目录中旧的压缩产物

输出扩展名跟随压缩后的实际格式（如 HEIC → `xxx_compressed.jpg`）。已存在同名压缩产物的图片会自动跳过。
