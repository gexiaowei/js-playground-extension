let editor;
let outputDiv;
let statusText;
const firefoxAPI = globalThis.browser;
const chromeAPI = globalThis.chrome;

function inspectedWindowEval(code, callback) {
  if (firefoxAPI?.devtools?.inspectedWindow?.eval) {
    firefoxAPI.devtools.inspectedWindow
      .eval(code)
      .then(([result, exceptionInfo]) => {
        callback(result, exceptionInfo);
      })
      .catch((error) => {
        callback(null, {
          isError: true,
          value: error?.message || String(error),
          description: error?.stack || ''
        });
      });
    return;
  }

  if (chromeAPI?.devtools?.inspectedWindow?.eval) {
    chromeAPI.devtools.inspectedWindow.eval(code, callback);
    return;
  }

  if (!firefoxAPI?.devtools?.inspectedWindow?.eval && !chromeAPI?.devtools?.inspectedWindow?.eval) {
    callback(null, {
      isError: true,
      value: '当前浏览器不支持 devtools.inspectedWindow.eval'
    });
  }
}

// 增强的代码提示函数
function enhancedHint(cm, options) {
  const cursor = cm.getCursor();
  const token = cm.getTokenAt(cursor);
  const tokenString = token.string || '';
  const tokenLower = tokenString.toLowerCase();
  
  // 先尝试JavaScript提示
  let jsHint = null;
  try {
    jsHint = CodeMirror.hint.javascript(cm, options);
  } catch {
    // 忽略错误，继续使用其他提示方式
  }
  
  // 添加常用API提示
  const customKeywords = [
    // DOM API - document方法
    'document.querySelector', 'document.querySelectorAll', 
    'document.getElementById', 'document.getElementsByClassName', 
    'document.getElementsByTagName', 'document.createElement', 
    'document.createTextNode', 'document.createDocumentFragment',
    'document.addEventListener', 'document.removeEventListener',
    
    // DOM API - element属性
    'innerHTML', 'textContent', 'innerText', 'outerHTML',
    'style', 'className', 'classList', 'id', 'tagName',
    'parentElement', 'parentNode', 'children', 'childNodes',
    'firstElementChild', 'lastElementChild', 'nextElementSibling',
    'previousElementSibling',
    
    // DOM API - element方法
    'addEventListener', 'removeEventListener', 'dispatchEvent',
    'setAttribute', 'getAttribute', 'removeAttribute', 'hasAttribute',
    'appendChild', 'removeChild', 'replaceChild', 'insertBefore',
    'cloneNode', 'contains', 'matches', 'querySelector', 'querySelectorAll',
    'getBoundingClientRect', 'scrollIntoView', 'focus', 'blur',
    
    // 浏览器API - 全局对象
    'window', 'document', 'navigator', 'location', 'history',
    'screen', 'localStorage', 'sessionStorage',
    
    // 浏览器API - 网络
    'fetch', 'XMLHttpRequest', 'WebSocket',
    
    // 浏览器API - 定时器
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'requestAnimationFrame', 'cancelAnimationFrame',
    
    // Promise和异步
    'Promise', 'async', 'await', 'then', 'catch', 'finally',
    'Promise.all', 'Promise.race', 'Promise.resolve', 'Promise.reject',
    
    // Console方法
    'console.log', 'console.error', 'console.warn', 'console.info',
    'console.debug', 'console.table', 'console.group', 'console.groupEnd',
    'console.time', 'console.timeEnd', 'console.trace', 'console.assert',
    
    // JSON
    'JSON.stringify', 'JSON.parse',
    
    // Array方法
    'Array.from', 'Array.isArray', 'Array.of',
    'forEach', 'map', 'filter', 'reduce', 'find', 'findIndex',
    'some', 'every', 'includes', 'indexOf', 'lastIndexOf',
    'push', 'pop', 'shift', 'unshift', 'splice', 'slice',
    'sort', 'reverse', 'concat', 'join', 'toString',
    
    // Object方法
    'Object.keys', 'Object.values', 'Object.entries', 'Object.assign',
    'Object.create', 'Object.defineProperty', 'Object.freeze',
    'Object.is', 'Object.hasOwnProperty',
    
    // String方法
    'charAt', 'charCodeAt', 'concat', 'indexOf', 'lastIndexOf',
    'match', 'replace', 'search', 'slice', 'split', 'substring',
    'toLowerCase', 'toUpperCase', 'trim', 'trimStart', 'trimEnd',
    'startsWith', 'endsWith', 'includes', 'repeat',
    
    // Number方法
    'parseInt', 'parseFloat', 'isNaN', 'isFinite',
    'Number.isInteger', 'Number.isNaN', 'Number.isFinite',
    
    // Math方法
    'Math.abs', 'Math.max', 'Math.min', 'Math.round', 'Math.floor',
    'Math.ceil', 'Math.random', 'Math.sqrt', 'Math.pow',
    
    // Date方法
    'Date.now', 'Date.parse', 'getTime', 'getFullYear', 'getMonth',
    'getDate', 'getDay', 'getHours', 'getMinutes', 'getSeconds',
    
    // ES6+ 关键字
    'const', 'let', 'var', 'function', 'class', 'extends', 'super',
    'import', 'export', 'default', 'from', 'as',
    '=>', '...', '??', '?.', '||', '&&',
    
    // 常用变量名
    'element', 'el', 'node', 'item', 'value', 'key', 'index', 'i',
    'data', 'result', 'response', 'error', 'err', 'e',
    'event', 'evt', 'target', 'currentTarget',
    'options', 'config', 'params', 'args', 'callback', 'cb',
    'arr', 'obj', 'str', 'num', 'bool', 'fn', 'func'
  ];
  
  // 收集当前文档中的所有单词
  const docWords = new Set();
  const doc = cm.getValue();
  const wordRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  let match;
  while ((match = wordRegex.exec(doc)) !== null) {
    if (match[0].length > 2) { // 只收集长度大于2的单词
      docWords.add(match[0]);
    }
  }
  
  // 合并所有提示
  const allHints = new Set();
  
  // 添加JavaScript提示的结果
  if (jsHint && jsHint.list && jsHint.list.length > 0) {
    jsHint.list.forEach(item => {
      const text = typeof item === 'string' ? item : (item.text || item);
      if (text && text.length > 0) {
        allHints.add(text);
      }
    });
  }
  
  // 添加自定义关键词（根据当前输入过滤）
  customKeywords.forEach(keyword => {
    if (tokenString === '' || keyword.toLowerCase().includes(tokenLower)) {
      allHints.add(keyword);
    }
  });
  
  // 添加文档中的单词（根据当前输入过滤）
  docWords.forEach(word => {
    if (tokenString === '' || word.toLowerCase().includes(tokenLower)) {
      allHints.add(word);
    }
  });
  
  // 转换为数组并排序
  const hintList = Array.from(allHints)
    .filter(hint => {
      // 过滤掉太短的提示
      if (hint.length < tokenString.length) return false;
      // 如果有关键词，必须匹配
      if (tokenString && !hint.toLowerCase().includes(tokenLower)) return false;
      return true;
    })
    .sort((a, b) => {
      // 优先显示完全匹配的
      const aStarts = a.toLowerCase().startsWith(tokenLower);
      const bStarts = b.toLowerCase().startsWith(tokenLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // 然后按长度排序（短的优先）
      if (a.length !== b.length) return a.length - b.length;
      // 最后按字母顺序
      return a.localeCompare(b);
    })
    .slice(0, 50); // 限制最多50个提示
  
  if (hintList.length === 0) {
    return jsHint || null;
  }
  
  // 构建提示结果
  const from = { line: cursor.line, ch: token.start };
  const to = { line: cursor.line, ch: token.end };
  
  return {
    list: hintList.map(hint => ({
      text: hint,
      displayText: hint,
      className: 'CodeMirror-hint-code'
    })),
    from: from,
    to: to
  };
}

document.addEventListener('DOMContentLoaded', () => {
  outputDiv = document.getElementById('output');
  statusText = document.getElementById('status-text');
  
  // 确保CodeMirror已加载
  if (typeof CodeMirror === 'undefined') {
    if (outputDiv) {
      addOutput('✗ CodeMirror 未加载，请检查文件路径', 'error');
    }
    return;
  }
  
  editor = CodeMirror(document.getElementById('editor-container'), {
    value: `// JavaScript Playground
// 按 Ctrl+Enter 运行代码
// 按 Ctrl+Space 触发代码提示

console.log('Hello, Playground!');

// 示例：访问当前页面
const title = document.title;
console.log('页面标题:', title);

// 示例：操作DOM
// document.querySelector('h1')?.style.color = 'red';

// 示例：异步操作
// fetch('https://api.github.com/users/octocat')
//   .then(res => res.json())
//   .then(data => console.log(data));
`,
    mode: { name: 'javascript', json: true },
    theme: 'monokai',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    extraKeys: {
      'Ctrl-Enter': () => runCode(),
      'Cmd-Enter': () => runCode(),
      'Ctrl-Space': (cm) => {
        CodeMirror.commands.autocomplete(cm);
      },
      'Alt-Space': (cm) => {
        CodeMirror.commands.autocomplete(cm);
      },
      'Shift-Alt-F': () => formatCode(),
      'Shift-Cmd-F': () => formatCode(),
      'Tab': (cm) => {
        if (cm.somethingSelected()) {
          cm.indentSelection('add');
        } else {
          // 尝试自动补全
          const hint = enhancedHint(cm, { completeSingle: false });
          if (hint && hint.list && hint.list.length > 0) {
            CodeMirror.commands.autocomplete(cm);
          } else {
            cm.replaceSelection('  ', 'end');
          }
        }
      }
    },
    hintOptions: {
      completeSingle: false,
      hint: enhancedHint,
      alignWithWord: true
    }
  });
  
  // 自动触发提示（输入时，延迟触发以提高性能）
  let autocompleteTimeout = null;
  editor.on('inputRead', (cm, change) => {
    const text = change.text[0];
    if (text && text.length > 0 && /[a-zA-Z_$]/.test(text)) {
      // 清除之前的定时器
      if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
      }
      // 延迟300ms触发，避免频繁提示
      autocompleteTimeout = setTimeout(() => {
        const token = cm.getTokenAt(cm.getCursor());
        // 只在输入字母、数字、下划线或$时触发
        if (token && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token.string)) {
          CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
        }
      }, 300);
    }
  });

  // 运行按钮
  document.getElementById('run-btn').addEventListener('click', runCode);
  
  // 格式化按钮
  document.getElementById('format-btn').addEventListener('click', formatCode);
  
  // 清空按钮
  document.getElementById('clear-btn').addEventListener('click', () => {
    outputDiv.innerHTML = '';
    updateStatus('输出已清空');
  });

  // 监听编辑器内容变化
  editor.on('change', () => {
    updateStatus('已修改');
  });

  addOutput('✓ Playground 已就绪，可以开始编写代码了！', 'success');
  updateStatus('就绪');
});

