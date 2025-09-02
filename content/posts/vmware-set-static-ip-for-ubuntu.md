---
title: 'VMware 下给 Ubuntu 18.04 设置静态 IP'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Linux']
date: '2020-03-27'
slug: 'vmware-set-static-ip-for-ubuntu'
summary: ''
last_edited_time: '2025-08-06T06:19:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:04.338Z'
notion_id: 'd3dfd778-7e0f-4072-8cb7-b77c47e573c4'
icon: '✒️'
---

参考文章:

- [https://www.jianshu.com/p/f5882291eb29](https://www.jianshu.com/p/f5882291eb29)
- [http://ivo-wang.github.io/2019/03/26/Ubuntu-18.04-lts-修改静态ip/](http://ivo-wang.github.io/2019/03/26/Ubuntu-18.04-lts-%E4%BF%AE%E6%94%B9%E9%9D%99%E6%80%81ip/)

## 配置 VMware 网络

1. 编辑 -> 虚拟网络编辑器
2. 选中 `VMnet8`
3. 点击右下角`更改设置`
4. 去勾 `使用本地 DHCP 服务将 IP 地址分配给虚拟机`
5. 编辑子网 IP，最后一位数字应该为 0。如 `192.168.63.0`
6. 点击 `NAT 设置`，编辑网关 IP。如 `192.168.63.2`

## 设置宿主机网卡信息

1. 控制面板 -> 网络和 Internet -> 网络和共享中心 -> 更改适配器设置
2. 右键 `VMnet8`，打开属性
3. 双击 `Internet 协议版本 4 (TCP/IPv4)`
4. 填入与 VMware 同一网段下的不同 IP。如 `192.168.63.1`
5. 填入子网掩码。`255.255.255.0`
6. 填入默认网关，与 VMware 保持一直。如 `192.168.63.2`
7. 填入 DNS。如 `114.114.114.114`, `114.114.114.115`

## Ubuntu 配置

```bash
sudo cp /etc/netplan/50-cloud-init.yaml /etc/netplan/50-cloud-init.yaml.bak
sudo vim /etc/netplan/50-cloud-init.yaml
```

```plain text
network:
    ethernets:
        ens33:
            # ip 地址填入和子网 ip、宿主机 ip 均不一致的 ip 地址
            addresses: [192.168.63.10/24]
                gateway4: 192.168.63.2
                dhcp4: no
                nameservers:
                    # 或者直接填入 DNS 地址。如: [114.114.114.114, 114.114.114.115]
                    addresses: [192.168.63.2]
    version: 2
```

```bash
sudo netplan apply
```
