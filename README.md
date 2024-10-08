# Preview SVG In VSCode

在 VSCode 中预览 SVG 文件、SVG 代码片段。

## Features

支持 `svg` 文件、`tsx` 文件的以下预览功能：

+ 菜单栏—预览 svg 文件
+ 菜单栏—预览鼠标聚焦的 svg 内容
+ 悬浮预览光标聚焦的 svg

## Commands

+ `Preview SVG File`: 在新窗口中预览 svg 文件
+ `Preview Active SVG`: 在新窗口中预览光标聚焦的 svg 内容

## Usage

1. 安装插件

2. 打开 `svg` 或 `tsx` 文件

3. 预览

   1. 右键菜单预览

      ![menus.png](./public/menus.png)

      ![menus.png](./public/webview.png)

   2. 悬浮预览

      ![hover.png](./public/hover.png)

## Release Notes

### 0.0.1

2024-09-09 发布基本功能

- 支持 `svg` 文件、`tsx` 文件的以下预览功能：
  + 菜单栏—预览 svg 文件
  + 菜单栏—预览鼠标聚焦的 svg 内容
  + 悬浮预览光标聚焦的 svg

### 0.0.2

2024-09-09 更新插件LOGO

### 0.0.3

2024-09-12 优化插件功能及性能

#### 优化
- 将悬浮预览改为聚焦并悬浮，提升性能
- `webview` 预览改为侧边栏预览，提高便利性
- `webview` 预览时可设置背景色并缩放，提高可用性
- 仅在 `tsx`、`xml` 文件中注册悬浮预览事件，提升性能
- 将右键菜单中预览选中的 svg 改为预览聚焦的 svg，提升便利性
- 将部分驼峰式的属性转为标准属性，提高兼容性

#### 修复
- fix: 向上找时如果先找到结束标签则不显示预览

### 0.0.4

2024-09-13 修复 `webview` 路径错误并优化插件性能

#### 优化
- 添加停止查找关键词，降低副作用

#### 修复
- fix: `webview.html` 路径错误

### 0.0.5

2024-09-14 优化插件功能

#### 优化
- 添加支持的文件类型
- 缩放按钮支持长按

#### 修复
- fix: 修复预览 `svg` 文件在非 `svg` 文件中的显示问题

---