function runCode() {
  const code = editor.getValue();
  outputDiv.innerHTML = '';
  updateStatus('执行中...');
  
  addOutput('▶ 执行代码...', 'info');
  addOutput('─'.repeat(60), 'info');
  
  try {
    // 创建一个安全的执行环境，捕获console输出
    const wrappedCode = `
      (function() {
        const outputs = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalDir = console.dir;
        
        // 重写console方法以捕获输出
        console.log = function(...args) {
          originalLog.apply(console, args);
          outputs.push({ type: 'log', args: args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } 
              catch(e) { return String(arg); }
            }
            return String(arg);
          })});
        };
        
        console.error = function(...args) {
          originalError.apply(console, args);
          outputs.push({ type: 'error', args: args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } 
              catch(e) { return String(arg); }
            }
            return String(arg);
          })});
        };
        
        console.warn = function(...args) {
          originalWarn.apply(console, args);
          outputs.push({ type: 'warn', args: args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } 
              catch(e) { return String(arg); }
            }
            return String(arg);
          })});
        };
        
        console.info = function(...args) {
          originalInfo.apply(console, args);
          outputs.push({ type: 'info', args: args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } 
              catch(e) { return String(arg); }
            }
            return String(arg);
          })});
        };
        
        console.dir = function(obj) {
          originalDir.apply(console, arguments);
          outputs.push({ type: 'dir', args: [JSON.stringify(obj, null, 2)] });
        };
        
        let returnValue = undefined;
        let error = null;
        
        try {
          returnValue = (function() {
            ${code}
          })();
        } catch (e) {
          error = {
            message: e.message,
            stack: e.stack,
            name: e.name
          };
        }
        
        return {
          outputs: outputs,
          returnValue: returnValue,
          error: error
        };
      })();
    `;
    
    // 在页面上下文中执行代码
    inspectedWindowEval(wrappedCode, (result, exceptionInfo) => {
      if (exceptionInfo) {
        addOutput('✗ 执行异常: ' + exceptionInfo.value, 'error');
        if (exceptionInfo.isError) {
          addOutput('错误详情: ' + exceptionInfo.description, 'error');
        }
        if (exceptionInfo.isException) {
          addOutput('异常堆栈: ' + (exceptionInfo.value?.stack || ''), 'error');
        }
        updateStatus('执行失败');
      } else if (result) {
        // 显示console输出
        if (result.outputs && result.outputs.length > 0) {
          result.outputs.forEach(output => {
            const prefix = output.type.toUpperCase();
            const text = output.args.join(' ');
            let type = 'success';
            if (output.type === 'error') type = 'error';
            else if (output.type === 'warn') type = 'warn';
            else if (output.type === 'info') type = 'info';
            addOutput(`${prefix}: ${text}`, type);
          });
        }
        
        // 显示返回值
        if (result.returnValue !== undefined) {
          let returnStr;
          try {
            returnStr = typeof result.returnValue === 'object' 
              ? JSON.stringify(result.returnValue, null, 2)
              : String(result.returnValue);
          } catch {
            returnStr = String(result.returnValue);
          }
          addOutput(`返回值: ${returnStr}`, 'success');
        }
        
        // 显示错误
        if (result.error) {
          addOutput(`✗ 执行错误: ${result.error.message}`, 'error');
          if (result.error.stack) {
            addOutput(`堆栈: ${result.error.stack}`, 'error');
          }
        }
        
        addOutput('─'.repeat(60), 'info');
        addOutput('✓ 代码执行完成', 'success');
        updateStatus('执行完成');
      } else {
        addOutput('─'.repeat(60), 'info');
        addOutput('✓ 代码执行完成（无输出）', 'success');
        updateStatus('执行完成');
      }
    });
    
  } catch (error) {
    addOutput('✗ 错误: ' + error.message, 'error');
    addOutput('堆栈: ' + error.stack, 'error');
    updateStatus('执行失败');
  }
}

