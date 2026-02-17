const fs = require('fs');

// 读取编辑器 JS 文件
const filePath = './editor/editor.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);

// 这个修改会将文本输入框从单行改为多行
// 查找并替换关键的模式

// 1. 将 split(" ") 改为 split(/[\s\n]+/) 以支持空格和换行符
// 但我们需要更精确的替换,只替换处理高亮文本的部分

// 让我们先找到可能的模式
const patterns = [
    // 查找 split(" ") 的使用
    /\.split\(" "\)/g,
    // 查找 join(" ") 的使用  
    /\.join\(" "\)/g,
];

patterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`Pattern ${index + 1} found ${matches.length} times`);
        console.log('First few matches:', matches.slice(0, 5));
    }
});

// 由于代码是压缩的,我们需要更智能的方法
// 让我们搜索特定的上下文

// 查找包含 "label" 或 "words" 或 "text" 相关的 split
const contextSearch = content.match(/.{50}split\(" "\).{50}/g);
if (contextSearch) {
    console.log('\nContext around split(" "):');
    contextSearch.slice(0, 3).forEach((ctx, i) => {
        console.log(`\n${i + 1}:`, ctx);
    });
}

console.log('\n--- Analysis complete ---');
console.log('Please review the output above to identify the correct location to modify.');

