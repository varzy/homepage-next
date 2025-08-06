---
title: 'Mac 开发环境搭建 (22.06.27 修订版)'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['MacOS', 'DevEnv']
date: '2021-04-04'
slug: 'macos-development-env'
summary: ''
last_edited_time: '2025-08-06T03:17:00.000Z'
blog_last_fetched_time: '2025-08-06T06:17:58.389Z'
notion_id: '2229b3c2-4be6-42b2-a382-fde89af3ec34'
icon: '💻'
---

> 😉 这里用来记录我在 Mac 下的开发环境搭建流程，基本都是自用。虽然我写过很多篇类似的文章，但是这应该是最后一篇了，如果没有特殊情况，我会一直在这一篇里持续更新。

## 几个原则

- 尽可能少得污染宿主机，能跑在 Docker 里的尽可能都跑在 Docker 里
- 尽可能不使用 Homebrew Cask，软件升级等解决方案并不优雅
- 尽可能不使用 Homebrew Serverice，个人体验下来感觉还挺经常出问题的

## 科学上网

这是一切的基石。我个人目前正在使用 [Surge](https://surge.sh/)。

## 终端

我个人习惯使用 iTerm2 + OhMyZsh。首先下载 [iTerm2](https://iterm2.com/)

### [iTerm2](https://iterm2.com/)

- 配置
  - 使用 Minimal 主题 (Apperance → General → Theme → Minimal)
  - 隐藏滚动条 (Apperance → Windows → Hide scrollbars)
  - 使用下划线光标 (Profiles → Default → Text → Underline)
- 主题
  - 可以在 [Iterm2-color-schemes](https://iterm2colorschemes.com/) 找到各种主题，目前钟爱 [Gruvbox Dark](https://github.com/mbadolato/iTerm2-Color-Schemes/blob/master/schemes/Gruvbox%20Dark.itermcolors)

### [ohmyzsh](https://ohmyz.sh/)

> 💡 关联阅读：[使用 ohmyzsh 提升终端使用体验](https://www.notion.so/332a9dfa723140af899e43639847c192)

配置文件是 `~/.zshrc`，所有的自定义配置都应该放在底部而非顶部。

### ohmyzsh 插件

安装 zsh-autosuggestions 和 zsh-syntax-highlighting

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

启用插件

```bash
plugins=(git z zsh-autosuggestions zsh-syntax-highlighting)
```

### 一键启停代理

在 `~/.zshrc` 底部添加：

```bash
export https_proxy="http://127.0.0.1:8888"
export http_proxy="http://127.0.0.1:8888"
export all_proxy="socks5://127.0.0.1:8889"
export no_proxy="localhost,127.0.0.1,::1"
alias proxy="export https_proxy=http://127.0.0.1:8888; export http_proxy=http://127.0.0.1:8888; export all_proxy=socks5://127.0.0.1:8889"
alias unproxy="unset https_proxy; unset http_proxy; unset all_proxy"
```

然后在终端中输入 `proxy` 和 `unproxy` 就可以一键启用和停止代理了。

> ⚠️ 你需要根据自己使用的代理软件更换地址和端口。

### 常用 Aliases

在终端底部添加一些常用的 aliases：

```bash
alias myip="curl myip.ipip.net"
alias lanip="ifconfig en0| grep \"inet[ ]\" | awk '{print \$2}'"
alias gboom="git init && git add . && git commit -m \"init\""
```

## Homebrew

安装包管理工具 [Homebrew](https://brew.sh/)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### ~~只是为了有趣~~

这些包都可以用 Homebrew 安装。

- sl：非常经典的小火车
- [lolcat](https://github.com/busyloop/lolcat)：让输出🌈起来
- [cowsay](https://github.com/tnalpgge/rank-amateur-cowsay)：包如其名，🐂 说
- [boxes](https://boxes.thomasjensen.com/)：和 cowsay 差不多
- fortune：输出一句话
- cmatrix：梦回黑客帝国

![D6oyemIjB7tkfA8.png](https://cdn.sa.net/2024/03/15/D6oyemIjB7tkfA8.png)

## 开发环境

### Git

MacOS 的 Xcode Command Line Tools 自带 Git，当我们执行 `xcode-select --install` 时就会自动安装。但系统自带的 Git 版本一般不是最新的，而且有时候系统升级后需要重新安装，所以最好还是通过 Homebrew 再安装一次。

```bash
brew install git
```

### Docker

- 方案一：使用 [Docker Desktop](https://www.docker.com/products/docker-desktop)。
- 方案二：使用 [Colima](https://github.com/abiosoft/colima)。

> 💡 关联阅读：[使用 Colima 替代 Docker Desktop](https://www.notion.so/a1f214cb8dfa4644ad8cc90e00b969ea)

目前我正在使用 Colima，更加轻便简单。

```bash
brew install docker docker-compose colima

mkdir -p ~/.docker/cli-plugins
ln -sfn /usr/local/opt/docker-compose/bin/docker-compose ~/.docker/cli-plugins/docker-compose

colima start --cpu 2 --memory 4 --mount-type 9p
```

拉取我自用的 Docker 开发环境 [DevOS](https://github.com/varzy/devos)：

```bash
mv .env.example .env
# 修改 .env 中的配置
docker compose up -d nginx mysql redis
```

### Node & NPM

- 方案一：直接使用 Homebrew 安装 Node (适用于不挑版本的用户)

如果我们只需要一个比较简单的 Node 环境，那么最简单的方案还是 Homebrew。如果你需要切换 node 版本，可以使用 `brew install node@x.x.x` 重新安装一个新版本的 Node。

```bash
brew install node
```

- 方案二：使用 n 模块管理 Node (适用于需要偶尔切换环境的用户)

```bash
# 安装初始的 node，用来得到 npm 命令
brew install node

# 安装 n 模块
sudo npm install -g n

# 使用 n 模块管理 node 版本，或切换 node 环境。详细用法见官方文档
sudo n stable
sudo n lts
sudo n 10.16.0
n run 8.11.3 --debug some.js
```

- **方案三：使用 nvm (个人正在使用的方案)**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装最新版本的 node
nvm install node
# 安装指定版本
nvm install 16.3.0
# 查看所有版本
nvm ls
# 在当前执行上下文使用某个版本
nvm use 16.3.0
# 设置某个版本为默认版本
nvm alias default 16.3.0
```

Nvm 安装完毕后将自动在 ~/.zshrc 中添加 nvm 的初始化脚本。

### Yarn

使用 NPM 安装 Yarn：

```bash
npm install -g yarn
yarn global add prettier pangu @vue/cli
```

> 🤔 如果我没记错的话，最早的时候 Yarn 是不推荐使用 NPM 来安装的，而是要通过独立的安装文件或者 Homebrew 来安装，结果到了现在 NPM 反而成了推荐的安装方式，真是风水轮流转。

如果通过 Yarn 全局安装的包无法找到，那么我们还需要把 Yarn 全局目录添加到 PATH 中。在 `~/.zshrc` 中添加：

```bash
export PATH="$PATH:`yarn global bin`"
```

### Java

从 [ADOPTIUM](https://adoptium.net/temurin/releases/) 选择适合的 OpenJDK 的 .tar.gz 压缩包并解压。

```shell
cd ~/Downloads
mv jdk-17* jdk-17
mkdir -p ~/Library/Java/JavaVirtualMachines
mv jdk-17 ~/Library/Java/JavaVirtualMachines/
```

接着在 `.zshrc` 中添加环境变量：

```shell
export JAVA_17_HOME="$Home/Library/Java/JavaVirtualMachines/jdk-17/Contents/Home"
export JAVA_HOME="$JAVA_17_HOME"
export PATH="$PATH:$JAVA_HOME/bin"
```

### ~~Maven~~

下载并解压 [Maven](https://maven.apache.org/download.cgi)。

```shell
mv ~/Downloads/apache-maven-3.8.4 ~/Library/Java/Maven/3.8.4
```

在 `.zshrc` 中添加环境变量：

```shell
export MAVEN_HOME=$HOME/Library/Java/Maven/3.8.4
export PATH=$PATH:$MAVEN_HOME/bin
```

### ~~Flutter，Android，iOS~~

下载并解压 [Flutter SDK](https://docs.flutter.dev/get-started/install/macos)。

```shell
unzip ~/Downloads/flutter_macos_2.10.1-stable.zip
mv flutter_macos_2.10.1-stable.zip ~/Library/Flutter/sdk
```

添加环境变量：

```shell
export FLUTTER_HOME=$HOME/Library/Flutter/sdk
export PATH="$PATH:$FLUTTER_HOME/bin"
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

下载 [Android Studio](https://developer.android.com/studio)，用来管理 Android SDK 及 Android 开发。

从 App Store 下载 XCode，进行 iOS 相关开发。

安装 CocoaPods。根据 [官方文档](https://guides.cocoapods.org/using/getting-started.html) 给出的方案，我们采用 Sudo-less 方案。首先添加 GEM 的环境变量：

```shell
export GEM_HOME=$HOME/.gem
export PATH=$GEM_HOME/bin:$PATH
```

执行 CocoaPods 安装命令：

```shell
gem install cocoapods --user-install
```

先通过 `gem which cocoapods` 确定 CocoaPods 的路径，接着添加环境变量：

```shell
export PATH=$PATH:$GEM_HOME/ruby/2.6.0/bin
```

至此，所有基础工作已经完成，可以使用 `flutter doctor` 命令查漏补缺。Flutter 的开发环境搭建虽然冗长但并不复杂，更多细节可以参考 [官方文档](https://docs.flutter.dev/get-started/install/macos)。

### ~~MySQL & Redis~~

> 💡 更新于 2021-11-27：已全面转向 Docker。相关笔记：[使用 Docker 托管一部分开发环境](https://www.notion.so/1f966285bf2146409e2411b81c8720a6)

<details>
<summary>之前使用的 Homebrew 方案</summary>

```bash
brew install mysql redis
brew services start mysql redis
```

</details>

### ~~PHP~~

> 💡 更新于 2021-11-27：PHP 的扛把子框架 Laravel 已经把开发环境全面转向了 Docker，目前我也推荐各位把不常用的开发环境迁移到 Docker 上。

由于我不是正儿八经的 PHPer，对于 PHP 环境的要求基本就是能跑就成，因此我选用了简单小巧的 [Valet](https://laravel.com/docs/8.x/valet)。

```bash
brew install php
brew install composer
```

和 Yarn 一样，你也需要保证 Compoer 的全局目录在 PATH 中。在 `~/.zshrc` 中添加：

```bash
export PATH="$PATH:$HOME/.composer/vendor/bin"
```

接着安装并启动 Valet。注意：Valet 会默认通过 Homebrew 安装 Nginx 和 DnsMasq，如果你在安装 Valet 之前已经通过**非 Homebrew 方式**安装了 Nginx 和 DnsMasq，那么建议先卸载之以免造成冲突。

```text
composer global require laravel/valet
valet start
```

发布 Valet 站点，并进行验证：

```bash
# 你可以选择任何你想设为根站点的目录，此处使用 ~/Developer/Sites
mkdir -p ~/Developer/Sites
cd ~/Developer/Sites
valet park
mkdir phpinfo
cd phpinfo
echo "<?php phpinfo();" > index.php
```

在浏览器中输入 `http://phpinfo.test`，如果能看到熟悉的 phpinfo 信息，就说明 Valet 搭建成功了。

> 💡 多说一句：曾经我也在 Windows 上做 PHP 开发，找了很多方案，但最后让我觉得最接近完美的方案是 [Laragon](https://laragon.org/)。

## 编辑器

### [**VSCode**](https://code.visualstudio.com/)

我使用 VSCode 浏览代码以及小修小补。

<details>
<summary>`配置文件`</summary>

```json
{
  "editor.cursorBlinking": "phase",
  "editor.cursorStyle": "underline",
  "editor.fontFamily": "'Jetbrains Mono', 'Microsoft YaHei', 'Operator Mono Lig', 'Source Code Pro', 'Fira Code', Monaco, Menlo, 'Courier New', monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 13,
  "editor.largeFileOptimizations": false,
  "editor.rulers": [80, 100],
  "editor.smoothScrolling": true,
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "emmet.triggerExpansionOnTab": true,
  "explorer.compactFolders": false,
  "explorer.confirmDelete": false,
  "explorer.confirmDragAndDrop": false,
  "explorer.openEditors.visible": 0,
  "extensions.ignoreRecommendations": false,
  "files.associations": {
    "*.wxml": "xml",
    "*.wxss": "css"
  },
  "files.autoSave": "onFocusChange",
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  "terminal.integrated.tabs.enabled": true,
  "vetur.format.defaultFormatter.html": "prettier",
  "window.restoreWindows": "none",
  "workbench.colorCustomizations": {
    "editorCursor.foreground": "#bf616a",
    "[GitHub Light]": {
      "editor.background": "#f6f8fa"
    },
    "[GitHub Light Default]": {
      "editor.background": "#f6f8fa"
    },
    "[Night Owl Light (No Italics)]": {
      "editor.background": "#f6f6f6"
    }
  },
  "workbench.iconTheme": "material-icon-theme",
  "workbench.editor.untitled.hint": "hidden",
  "editor.minimap.showSlider": "always",
  "editor.minimap.maxColumn": 100,
  "files.exclude": {
    "**/.classpath": true,
    "**/.project": true,
    "**/.settings": true,
    "**/.factorypath": true
  },
  "editor.suggestSelection": "first",
  "redhat.telemetry.enabled": true,
  "editor.inlineSuggest.enabled": true,
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "plaintext": false,
    "markdown": true
  },
  "editor.bracketPairColorization.enabled": true,
  "javascript.inlayHints.parameterNames.enabled": "literals",
  "typescript.inlayHints.parameterNames.enabled": "literals",
  "editor.suggest.preview": true,
  "editor.guides.bracketPairs": true,
  "security.workspace.trust.untrustedFiles": "open",
  "terminal.external.windowsExec": "C:\\Users\\varzy\\Applications\\Git\\bin\\bash.exe",
  "terminal.integrated.profiles.windows": {
    "GitBash": {
      "path": "C:\\Users\\varzy\\Applications\\Git\\bin\\bash.exe"
    }
  },
  "terminal.integrated.defaultProfile.windows": "GitBash",
  "terminal.integrated.fontSize": 12,
  "workbench.preferredDarkColorTheme": "GitHub Dark",
  "workbench.preferredLightColorTheme": "GitHub Light Default",
  "code-runner.runInTerminal": true,
  "workbench.colorTheme": "GitHub Light Default",
  "editor.unicodeHighlight.nonBasicASCII": false,
  "diffEditor.ignoreTrimWhitespace": false,
  "window.autoDetectColorScheme": true,
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

</details>

<details>
<summary>`插件`</summary>
- Code Runner
- Code Spell Checker
- Dart
- Docker
- DotENV
- EditorConfig for VS Code
- ESLint
- Git Blame
- Git History
- GO
- Gruvbox Theme
- Material Icon Theme
- npm
- Prettier
- VSCode Remote
- Vetur
- Vue Language Features (Volar)
- YAML

</details>

<details>
<summary>`推荐主题`</summary>
- GitHub Theme
- One Monokai Theme
- One Dark Pro

</details>

支持在终端中使用 `code .` 命令直接使用 VSC 打开当前文件夹。在 VSC 中按下 `⌘ + ⇧ + P` 呼出 Command Palette，搜索 `code`，执行 `Install code command in PATH`。

![PlcsDViG5foh9FQ.png](https://cdn.sa.net/2024/03/15/PlcsDViG5foh9FQ.png)

### IDEA

我使用 IntelliJ IDEA 编写一切大型工程。

JetBrains 家的 IDE 已经非常强大了，各种功能整合得很好，几乎不需要做什么定制，插件我也是添加了寥寥数个而已 (甚至大部分插件都被我禁用掉了)。

虽然主要做前端开发，但偶尔也会写一些 Node、Java、PHP，比起每种语言安装单独的 IDE，我目前选择只安装 IDEA + 各种语言插件，这样可以免去各种 IDE 之间的不统一。

- 插件
  - nyan process bar
  - .env files support
  - prettier
  - rainbow brackets
  - string manipulation
  - .ignore
- 设置
  - 开启自动切换主题：`Appearance & Behavior` > `Theme` > 勾选 `Sync with OS`，并在齿轮图标的菜单里分别选择亮色和暗色主题
  - 关闭自动打开上一个项目：`Appearance & Behavior` > `System Settings` > `Project` > 去勾 Reopen projects on startup
  - 设置默认目录：`Appearance & Behavior` > `System Settings` > `Default project directory`
  - 代码补全不区分大小写：`Editor` > `General` > `Code Completion` > `All letters`
  - 设置 Prettier 作为代码格式化工具：`Languages & Frameworks` > `JavaScript` > `Prettier` > 勾选 `On ‘Reformat Code’ action`
  - 启动连字：`Editor` > `Font` > 勾选 `Enable ligatures`
  - 设置虚拟引导线：`Editor` > `Code Style` > `Visual guides` > `80, 100`
  - 启用 Node 的 Coding 助手：`Languages & Frameworks` > `Node.js` > 勾选 `Coding assistance for Node.js`

### 字体，输入法，其他

- 编程字体：目前全面使用 [JetBrains Mono](https://www.jetbrains.com/lp/mono/)。我是个很严重的选择困难症，选用这个字体也主要是因为既然都 JetBrians 全家桶了，不如一条道走到黑。Plus，这款字体的连字效果非常优秀
- 终端字体：iTerm2 默认字体 Monaco。这个字体比较饱满，偏大，还是很适合在终端里使用的
- 输入法：系统自带输入，微软双拼方案。双拼真的算是毕业后代码知识以外收益最高的技能了

## Q & A

### 代码、项目、工程应该放到哪里？

`~/Developer` 文件夹。为什么叫这个名字？看图。

![OArmP4RXijpEH1Z.png](https://cdn.sa.net/2024/03/15/OArmP4RXijpEH1Z.png)
