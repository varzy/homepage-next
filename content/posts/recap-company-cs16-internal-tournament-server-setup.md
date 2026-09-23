---
title: '回顾公司的 CS1.6 内部赛：服务器架设'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['游戏人生', 'Windows']
date: '2026-09-23'
slug: 'recap-company-cs16-internal-tournament-server-setup'
summary: '上一篇聊完了我们是怎么把比赛现场播出去的，这一篇来聊聊怎么玩起来。'
last_edited_time: '2026-09-23T09:27:00.000Z'
last_fetched_time: '2026-09-23T09:28:14.864Z'
page_id: '3e2dc9c0-364a-809a-ab43-c22c54274ccf'
icon: '⛸️'
---

上一篇 [回顾公司的 CS1.6 内部赛：直播方案](https://varzy.me/posts/recap-company-cs16-internal-tournament-live-streaming-plan) 聊完了我们是怎么把比赛现场播出去的，这一篇来聊聊怎么玩起来。

## 获取服务器文件

CS1.6 的安装目录中有 hlds.exe 和 hltv.exe 两个应用。通过前者可以启动半条命或 CS1.6 服务器，同局域网的玩家即可在游戏中发现该房间，和在游戏创建房间的效果是一致的。hlds.exe 也可以通过命令行方式启动。

![a33586be19a39d16.png](https://cdn.varzy.me/public/2026/09/posts/3e2dc9c0-364a-809a-ab43-c22c54274ccf/a33586be19a39d16.png)

hltv.exe 则是专门的转播代理服务，它最大的作用就是设置延迟。如果需要设置线下观赛区或导播，那么至少需要将游戏画面实时延迟 10s 以上，保证不会让选手瞄到实时画面。如果没有线下转播的需求则无需开启 hltv。

但很遗憾，从 Steam 购买的正版 CS1.6 目录下，不管是直接双击还是使用命令行打开 hlds 一直会报 C++ 依赖库的错误弹窗，因此我不得不转向使用 steamcmd 获取干净的、独立的 CS1.6 服务器。需要注意的是，即使使用 SteamCMD 获取了干净的服务器，打开 hlds 时依旧可能报错，但对比官方客户端的 100% 报错至少有所改善。后续通过在脚本中添加容错机制间接绕过了报错，但背后的原因暂时没有时间深究。

SteamCMD 是 Valve 官方推出的 Steam 客户端命令行版本，其中的一项功能就是搭建游戏服务器。首先下载 [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD)，我们采用的平台是 Windows，后续都以 Winodws 版本为例。下载并解压 SteamCMD 后，执行以下命令以获取 CS1.6 服务器文件：

```powershell
steamcmd +force_install_dir C:\Softwares\cs16server ^
         +login anonymous ^
         +app_set_config 90 mod cstrike ^
         +app_update 90 validate ^
         +quit
```

`app 90` 即 Half-Life 专用服务器，`app_set_config 90 mod cstrike` 指安装 cstrike 这个 mod，否则下载下来的会是纯半条命服务器。下载完毕后，强烈建议对 `C:\Softwares\cs16server` 目录做一次备份，后续改坏了可以直接恢复，省得再去下载一遍。

## 启动服务

就像上文说的，如果没有复杂的定制需求，此时就可以双击 hlds.exe 通过 GUI 方式打开了，修改房间名称和地图后即可启动。如果你想进阶一点，可以使用命令行启动 hlds，这是一个比较典型的示例：

```bash
hlds.exe -game cstrike -port 27015 -console -insecure +map de_dust2 +maxplayers 12 +sv_lan 1
```

- `-game cstrike`，启动 CS1.6 服务器而非半条命服务器
- `-port 27015`，局域网端口号，27015 是默认端口
- `-console`，以控制台模式启动
- `-insecure`，关闭 Valve 的反作弊模块
- `+map de_dust2`，选择地图
- `+maxplayers 12`，最大玩家数量（含观赛者），默认值 32
- `+sv_lan 1`，传 0 是互联网服务器，传 1 是局域网服务器

除了命令行参数，更多的游戏配置是在 `<服务端目录>\cstrike\server.cfg` 中维护的，例如房间名称、C4 炸弹倒计时时间、友军伤害…… 本文就不详细解释配置项了，我的建议是，你直接把需求描述给 AI，让他帮你生成 server.cfg 配置。这里也有一份我生成的亲测可用的 [配置](https://gist.github.com/varzy/07d23af2265f4855559ef9b2a8696f50)，仅供参考。

hltv.exe 同样支持双击打开或通过命令行启动。

```bash
hltv.exe +connect 127.0.0.1:27015 +port 27020 +delay 10 +name "HLTV-OB"
```

- `+connect 127.0.0.1:27015`，连接至哪个服务器
- `+port 27020`，hltv 创建的观赛房间的端口
- `+delay 10`，比起实时画面延迟多久，默认 30s
- `+name "HLTV-OB"`，观赛房间的名称

![2bab9b2d42960faf.png](https://cdn.varzy.me/public/2026/09/posts/3e2dc9c0-364a-809a-ab43-c22c54274ccf/2bab9b2d42960faf.png)

## DeathMatch 模式

至此，我们已经可以启动原版的房间了。不过对于我们的内部比赛来说，希望游玩节奏更快的死亡竞赛模式，这是一个死亡后立即复活、随意购买武器、通过设定击杀数结束比赛的游戏模式。我们的需求有以下几个：死亡后立即复活；随意购买武器；击杀数达到 100 后结束本局；随机出生点。

经过一系列调研过程，想要实现死亡竞赛模式有两种方案。一是基于至今还在维护的 ReGameDLL_CS，稳定，简单，但无法实现随机出生点。二是基于 Metamod + AMXModX + CSDM + 第三方定制地图，复杂，部分插件早已停止维护，但可以实现随机出生点。

**省流：我调研并跑通了方案一，但由于强需求随机出生点，我们直接从网上买了个整合包，又用 AI 把方案一生成好的配置迁移到了整合包中，最终完美运行。**

### 方案一：ReGameDLL_CS

[ReGameDLL_CS](https://rehlds.dev/zh-Hans/docs/regamedll-cs/) 是一个基于原版逆向重构的游戏逻辑模块，修复了一系列 Bug，引入了机器人、死亡竞赛等机制，而且实施起来非常简单，只需要下载该 dll 并覆盖 `cstrike\dlls\mp.dll` 即可。

ReGameDLL_CS 读取 `cstrike\game.cfg` 配置文件，完整的配置见官方文档的 [Configuration and commands](https://rehlds.dev/docs/regamedll-cs/settings/)，核心配置项如下：

```bash
mp_forcerespawn 2  // 死亡 N 秒后自动复活
mp_roundrespawn_time -1  // 回合开始超过 N 秒后禁止复活，-1 = 无限制
mp_round_infinite 1  // 屏蔽回合
mp_freezetime 0  // 取消开局等待时间
mp_startmoney 16000  // 开局满钱
mp_buy_anywhere 1  // 随意地点买枪
mp_buytime -1  // 随时买枪
```

请注意，基于 ReGameDLL_CS 定制的服务器有两个缺陷：

1. `game.cfg` 中的配置会在切换地图后失效。这是因为服务器每次换图时都会重新跑一遍 `server.cfg`，其中的部分默认配置会再次覆盖 `game.cfg` 导致配置失效。我们的解决方案是编写脚本，将 `game.cfg` 中的配置直接放到 `server.cfg` 中，同时确保 `game.cfg` 文件不存在
2. 如上文所述，无法实现随机出生点

📢 在调研和定制过程中，我全部采用编写脚本的方式而非直接修改配置文件，包含但不限于一键安装 ReGameDLL_CS、一键启动原版、一键启动 DM 模式等诸多功能。脚本已开源： [varzy/cs16server-scripts](https://github.com/varzy/cs16server-scripts)。

### 方案二：Metamod + AMXModX + CSDM

我并没有从头跑起来这个方案。我对这些插件实在不熟，再加上距离比赛的时间所剩无几，因此决定再去找找整合包。所谓能用钱解决的问题都不是问题，同事帮我在闲鱼直接买了个可用的死亡竞赛模式整合包，但魔改得有些过分，甚至击杀后还会弹一个死亡徽章，愣是跟 CF 差不多了。

我的解决方案是直接把这个整合包和定制脚本全部扔进 VSCode，打开对话框，Claude Opus 5！就决定是你了！最终的效果是非常好的，Claude 帮我关掉了大部分没用的插件，并且维持了我们原本想要的配置。至此，我们得到了用于比赛的最终版本。

该整合包并非我们自行定制，因此本文就不放出了。如果你有需求的话，同样可以尝试找一个整合包，借助 AI 来自行定制。

## 一些坑

本次 CS1.6 内部赛取得了相当圆满的结果，参赛的朋友也都玩得很开心，不过整个过程中还是遇到了一些坑。

1. 最常见的问题可能就是进入游戏后找不到房间了。请确保比赛机和 CS1.6 服务器的机器都开启了「专用网络」，同时，请确保 hlds 启动过程中不要添加 `-ip 0.0.0.0` 参数，否则客户端只能通过 `connect` 命令手动加入房间
2. CS1.6 服务器的完整路径中一定不要包含中文、空格等字符
3. 在使用 SteamCMD 拉取原版服务器时，可能会遇到文件下载不全的问题，请务必多执行几次，确保看到下载成功的提示
4. 死亡竞赛模式下优先选用 fy_iceworld 等小型地图。不要选用 de_dust2 这样有炸弹的地图，不然隔一会就会 Booooom 一声💣

最后，我本人毕竟是一个没有经历过 CS1.6 时代的「新生代玩家」，文中很多方案都是配合 AI 一步步试出来的，很多配置项以及 CS1.6 客户端的 Bug 我到现在都琢磨不明白。如果文中有不正确的地方欢迎交流和斧正。