function addOutput(text, type = 'success') {
  const line = document.createElement('div');
  line.className = `output-line output-${type}`;
  line.textContent = text;
  outputDiv.appendChild(line);
  outputDiv.scrollTop = outputDiv.scrollHeight;
}

function updateStatus(text) {
  if (statusText) {
    statusText.textContent = text;
  }
}

// 格式化代码函数
function formatCode() {
  if (!editor) return;
  
  try {
    const code = editor.getValue();
    
    // 检查js-beautify是否可用（可能在window或全局作用域）
    const beautify = globalThis.js_beautify || globalThis.window?.js_beautify || null;
    
    if (!beautify) {
      addOutput('✗ js-beautify 未加载，请检查文件路径', 'error');
      updateStatus('格式化失败');
      return;
    }
    
    // 使用js-beautify格式化代码
    const formatted = beautify(code, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      indent_scripts: 'normal',
      brace_style: 'collapse',
      space_before_conditional: true,
      unindent_chained_methods: false,
      operator_position: 'before-newline',
      end_with_newline: false,
      wrap_line_length: 0,
      indent_inner_html: false,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false
    });
    
    // 保存光标位置
    const cursor = editor.getCursor();
    const scrollInfo = editor.getScrollInfo();
    
    // 设置格式化后的代码
    editor.setValue(formatted);
    
    // 恢复光标位置（如果可能）
    try {
      editor.setCursor(cursor);
    } catch {
      // 如果光标位置无效，移动到开头
      editor.setCursor(0, 0);
    }
    
    // 恢复滚动位置
    editor.scrollTo(scrollInfo.left, scrollInfo.top);
    
    updateStatus('代码已格式化');
    addOutput('✓ 代码格式化完成', 'success');
  } catch (error) {
    updateStatus('格式化失败');
    addOutput('✗ 格式化错误: ' + error.message, 'error');
    if (error.stack) {
      addOutput('堆栈: ' + error.stack, 'error');
    }
  }
}
