const fs = require('fs');

// 读取编辑器 JS 文件
const filePath = './editor/editor.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Searching for v-textarea context...\n');

// 查找 v-textarea 及其周围的代码
const textareaMatch = content.match(/.{500}v-textarea.{500}/gi);
if (textareaMatch) {
    console.log(`Found ${textareaMatch.length} v-textarea occurrence(s)\n`);
    textareaMatch.forEach((ctx, i) => {
        console.log(`\n=== Occurrence ${i + 1} ===`);
        console.log(ctx);
        console.log('\n');
    });
}

// 同时查找可能相关的 model 或 value 绑定
console.log('\n--- Searching for related patterns ---');

// 查找 .label 相关的代码
const labelPattern = content.match(/.{200}\.label.{200}/g);
if (labelPattern) {
    console.log(`\nFound ${labelPattern.length} .label patterns`);
    // 只显示前几个
    labelPattern.slice(0, 5).forEach((ctx, i) => {
        console.log(`\n${i + 1}:`, ctx);
    });
}

