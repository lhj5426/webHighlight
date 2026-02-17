// 分析 editor.js 找到关键的数据转换部分
const fs = require('fs');

const content = fs.readFileSync('editor/editor.js', 'utf-8');

// 搜索关键模式
const patterns = [
    /replace\([^)]*\)/g,
    /rows\s*:\s*["']?\d+["']?/g,
    /rule\.text/g,
    /\.text\./g,
    /split\(/g,
];

console.log('=== 搜索关键模式 ===\n');

patterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`模式 ${index + 1}: ${pattern}`);
        console.log(`找到 ${matches.length} 个匹配:`);
        matches.slice(0, 10).forEach(m => console.log(`  - ${m}`));
        console.log('');
    }
});

// 查找包含 "rows" 和 "replace" 的代码段
const searchTerms = ['rows:', 'replace(', 'rule.text', 'callback:'];
searchTerms.forEach(term => {
    const index = content.indexOf(term);
    if (index !== -1) {
        const start = Math.max(0, index - 200);
        const end = Math.min(content.length, index + 200);
        console.log(`\n=== 找到 "${term}" 的上下文 ===`);
        console.log(content.substring(start, end));
        console.log('---\n');
    }
});

