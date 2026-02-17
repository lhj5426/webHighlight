// 查找关键字分割逻辑
const fs = require('fs');

console.log('=== 查找关键字分割逻辑 ===\n');

// 在 background_ah.js 中查找
const bgContent = fs.readFileSync('background/background_ah.js', 'utf-8');

// 查找包含 split 和 text 的代码段
const searchPatterns = [
    /\.text\.split\([^)]+\)/g,
    /split\([" ]\)/g,
    /\.split\(" "\)/g,
    /\.split\(' '\)/g,
];

searchPatterns.forEach((pattern, index) => {
    console.log(`\n模式 ${index + 1}: ${pattern}`);
    const matches = bgContent.match(pattern);
    if (matches) {
        console.log(`找到 ${matches.length} 个匹配:`);
        matches.forEach((m, i) => {
            const idx = bgContent.indexOf(m);
            const context = bgContent.substring(Math.max(0, idx - 100), Math.min(bgContent.length, idx + 100));
            console.log(`\n  匹配 ${i + 1}: ${m}`);
            console.log(`  上下文: ...${context}...`);
        });
    } else {
        console.log('未找到匹配');
    }
});

// 查找特定的关键字处理代码
console.log('\n\n=== 查找 "add_to_rule" 相关代码 ===');
const addToRuleIndex = bgContent.indexOf('add_to_rule');
if (addToRuleIndex !== -1) {
    const start = Math.max(0, addToRuleIndex - 300);
    const end = Math.min(bgContent.length, addToRuleIndex + 500);
    console.log(bgContent.substring(start, end));
}

// 查找 rule.text 的使用
console.log('\n\n=== 查找 rule.text 的使用 ===');
let index = 0;
let count = 0;
while ((index = bgContent.indexOf('.text', index)) !== -1 && count < 5) {
    const start = Math.max(0, index - 80);
    const end = Math.min(bgContent.length, index + 120);
    console.log(`\n位置 ${count + 1}:`);
    console.log(bgContent.substring(start, end));
    index += 5;
    count++;
}

