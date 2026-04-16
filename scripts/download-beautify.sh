#!/bin/bash
# 下载js-beautify库

BASE_URL="https://cdn.jsdelivr.net/npm/js-beautify@1.14.11/js/lib"
mkdir -p lib/js-beautify

echo "正在下载js-beautify..."

curl -L "$BASE_URL/beautify.js" -o lib/js-beautify/beautify.js && echo "✓ beautify.js 下载完成" || echo "✗ beautify.js 下载失败"

echo "下载完成！如果下载失败，请手动访问以下链接下载："
echo "https://cdn.jsdelivr.net/npm/js-beautify@1.14.11/js/lib/beautify.js"
echo "保存到: lib/js-beautify/beautify.js"
