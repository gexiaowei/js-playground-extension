# JavaScript Playground Chrome 扩展

一个在Chrome DevTools中添加JavaScript Playground标签页的扩展。

## 功能特性

- ✅ 在Chrome DevTools中新增"Playground"标签页
- ✅ 集成Monaco Editor，提供代码提示和语法高亮
- ✅ 支持在页面上下文中执行JavaScript代码
- ✅ 实时输出console日志
- ✅ 快捷键支持（Ctrl+Enter运行代码）

## 安装步骤

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-playground-extension` 文件夹

## 使用方法

1. 打开任意网页
2. 按F12打开开发者工具
3. 在DevTools顶部标签栏中找到"Playground"标签
4. 在编辑器中编写JavaScript代码
5. 点击"运行"按钮或按 `Ctrl+Enter` 执行代码
6. 代码会在当前页面上下文中执行，输出会显示在下方的输出区域

## 注意事项

- 代码会在当前打开的页面上下文中执行，可以访问页面的DOM和全局变量
- 使用 `console.log`、`console.error`、`console.warn`、`console.info` 等console方法可以在输出区域看到结果
- 代码执行后的返回值也会显示在输出区域
- 如果代码执行出错，会显示详细的错误信息和堆栈
- 支持代码提示、语法高亮、自动补全等功能（Monaco Editor提供）

## 文件结构

```
chrome-playground-extension/
├── manifest.json              # 扩展配置文件
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
- ✅ 代码在页面上下文中执行，可访问DOM和全局变量
