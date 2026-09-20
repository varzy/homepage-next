---
title: '修复 Windows 任务栏图标异常'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Windows']
date: '2020-03-27'
slug: 'windows-taskbar-icons-abnormal'
summary: ''
last_edited_time: '2026-08-18T14:55:00.000Z'
last_fetched_time: '2026-08-18T18:05:12.558Z'
page_id: '09875fbe-6e3d-491e-9752-00c0a349d276'
icon: '🎖️'
---

[Rebuild_Icon_Cache.bat](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/47787731-78b3-4555-b702-282b8b73b881/Rebuild_Icon_Cache.bat?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4664WTYW5FE%2F20260818%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260818T180511Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCEKy4US2hb2V3s%2F6AFqUUpe9k%2BotwpG0Psw7Xd9KIAFAIhAIN7lu6VKD76xEAcwckFhxA2VnMywKO7WxUwG8%2FbU%2BILKv8DCGEQABoMNjM3NDIzMTgzODA1IgxUGVqLWvoLQVFqSZ4q3AMTjLJUNl8jsSWyJ7OiHANnPlvBoWdT08m5l%2FTxZyfoy4G4mIu6g%2BIeotwawyskf1n4AqdooRV%2FdmFKatOsLZRP6O3kDZAd%2B%2FWtxsLSYNxJCuLMQJUNvem1jt04RhwbPqt%2B6gjZvsEKCboMWrDJxqadxpgeO1hESLLY1%2Fvj5to53oslCI6LuctbTmy8%2BN%2BRoHOW7BwX9CXPGpwZgVGxLNPPqWExw8A7u%2Ff9pTj%2BGUk%2F1exDO3exq8U6LyvjWBCaR0Tf%2BL8eQJGeTV1ULRgCG4ZbKLPAgC5oPw%2BgovyjhhINvKUNvkYV0E1wCO%2BN3fLW8dR%2FMmzcU2Gs5NbF%2FPgIkwFXXcspMJh9Ngm5KNRB%2FMxFkbi5WVVojETS4DWynKPnMK3TMH5XZWeT8mgadSiLMysIU%2FFG0KtzmeR82uZ1Ym%2BAmTSU1i6yEjQrmwJqmEArmjo7nZIvD%2Fr1UBbiKjW4BZeu9dVRkXDFqPstes9PUogARB4bK8IL07qEv2BgIUaStSoFCP0Z1LeuBP%2FlEgVFMmqecFTUh%2FjLDSR38pyoq06P%2FlWAM8PmM6kznxE3qbcGSMC99ziMBUcuIYxfJvI1QyL2PmJT4ug3aUWy8kc4Tm31Gh9hEeRusrjY0q9CMTCF%2FZHUBjqkAVwZ6i2RV4yu8EpoXURxSw5y5mxUeKyl7JaKQhEbQZlb2LM7pHQ0Ltz%2FySvixEfhunUKsTKYUUUKz9VA5fn5nopamTnYoYE%2Fa%2B5et67C1dE1IpXXbNZTpPTaTW%2Bhacc2XUdDSS5C4n%2F3w3EdCVdDtMOy26IyEARGUAwmiaredFQfPYbVitjV%2BIeiXNO5SqMvHsy16pqFwotmIpVhDx691%2BowbzRb&X-Amz-Signature=41045165e4beb3c02c443a0e839cf42a306828999b307bd0b4970d3d499c4e82&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
