---
title: '使用 ohmyzsh 提升终端使用体验'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Terminal', 'DevEnv']
date: '2021-11-27'
slug: 'ohmyzsh-terminal-usage'
summary: ''
last_edited_time: '2025-08-06T03:16:00.000Z'
blog_last_fetched_time: '2025-08-06T06:17:00.751Z'
notion_id: '332a9dfa-7231-40af-899e-43639847c192'
icon: '🧨'
---

## 安装 ohmyzsh

在安装 ohmyzsh 之前，需要先安装 zsh。注意：MacOS Big Sur 之后的默认终端已经是 zsh 了，无须再次安装。

```bash
# 举例，在 Ubuntu 下安装 zsh
sudo apt install -y zsh

# 修改默认终端为 zsh
chsh -s /bin/zsh

# 安装 ohmyzsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

注意：raw.github.com 在大陆是被墙的，因此这个脚本很有可能下载不下来。你可以先给终端翻墙，或者先手动打开 [https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh](https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh) 这个地址，再把里面的内容保存到一个本地文件，再尝试安装。网络问题还是挺玄学的，如果安装失败，建议多重试几次。

```bash
vim install-ohmyzsh.sh
# 复制网址中的全部内容后保存
sh ./install-ohmyzsh.sh
```

## 主题

ohmyzsh 拥有千奇百怪的主题。你可以在 `~/.zshrc` 的 `ZSH_THEME=""` 这一行设置你喜欢的主题。

![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/eb9817a2-86cf-4367-9b4c-f971a900079d/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T3B6IN42%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061656Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCIBD8t533OMLTBnMccOk7iaTsJRgYpMpbY1KITFAFH7CQAiB7A%2Fm2Khbn5bdNw537y3KPdcSKClJwq3nuS0oQnz2BnSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMN5sD5gXl2%2FUhHbXyKtwD5R66qt45KoWa%2BfIWsIC3twXtqAutUeJl3sG6ttPp7X7%2BYc7F68FfRUGM8hX%2FxCcKfQiQd1CGaovrFw36FdZgZKqGgPIne%2F0IpXkNR7LMbyo1j6nd13QVJlhSm1p5wSYwvoDIBNHdo%2F4yfJD1%2BWCYCh6W3l5hVVMy%2BAbzPvLD2xc4vZl6yIHskS%2FjWiOxFgzCc%2B3GRXbr%2BGyGkxrjvBRQ92H6vmwgXenMmxJrwfc2U%2FEOT80dk9lpNXg3dLQ3BKSON6An5gKez5wSKq7Gm%2BZmg7V3pG3sK%2FlbQ1qeDYpOvbZQHdJ%2BcuDCVWLF0HkYMcxoYNpu6FmPrnFWqpTQn2ZFpL4p8KUjNnXJOH778ifX58Sye0E0aqt6BV%2Bs%2F95ED1qf%2Bk5XBKH1bh6mY2rat%2F6s419F7gs2HoAvMRQCjm70fQpBWwmxK2E73MS1b%2FL%2BENft1KmYWmgCIOz2CxE%2FKFoRE7uxlCDZavyPMW5j2m0%2Bj8QX4wyR74QQ3lTIrkkBSKUaK85u9Tv82Zxs7HUpgi09h5p7QbDacVdqPiMIrbVzaIQISrXK4CFo3qdGJr2010XOATcwO3VYWCjk0aQHk2fRJNOI8ubUqzPu1epeg%2BjJok5%2B0LCPA4lnEduUS4MwqsvLxAY6pgHZuVnv1Jr3UB0yVxhFbEfaEEZZZ%2Bb%2BL9bbyX0G8K43em1Ay7JjHjSYgK%2F8HywtO2XUAYztDsFcPrJ6mhX4TeW7qmo6jTK7nKOekdm3Nv%2Fin8DxN7vYu6Qy6%2F37yiNXybaLIQ3bNA59nhTtVZlwKfeCotpzsNO5OSHtKMLcOyFKjw5eNM8qEF07uLGM5h2fPNDkBNFbtpV5UOaK1bWyQWh%2BDEb6%2BAlS&X-Amz-Signature=69a608b238a4a4feb895b10b480ea7f7bbd7d32b4224312c1f1b834d0c7d400b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

你可以在 ohmyzsh wiki 的 [themes 页面](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)浏览全部自带主题。除此之外，Github 上还有非常多未被官方收录的民间主题，有一些确实花哨得夸张。。。

> 💡 我也试用过千万主题，最终还是回到了默认的 `robbyrussell`。

如果你是个喜欢寻求刺激的人，可以尝试设置 `ZSH_THEME="random"`，每次打开终端都是未知的体验（笑。

## 插件

### 自带插件 & 启用插件

ohmyzsh 自带了很多插件，你可以在 ohmyzsh wiki 的 [plugins 页面](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)浏览全部，文件夹名字就是插件名字，你可以在 .zshrc 中直接启用。

如何启用插件？打开 `~/.zshrc`，找到 `plugins=(git)` 这一行，括号内填入插件名称并以空格分隔，保存文件后执行 `source ~/.zshrc` 即可看到效果。

![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/59993236-d241-48db-82c3-fa24432850aa/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T3B6IN42%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061656Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCIBD8t533OMLTBnMccOk7iaTsJRgYpMpbY1KITFAFH7CQAiB7A%2Fm2Khbn5bdNw537y3KPdcSKClJwq3nuS0oQnz2BnSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMN5sD5gXl2%2FUhHbXyKtwD5R66qt45KoWa%2BfIWsIC3twXtqAutUeJl3sG6ttPp7X7%2BYc7F68FfRUGM8hX%2FxCcKfQiQd1CGaovrFw36FdZgZKqGgPIne%2F0IpXkNR7LMbyo1j6nd13QVJlhSm1p5wSYwvoDIBNHdo%2F4yfJD1%2BWCYCh6W3l5hVVMy%2BAbzPvLD2xc4vZl6yIHskS%2FjWiOxFgzCc%2B3GRXbr%2BGyGkxrjvBRQ92H6vmwgXenMmxJrwfc2U%2FEOT80dk9lpNXg3dLQ3BKSON6An5gKez5wSKq7Gm%2BZmg7V3pG3sK%2FlbQ1qeDYpOvbZQHdJ%2BcuDCVWLF0HkYMcxoYNpu6FmPrnFWqpTQn2ZFpL4p8KUjNnXJOH778ifX58Sye0E0aqt6BV%2Bs%2F95ED1qf%2Bk5XBKH1bh6mY2rat%2F6s419F7gs2HoAvMRQCjm70fQpBWwmxK2E73MS1b%2FL%2BENft1KmYWmgCIOz2CxE%2FKFoRE7uxlCDZavyPMW5j2m0%2Bj8QX4wyR74QQ3lTIrkkBSKUaK85u9Tv82Zxs7HUpgi09h5p7QbDacVdqPiMIrbVzaIQISrXK4CFo3qdGJr2010XOATcwO3VYWCjk0aQHk2fRJNOI8ubUqzPu1epeg%2BjJok5%2B0LCPA4lnEduUS4MwqsvLxAY6pgHZuVnv1Jr3UB0yVxhFbEfaEEZZZ%2Bb%2BL9bbyX0G8K43em1Ay7JjHjSYgK%2F8HywtO2XUAYztDsFcPrJ6mhX4TeW7qmo6jTK7nKOekdm3Nv%2Fin8DxN7vYu6Qy6%2F37yiNXybaLIQ3bNA59nhTtVZlwKfeCotpzsNO5OSHtKMLcOyFKjw5eNM8qEF07uLGM5h2fPNDkBNFbtpV5UOaK1bWyQWh%2BDEb6%2BAlS&X-Amz-Signature=03ec5f9fa1998d03057dfe65e26d520ba32f48fbf658ef62d8c56aa446cd85bc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### z

z 是一个 ohmyzsh 自带的插件，它可以记录你去过的所有文件夹，并提供快速跳转。使用时并不需要输入完整的路径，z 会自动进行联想，而且准确度相当高。

![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/2a601347-3be6-4a97-9738-a005af40faab/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T3B6IN42%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061656Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCIBD8t533OMLTBnMccOk7iaTsJRgYpMpbY1KITFAFH7CQAiB7A%2Fm2Khbn5bdNw537y3KPdcSKClJwq3nuS0oQnz2BnSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMN5sD5gXl2%2FUhHbXyKtwD5R66qt45KoWa%2BfIWsIC3twXtqAutUeJl3sG6ttPp7X7%2BYc7F68FfRUGM8hX%2FxCcKfQiQd1CGaovrFw36FdZgZKqGgPIne%2F0IpXkNR7LMbyo1j6nd13QVJlhSm1p5wSYwvoDIBNHdo%2F4yfJD1%2BWCYCh6W3l5hVVMy%2BAbzPvLD2xc4vZl6yIHskS%2FjWiOxFgzCc%2B3GRXbr%2BGyGkxrjvBRQ92H6vmwgXenMmxJrwfc2U%2FEOT80dk9lpNXg3dLQ3BKSON6An5gKez5wSKq7Gm%2BZmg7V3pG3sK%2FlbQ1qeDYpOvbZQHdJ%2BcuDCVWLF0HkYMcxoYNpu6FmPrnFWqpTQn2ZFpL4p8KUjNnXJOH778ifX58Sye0E0aqt6BV%2Bs%2F95ED1qf%2Bk5XBKH1bh6mY2rat%2F6s419F7gs2HoAvMRQCjm70fQpBWwmxK2E73MS1b%2FL%2BENft1KmYWmgCIOz2CxE%2FKFoRE7uxlCDZavyPMW5j2m0%2Bj8QX4wyR74QQ3lTIrkkBSKUaK85u9Tv82Zxs7HUpgi09h5p7QbDacVdqPiMIrbVzaIQISrXK4CFo3qdGJr2010XOATcwO3VYWCjk0aQHk2fRJNOI8ubUqzPu1epeg%2BjJok5%2B0LCPA4lnEduUS4MwqsvLxAY6pgHZuVnv1Jr3UB0yVxhFbEfaEEZZZ%2Bb%2BL9bbyX0G8K43em1Ay7JjHjSYgK%2F8HywtO2XUAYztDsFcPrJ6mhX4TeW7qmo6jTK7nKOekdm3Nv%2Fin8DxN7vYu6Qy6%2F37yiNXybaLIQ3bNA59nhTtVZlwKfeCotpzsNO5OSHtKMLcOyFKjw5eNM8qEF07uLGM5h2fPNDkBNFbtpV5UOaK1bWyQWh%2BDEb6%2BAlS&X-Amz-Signature=c40ce1405b0efaa3f374b91c8319e6c8dbbd22995b7dcfc28c993da34a309019&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

你可以直接在 `~/.zshrc` 中启用该插件：

```bash
plugins=(z)
```

### autojump

[autojump](https://github.com/wting/autojump) 是一个与 z 类似的一个自动跳转工具，但依赖 python，且需要通过 brew 额外进行安装。我个人觉得 z 就已经够用了。如果你不介意系统上多一个 python 的依赖，可以考虑使用这个插件。

```bash
brew install autojump
```

安装完毕后，在 `~/.zshrc` 中开启该插件：

```bash
plugins=(autojump)
```

### zsh-autosuggestions

[https://github.com/zsh-users/zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) 插件可以提供一些自动补全建议。

![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/e8c08493-cc95-48e6-8571-0810dd04cd3c/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T3B6IN42%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061656Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCIBD8t533OMLTBnMccOk7iaTsJRgYpMpbY1KITFAFH7CQAiB7A%2Fm2Khbn5bdNw537y3KPdcSKClJwq3nuS0oQnz2BnSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMN5sD5gXl2%2FUhHbXyKtwD5R66qt45KoWa%2BfIWsIC3twXtqAutUeJl3sG6ttPp7X7%2BYc7F68FfRUGM8hX%2FxCcKfQiQd1CGaovrFw36FdZgZKqGgPIne%2F0IpXkNR7LMbyo1j6nd13QVJlhSm1p5wSYwvoDIBNHdo%2F4yfJD1%2BWCYCh6W3l5hVVMy%2BAbzPvLD2xc4vZl6yIHskS%2FjWiOxFgzCc%2B3GRXbr%2BGyGkxrjvBRQ92H6vmwgXenMmxJrwfc2U%2FEOT80dk9lpNXg3dLQ3BKSON6An5gKez5wSKq7Gm%2BZmg7V3pG3sK%2FlbQ1qeDYpOvbZQHdJ%2BcuDCVWLF0HkYMcxoYNpu6FmPrnFWqpTQn2ZFpL4p8KUjNnXJOH778ifX58Sye0E0aqt6BV%2Bs%2F95ED1qf%2Bk5XBKH1bh6mY2rat%2F6s419F7gs2HoAvMRQCjm70fQpBWwmxK2E73MS1b%2FL%2BENft1KmYWmgCIOz2CxE%2FKFoRE7uxlCDZavyPMW5j2m0%2Bj8QX4wyR74QQ3lTIrkkBSKUaK85u9Tv82Zxs7HUpgi09h5p7QbDacVdqPiMIrbVzaIQISrXK4CFo3qdGJr2010XOATcwO3VYWCjk0aQHk2fRJNOI8ubUqzPu1epeg%2BjJok5%2B0LCPA4lnEduUS4MwqsvLxAY6pgHZuVnv1Jr3UB0yVxhFbEfaEEZZZ%2Bb%2BL9bbyX0G8K43em1Ay7JjHjSYgK%2F8HywtO2XUAYztDsFcPrJ6mhX4TeW7qmo6jTK7nKOekdm3Nv%2Fin8DxN7vYu6Qy6%2F37yiNXybaLIQ3bNA59nhTtVZlwKfeCotpzsNO5OSHtKMLcOyFKjw5eNM8qEF07uLGM5h2fPNDkBNFbtpV5UOaK1bWyQWh%2BDEb6%2BAlS&X-Amz-Signature=a1ca2b6563a6bda7660a5a23f7050a9c4452d9e2d85fa413081e14df5c480f17&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

使用 oh-my-zsh 插件方式安装，并在 `~/.zshrc` 中启用该插件：

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

```bash
plugins=(zsh-autosuggestions)
```

### zsh-syntax-highlighting

[https://github.com/zsh-users/zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) 插件可以让命令高亮显示，如果出现语法错误会直接显示为红色。

![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/b27e3ec9-ef10-473d-93c4-5c2e455998fb/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T3B6IN42%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061656Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCIBD8t533OMLTBnMccOk7iaTsJRgYpMpbY1KITFAFH7CQAiB7A%2Fm2Khbn5bdNw537y3KPdcSKClJwq3nuS0oQnz2BnSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMN5sD5gXl2%2FUhHbXyKtwD5R66qt45KoWa%2BfIWsIC3twXtqAutUeJl3sG6ttPp7X7%2BYc7F68FfRUGM8hX%2FxCcKfQiQd1CGaovrFw36FdZgZKqGgPIne%2F0IpXkNR7LMbyo1j6nd13QVJlhSm1p5wSYwvoDIBNHdo%2F4yfJD1%2BWCYCh6W3l5hVVMy%2BAbzPvLD2xc4vZl6yIHskS%2FjWiOxFgzCc%2B3GRXbr%2BGyGkxrjvBRQ92H6vmwgXenMmxJrwfc2U%2FEOT80dk9lpNXg3dLQ3BKSON6An5gKez5wSKq7Gm%2BZmg7V3pG3sK%2FlbQ1qeDYpOvbZQHdJ%2BcuDCVWLF0HkYMcxoYNpu6FmPrnFWqpTQn2ZFpL4p8KUjNnXJOH778ifX58Sye0E0aqt6BV%2Bs%2F95ED1qf%2Bk5XBKH1bh6mY2rat%2F6s419F7gs2HoAvMRQCjm70fQpBWwmxK2E73MS1b%2FL%2BENft1KmYWmgCIOz2CxE%2FKFoRE7uxlCDZavyPMW5j2m0%2Bj8QX4wyR74QQ3lTIrkkBSKUaK85u9Tv82Zxs7HUpgi09h5p7QbDacVdqPiMIrbVzaIQISrXK4CFo3qdGJr2010XOATcwO3VYWCjk0aQHk2fRJNOI8ubUqzPu1epeg%2BjJok5%2B0LCPA4lnEduUS4MwqsvLxAY6pgHZuVnv1Jr3UB0yVxhFbEfaEEZZZ%2Bb%2BL9bbyX0G8K43em1Ay7JjHjSYgK%2F8HywtO2XUAYztDsFcPrJ6mhX4TeW7qmo6jTK7nKOekdm3Nv%2Fin8DxN7vYu6Qy6%2F37yiNXybaLIQ3bNA59nhTtVZlwKfeCotpzsNO5OSHtKMLcOyFKjw5eNM8qEF07uLGM5h2fPNDkBNFbtpV5UOaK1bWyQWh%2BDEb6%2BAlS&X-Amz-Signature=4d9a29669cd0b7902b9af406a550afe9d26f81c8219c451a38688bf145b830df&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

使用 oh-my-zsh 插件方式安装，并在 `~/.zshrc` 中启用该插件：

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

```bash
plugins=(zsh-syntax-highlighting)
```

### themes

[themes](https://github.com/ohmyzsh/ohmyzsh/blob/master/plugins/themes/README.md) 是一个 oh-my-zsh 内建插件，用来快速切换 oh-my-zsh 主题。在 `~/.zshrc` 中启用即可。

```bash
plugins=(themes)
```

### thefuck

虽然 thefuck 并不属于 ohmyzsh 生态，但我觉得还是很有必要安利一波的。

[https://github.com/nvbn/thefuck](https://github.com/nvbn/thefuck) 是一个可以帮你快速纠错命令的工具，当你打错命令了，直接敲一个 fuck，它就会帮你快速纠正。

![Untitled.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/699e562e-73e1-4d3b-90f8-7b1df33dd1bf/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T3B6IN42%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061656Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCIBD8t533OMLTBnMccOk7iaTsJRgYpMpbY1KITFAFH7CQAiB7A%2Fm2Khbn5bdNw537y3KPdcSKClJwq3nuS0oQnz2BnSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMN5sD5gXl2%2FUhHbXyKtwD5R66qt45KoWa%2BfIWsIC3twXtqAutUeJl3sG6ttPp7X7%2BYc7F68FfRUGM8hX%2FxCcKfQiQd1CGaovrFw36FdZgZKqGgPIne%2F0IpXkNR7LMbyo1j6nd13QVJlhSm1p5wSYwvoDIBNHdo%2F4yfJD1%2BWCYCh6W3l5hVVMy%2BAbzPvLD2xc4vZl6yIHskS%2FjWiOxFgzCc%2B3GRXbr%2BGyGkxrjvBRQ92H6vmwgXenMmxJrwfc2U%2FEOT80dk9lpNXg3dLQ3BKSON6An5gKez5wSKq7Gm%2BZmg7V3pG3sK%2FlbQ1qeDYpOvbZQHdJ%2BcuDCVWLF0HkYMcxoYNpu6FmPrnFWqpTQn2ZFpL4p8KUjNnXJOH778ifX58Sye0E0aqt6BV%2Bs%2F95ED1qf%2Bk5XBKH1bh6mY2rat%2F6s419F7gs2HoAvMRQCjm70fQpBWwmxK2E73MS1b%2FL%2BENft1KmYWmgCIOz2CxE%2FKFoRE7uxlCDZavyPMW5j2m0%2Bj8QX4wyR74QQ3lTIrkkBSKUaK85u9Tv82Zxs7HUpgi09h5p7QbDacVdqPiMIrbVzaIQISrXK4CFo3qdGJr2010XOATcwO3VYWCjk0aQHk2fRJNOI8ubUqzPu1epeg%2BjJok5%2B0LCPA4lnEduUS4MwqsvLxAY6pgHZuVnv1Jr3UB0yVxhFbEfaEEZZZ%2Bb%2BL9bbyX0G8K43em1Ay7JjHjSYgK%2F8HywtO2XUAYztDsFcPrJ6mhX4TeW7qmo6jTK7nKOekdm3Nv%2Fin8DxN7vYu6Qy6%2F37yiNXybaLIQ3bNA59nhTtVZlwKfeCotpzsNO5OSHtKMLcOyFKjw5eNM8qEF07uLGM5h2fPNDkBNFbtpV5UOaK1bWyQWh%2BDEb6%2BAlS&X-Amz-Signature=afb74e66c1e365ce44b3a581c704cccc635ebeeeb0e56e84298f0034df203a70&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

```bash
# macos 下安装
brew install thefuck

# ubuntu 下安装
sudo apt install -y thefuck
```

在 `~/.zshrc` 中启用：

```bash
eval $(thefuck --alias)
```
