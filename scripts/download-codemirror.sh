#!/bin/bash
BASE_URL="https://cdn.jsdelivr.net/npm/codemirror@5.65.16"
mkdir -p lib/codemirror

files=(
  "lib/codemirror.js"
  "lib/codemirror.css"
  "mode/javascript/javascript.js"
  "addon/edit/closebrackets.js"
  "addon/edit/matchbrackets.js"
  "addon/hint/javascript-hint.js"
  "addon/hint/show-hint.js"
  "addon/hint/show-hint.css"
  "theme/monokai.css"
  "theme/dracula.css"
)

for file in "${files[@]}"; do
  filename=$(basename "$file")
  dir=$(dirname "$file" | sed 's|^lib/||')
  if [ "$dir" != "." ]; then
    mkdir -p "lib/codemirror/$dir"
    target="lib/codemirror/$dir/$filename"
  else
    target="lib/codemirror/$filename"
  fi
  echo "Downloading $file..."
  curl -L "$BASE_URL/$file" -o "$target" || echo "Failed to download $file"
done

echo "Done!"
