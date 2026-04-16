# JavaScript Playground 浏览器扩展

一个在浏览器 DevTools 中添加 JavaScript Playground 标签页的扩展，当前已适配 Chrome 和 Firefox。

## 功能特性

- ✅ 在 Chrome / Firefox DevTools 中新增 "Playground" 标签页
- ✅ 集成 CodeMirror 编辑器，提供代码提示和语法高亮
- ✅ 支持在页面上下文中执行JavaScript代码
- ✅ 实时输出console日志
- ✅ 快捷键支持（Ctrl+Enter运行代码）

## 安装步骤

Chrome:

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-playground-extension` 文件夹

Firefox:

1. 打开 Firefox 浏览器
2. 访问 `about:debugging#/runtime/this-firefox`
3. 点击"临时载入附加组件"
4. 选择项目中的 `manifest.json`

## 构建 CRX

1. 安装依赖：`pnpm install`
2. 执行构建：`pnpm build:crx`
3. 构建产物会输出到 `dist/javascript-playground.crx` 和 `dist/javascript-playground.zip`

首次构建会自动生成签名私钥 `.keys/key.pem`。后续发布更新时必须保留这把私钥，否则扩展 ID 会变化，旧版本无法原位升级。

如果只是本地开发调试，仍然建议直接加载未打包目录：

- Chrome: `chrome://extensions/` -> "加载已解压的扩展程序"
- Firefox: `about:debugging#/runtime/this-firefox` -> "临时载入附加组件"

说明：

- `.crx` 主要用于打包分发、备份或自动化测试。
- Chrome 官方文档说明，Windows 和 macOS 不允许通过本地 `.crx` 路径做外部分发安装；本地开发通常还是使用未打包目录。参考：
  https://developer.chrome.com/docs/extensions/how-to/distribute/install-extensions

## 使用 release-it 发版

1. 确保工作区已提交，且当前分支状态符合你的发版要求。
2. 交互式发版：`pnpm release`
3. CI 或非交互模式：`pnpm release:ci -- <version|major|minor|patch>`

发版时 `release-it` 会自动完成这些步骤：

- 更新 `package.json` 版本号
- 同步 `manifest.json` 里的扩展版本号
- 重新生成 `dist/javascript-playground.crx` 和 `dist/javascript-playground.zip`
- 创建 release commit 和 Git tag

当前配置不会执行 npm 发布，也不会自动创建 GitHub Release。

## 使用方法

1. 打开任意网页
2. 按 F12 打开开发者工具
3. 在DevTools顶部标签栏中找到"Playground"标签
4. 在编辑器中编写JavaScript代码
5. 点击"运行"按钮或按 `Ctrl+Enter` 执行代码
6. 代码会在当前页面上下文中执行，输出会显示在下方的输出区域

## 注意事项

- 代码会在当前打开的页面上下文中执行，可以访问页面的DOM和全局变量
- 使用 `console.log`、`console.error`、`console.warn`、`console.info` 等console方法可以在输出区域看到结果
- 代码执行后的返回值也会显示在输出区域
- 如果代码执行出错，会显示详细的错误信息和堆栈
- 支持代码提示、语法高亮、自动补全等功能（CodeMirror 提供）

## 文件结构

```
chrome-playground-extension/
├── manifest.json              # 扩展配置文件（Chrome / Firefox）
├── scripts/build-crx.mjs      # CRX 打包脚本
├── devtools.html              # DevTools入口文件
├── devtools.js                # DevTools面板创建逻辑
├── panel.html                 # Playground面板HTML
├── panel.js                   # Playground面板逻辑
├── lib/
│   └── codemirror/            # CodeMirror编辑器文件
│       ├── lib/
│       │   ├── codemirror.js
│       │   └── codemirror.css
│       ├── mode/
│       │   └── javascript/
│       ├── addon/
│       │   ├── edit/
│       │   └── hint/
│       └── theme/
└── README.md                  # 说明文档
```

## 功能特性

- ✅ 精美的深色主题UI设计
- ✅ CodeMirror代码编辑器，支持语法高亮
- ✅ JavaScript代码自动补全提示
- ✅ 自动闭合括号、匹配括号高亮
- ✅ 快捷键支持（Ctrl+Enter运行代码，Ctrl+Space自动补全）
- ✅ 实时状态显示
- ✅ 美观的输出区域，支持不同类型的日志显示
- ✅ 代码在页面上下文中执行，可访问 DOM 和全局变量
