---
title: '为 Lumen 框架添加 storage:link 命令'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['PHP', 'Laravel']
date: '2020-03-27'
slug: 'lumen-add-storage-link-command'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:31.844Z'
notion_id: '6d48cb75-3285-470c-b45b-2b235c0d4375'
icon: '🔖'
---

本质是将 Laravel 框架中的类复制到 Lumen 中，并进行注册。

bootstrap/app.php

```php
require_once __DIR__ . '/helpers/functions.php';
```

bootstrap/helpers/functions.php

```php
/**
 * 设置 public_path 方法
 */
if (!function_exists('public_path')) {
    /**
     * Return the path to public dir
     * @param null $path
     * @return string
     */
    function public_path($path = null)
    {
        return rtrim(app()->basePath('public/' . $path), '/');
    }
}
```

app/Console/Commands/StorageLinkCommand.php

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class StorageLinkCommand extends Command
{
    /**
     * The console command signature.
     *
     * @var string
     */
    protected $signature = 'storage:link';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a symbolic link from "public/storage" to "storage/app/public"';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 创建 storage 文件夹
        if (!file_exists(storage_path('app/public'))) {
            mkdir(storage_path('app/public'));
        }

        // 如果软链接已存在则不再创建
        if (file_exists(public_path('storage'))) {
            return $this->error('The "public/storage" directory already exists.');
        }

        // 创建软链接
        $this->laravel->make('files')->link(
            storage_path('app/public'), public_path('storage')
        );

        $this->info('The [public/storage] directory has been linked.');
    }
}
```
