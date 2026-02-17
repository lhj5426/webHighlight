const fs = require('fs');

// 读取编辑器 JS 文件
const filePath = './editor/editor.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Searching for textarea, v-textarea, or text input patterns...\n');

// 搜索 Vue 组件相关的模式
const vuePatterns = [
    /v-text-field/gi,
    /v-textarea/gi,
    /textarea/gi,
    /:label/gi,
    /label:/gi,
];

vuePatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`Pattern "${pattern.source}" found ${matches.length} times`);
    }
});

// 搜索可能与 "words" 或 "text" 相关的变量
console.log('\n--- Searching for "words" or "label" context ---');
const wordsContext = content.match(/.{100}(words|label|text).{100}/gi);
if (wordsContext) {
    console.log(`Found ${wordsContext.length} potential matches`);
    wordsContext.slice(0, 5).forEach((ctx, i) => {
        console.log(`\n${i + 1}:`, ctx.substring(0, 200));
    });
}

// 搜索 join 操作
console.log('\n--- Searching for join operations ---');
const joinMatches = content.match(/.{80}\.join\([^)]+\).{80}/g);
if (joinMatches) {
    console.log(`Found ${joinMatches.length} join operations`);
    joinMatches.slice(0, 10).forEach((ctx, i) => {
        console.log(`\n${i + 1}:`, ctx);
    });
}

