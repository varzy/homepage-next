---
title: '修复 Windows 任务栏图标异常'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Windows']
date: '2020-03-27'
slug: 'windows-taskbar-icons-abnormal'
summary: ''
last_edited_time: '2025-09-02T09:33:00.000Z'
blog_last_fetched_time: '2025-09-02T09:41:16.327Z'
notion_id: '09875fbe-6e3d-491e-9752-00c0a349d276'
icon: '🎖️'
---

[Rebuild_Icon_Cache.bat](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/47787731-78b3-4555-b702-282b8b73b881/Rebuild_Icon_Cache.bat?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466T2DGLWF2%2F20250902%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250902T094115Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEML%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIEe2Yq5lFV1R9Zf6jLXN%2FiIxlQiMT6iaurGk9KSAILD4AiBOGJET85P2PWFLWqbHWhs2S2SCxjK2MBO6%2B93gDqhlKir%2FAwgqEAAaDDYzNzQyMzE4MzgwNSIMNX6I4HLwnZs3olCiKtwDslvQ8pYW1k9FoCO8wratGdjD3U885bWXglHZ7Pp%2BSjFnLSwBohTz8OowS%2BOnhftuAOxYCBQBGcrlYhK2u4Fg42Am2QmQHuX0WqZkVddf8Wu1FLB7QMHD4zzaOgBFDZBALhNZ2FISS8%2F80%2BVOwRI%2F22OtAcORaKBHF6SdmdI1JAM6JooKkycfq0QEWmLjaqXQEPLDwZukfUtxw1iJ4RngbTFrLNBoZz8mDEFOORQiI3uvq3d%2Bu3F7KrA1Y%2FuCBt2jjUva9PZYDbyDGwniMUVybMRR72uTun5f4%2BJZ9egd2eCZab87S9S6uUmV1Fk3PHN84oxoqMy6AefduUih%2F5hGSxREByguargDUqpPSd1JnZkzYqqUoYdKctAENgCoMRHzLZYx3WHHE64xK%2FB%2BSpnw7L%2FRr6jr2DzaIkqthLShkxTUvzl2gS6CtjtgKJOJNU%2FEfHm1N9%2Fu3VZ%2B8wkSfONLF8dQfXpS6C5quhcUVRXexJGJNspkouEgtJFJC5c8zzbBSYJ3670T3TsStuzFyEzDaQHn4O2feFlQ5kkf0%2BP%2BGaPkJfvEF5vcfZkIC9C1PNBYujNWRaPrafAqyVj6ccMwraskgTbuaW2wpUhRMDZ6t8dCSeFprzvg05w6zgswse7axQY6pgE9jnFKgUqfSaQzuTyYTkNMzg%2BezUcaiTNtx%2BxlEFzGT2e%2FdMaL1PB8Sq45KsBRvcd%2Fe4pRXLXGll04DFNhwAzRt3Gq%2FrHY6J%2B3e15Qpm11kCvAzlf%2BlvnmUVIg%2FvtaJLBoG7ROGPRYmTeRjJhRvDCrZwXy4WFm%2FcIpzqWwwaUvYHCFzzRW94zEQkHsbcSZAN0tFbF5tfo2EEoAyfICwapNKwXy1Q0E&X-Amz-Signature=03a89e45955beb2b63bcdc53f789605d59a078cd7ed7b4b665ac555249b179c5&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

```bash
:: Created by: Shawn Brink
:: http://www.sevenforums.com
:: Tutorial:  http://www.sevenforums.com/tutorials/49819-icon-cache-rebuild.html

@echo off
set iconcache=%localappdata%\IconCache.db

echo The Explorer process must be killed to delete the Icon DB.
echo.
echo Please SAVE ALL OPEN WORK before continuing.
echo.
pause
echo.
If exist "%iconcache%" goto delID
echo.
echo Icon DB has already been deleted.
echo.
pause
exit /B

:delID
echo Attempting to delete Icon DB...
echo.
ie4uinit.exe -ClearIconCache
taskkill /IM explorer.exe /F
del "%iconcache%" /A
del "%localappdata%\Microsoft\Windows\Explorer\iconcache*" /A
echo.
echo Icon DB has been successfully deleted. Please "restart your PC" now to rebuild your icon cache.
echo.
start explorer.exe
pause
exit /B
```
