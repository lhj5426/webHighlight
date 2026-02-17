const fs = require('fs');

// 读取编辑器 JS 文件
const filePath = './editor/editor.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Searching for exact patterns...\n');

// 查找 rows 相关的所有模式
const patterns = [
    /rows:"1"/g,
    /rows:'1'/g,
    /rows:1/g,
    /rows="1"/g,
    /rows='1'/g,
    /"auto-grow"/g,
    /'auto-grow'/g,
    /"auto-grow":""/g,
    /'auto-grow':''/g,
];

patterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`✓ Pattern ${index + 1} (${pattern.source}) found ${matches.length} times`);
        
        // 显示上下文
        const regex = new RegExp(`.{100}${pattern.source}.{100}`, 'g');
        const contexts = content.match(regex);
        if (contexts) {
            contexts.forEach((ctx, i) => {
                console.log(`  Context ${i + 1}:`, ctx.substring(0, 200));
            });
        }
    }
});

// 查找 v-textarea 的完整属性
console.log('\n--- Full v-textarea context ---');
const fullContext = content.match(/.{1000}v-textarea.{1000}/gi);
if (fullContext) {
    fullContext.forEach((ctx, i) => {
        console.log(`\nOccurrence ${i + 1}:`);
        // 美化输出
        const formatted = ctx.replace(/,/g, ',\n  ');
        console.log(formatted.substring(0, 1500));
    });
}

