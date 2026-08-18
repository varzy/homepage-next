# PRD

我正在将此前托管在 s.ee 上的图片迁移到 cloudflare r2 上，已经做了许多工作，并且此前的老图片基本都迁移完毕了。

但由于之前的代码的 bug，以及一些历史遗留问题，导致 scripts 目录下多了许多临时的脚本。我现在计划对整个 scripts 目录下的逻辑进行简化。

我想做的修改有：

1. 重新设计 r2 中的存储路径，此前的路径有乱码风格，也有 posts_{notion page id}_{img hash} 这样的风格，例如 images/posts_2aadc9c0-364a-80d5-87a2-ed84b31e23f6_83252053937e9626.jpg。总之，此前的就都不要管了，维持原样，但我希望新版的路径更加规整。具体的路径规则见 2
2. 举例，我希望所有的图片都在存储桶中以 images 开头，这一点保持不变，但接下来不是一个扁平的结构，而是使用「年/月/类别/页面 id/图片唯一编码」来区分。例如： images/2026/08/posts/{pageid}/{img hash}.{ext}。如此一来保证每个页面都有自己的文件夹，并且下方的 img 通过 hash 方式永不重复。
3. 简化将 Notion 页面拉取到本地过程中处理图片的逻辑，即 pnpm fetch:posts, pnpm sync:posts 等对应的逻辑。目前的太过于杂乱了，我其实想要的很简单：
3.1 如果图片已经是 r2 托管的，那么跳过
3.2 如果图片是 notion 托管的，那么上传到 r2，并替换原始 notion 页面中的链接。这一部分功能已经有对应的实现
3.3 如果图片是 sm.ms 托管的，说明这是历史遗留问题，需要手动解决，简单的直接报错即可。理论上，现在所有的图片都已经上传到了 r2 了，不应该出现这种问题
4. 归档无用代码，如 smms-uploader.ts, verify-v2.ts 等未来不再会使用的代码，甚至 smms 相关的所有代码，请移动到项目根目录的 backup 文件夹下（除了 3.3 中判断是否是 sm.ms 托管以外，剩余所有 sm.ms 相关代码均可归档）。同样的，package.json 中 migrate:smms 和 restore:notion 这两个命令也可以删除
5. 目前 cloudflare 后台，除了 img.varzy.me 同样还配置了 cdn.varzy.me，需要保证这两个域名均可被认为是合法的 r2 域名。并且未来新上传的图片，都启用 cdn.varzy.me，而非 img.varzy.me。img.varzy.me 后续仅作为兼容性使用。
6. 简化 .env 中 R2 相关的环境变量，将R2_KEY_PREFIX, R2_PUBLIC_DOMAIN 这两个不敏感的变量直接写死到代码中即可。其中 R2_KEY_PREFIX 固定是 images, R2_PUBLIC_DOMAIN 固定是 [img.varzy.me, cdn.varzy.me]。

总之，我希望对 scripts 进行全方位的瘦身，对于需要修改以前代码才能实现的功能，请尽情修改，无用的、已经失效的代码请尽情删除。

如果有考虑不周的地方或是需要补充细节的地方，随时向我提问。

请注意，请不要直接改动代码，而是先给我一份实施文档，等待我审计后再开始开发。
