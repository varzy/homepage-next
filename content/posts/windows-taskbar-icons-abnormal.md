---
title: '修复 Windows 任务栏图标异常'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Windows']
date: '2020-03-27'
slug: 'windows-taskbar-icons-abnormal'
summary: ''
last_edited_time: '2025-08-06T03:21:00.000Z'
blog_last_fetched_time: '2025-08-06T06:20:56.067Z'
notion_id: '09875fbe-6e3d-491e-9752-00c0a349d276'
icon: '🎖️'
---

[Rebuild_Icon_Cache.bat](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/47787731-78b3-4555-b702-282b8b73b881/Rebuild_Icon_Cache.bat?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SHX3MZZM%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T062055Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDYaCXVzLXdlc3QtMiJGMEQCICP8nMxflTIdkjorHJCorJJcSGl4MAjtcwm5n97vTYEyAiAVjV1LTjV48lo7nXJZD59Gxbw0Qbbcm0dKIPc3hfLOuSr%2FAwhuEAAaDDYzNzQyMzE4MzgwNSIMKk6nG5B52HhX0q0nKtwDx4oGj90zRvYMTCWfbOJGzvQ90w1eyue%2B%2Fl7ObgEWRXtr%2BKAQfv7njThtrVqyQLhf%2FxZGbqwt1aurN3jRayyz0UeP4N%2FHE%2FT9u4OOoOrFs90jhklXx3EWBfz8fvFcN%2Fvm7UajheRIh7cnSbqo6Nrx3E3pSfmhJ%2Bv4Q54iRvSp23Z1lKyCfpfpI%2B9%2FS%2FVq7CDbBwb%2Fcdw4riv3SgTxiJS1AB9iOJ%2FfpuduvklGC5FqO1yQcxTmzisUJHLzv5u9gJ9YQFn0S4BcVis3AvSs73yyKxBHOXNfBFNWrh5UvebOp8ifJ2U7p058GTvRqlc1faae9vZ2i1eMRB8%2BNPY24j6DQroujBD5%2Bf2UrvoptYBuKJrHp9ck9t4KCXxd1nMvCDsz9BcIQLOTU%2Bi%2FXFkF9W16VM5HRNVqfYO8Oi%2B6mCj9YuE%2BDh2DSaCUD2JJ3XemPNtcFJBEDS6EZu9AuDcMJFeGXrFCCC%2F8dvO0LesLsXunmj%2BaT4BnUZ8opJ04UCgv9ZUMhZ5EFpICtW%2FjTVL3zfPE%2BmsGwVGkfSe5Au2M4Rm0KwYlmiiMWx1oa0kR59AoJp5FVs%2Fun6uEf10Pof8Vsiff5ozYOJDt3BEMoJIfuNLdx4qUpr4TJjz%2FIJgl4c0wgcvLxAY6pgGEX8QAIsCqyic%2BM0W2ORLcOvx5VRe2%2Fd07GQVvkr9n7IcrscL54FHN%2FNbkUfrCt4AjAQPUWBuEZYOzOU0hj%2BIQA1FSb4bU4tQu7Qn4JAhHKpJhXuIaoO4Jvf20AgPkRbMe94yHOM5nsu5v7wHLqkQEobP8em4S%2B%2F%2F28i9vcMoNQ2m5dg1A7Fn0roqu3UZvlcSHIR4Aw6vh9Fri4LrD%2Fx2mh9%2FZsi0Z&X-Amz-Signature=95d7c4afcc83dac0425a05efef07969935e9f2badbbf6784f2c7f1d416d2f987&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
