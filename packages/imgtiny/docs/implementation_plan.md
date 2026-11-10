# 博客图片批量压缩工具实施文档

## 1. 项目概述

本项目旨在开发一个基于 TypeScript 和 Bun 的命令行工具，用于批量压缩高分辨率图片（如相机直出的 15-20MB 照片），使其体积降低至几百 KB，以便在博客等 Web 场景中使用。

## 2. 技术选型

- **运行环境**: [Bun](https://bun.sh/) (兼容 Node.js API，启动速度快，原生支持 TS)
- **核心图像处理库**: [sharp](https://sharp.pixelplumbing.com/)
  - _理由_: 它是目前 Node.js 生态中性能最强、维护最活跃的图像处理库。基于 C++ libvips，处理大图时内存占用低，速度比纯 JS 库快 4-5 倍。
- **命令行交互**:
  - `commander`: 用于解析命令行参数（输入目录、输出目录等）。
  - `chalk`: 用于美化终端日志输出。
  - `ora`: 用于显示处理进度 Loading 动画（可选，提升体验）。
- **文件查找**: `glob` 或 Bun 原生 API。

## 3. 功能需求

1.  **读取输入**: 能够指定一个包含图片的文件夹。
2.  **格式过滤**: 自动识别 `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic` (视系统支持情况) 等常见格式。
3.  **智能压缩**:
    - **尺寸调整 (Resize)**: 限制图片最大宽度（建议 1600px - 1920px）。对于原图宽度小于该值的，不放大。
    - **格式转换**: 默认转换为 WebP 格式（兼顾画质与体积的最佳选择），也支持输出 JPEG。
    - **质量控制**: 默认质量 75-80，保证肉眼观感良好的前提下大幅压缩体积。
4.  **输出**: 将处理后的图片保存到指定输出目录，文件名自动添加 `_compressed` 后缀（例如 `IMG_001.jpg` -> `IMG_001_compressed.webp` 或 `IMG_001_compressed.jpg`）。

## 4. 压缩策略详情

为了将 15MB 的图片压缩到几百 KB：

1.  **分辨率缩减**: 相机照片通常为 6000x4000 (2400万像素) 或更高。
    - 策略: `resize({ width: 1920, withoutEnlargement: true })`
    - 效果: 像素数量减少约 90%，体积大幅下降。
2.  **格式优化**:
    - 策略: 转换为 WebP。
    - 效果: WebP 在相同质量下比 JPEG 小 25-34%。
3.  **元数据处理**:
    - 策略: 默认去除 EXIF 信息（拍摄地、相机参数等），进一步减小体积并保护隐私。但保留 Orientation（方向）信息以防止照片旋转。

## 5. 代码结构规划

```text
src/
├── index.ts        # 入口文件，CLI 配置
├── processor.ts    # 图片处理核心逻辑
└── utils.ts        # 文件路径查找等工具函数
```

## 6. 使用方式 (设计)

```bash
# 安装依赖
bun install

# 执行脚本
# -i: 输入目录 (默认: ~/Desktop/Image Compressing)
# -o: 输出目录 (默认在输入目录下的 dist 文件夹)
# -w: 最大宽度 (默认 1920)
bun run src/index.ts
```

## 7. 依赖包列表

```json
{
  "dependencies": {
    "sharp": "^0.33.x",
    "commander": "^11.x.x",
    "chalk": "^5.x.x",
    "ora": "^8.x.x"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/sharp": "latest"
  }
}
```

## 8. 下一步行动计划

1.  初始化 Bun 项目 (`bun init`)。
2.  安装 `sharp`, `commander`, `chalk`, `ora` 等依赖。
3.  编写 `src/processor.ts` 实现核心压缩逻辑。
4.  编写 `src/index.ts` 实现 CLI 交互。
5.  测试不同尺寸的图片。
