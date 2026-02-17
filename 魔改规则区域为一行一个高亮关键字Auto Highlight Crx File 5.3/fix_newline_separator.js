// 修复换行分隔符问题
const fs = require('fs');

console.log('=== 开始修复换行分隔符问题 ===\n');

// 1. 修复 editor.js - 移除数据转换
console.log('1. 修复 editor/editor.js...');
let editorContent = fs.readFileSync('editor/editor.js', 'utf-8');

// 查找并替换数据转换逻辑
const oldPattern = /model:\{value:e\.rule\.text\.replace\(\/ \+\/g,"\\n"\),callback:t=>\{e\.\$set\(e\.rule,"text",t\.replace\(\/\\n\+\/g," "\)\.trim\(\)\)\},expression:"rule\.text"\}/;

const newPattern = 'model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)},expression:"rule.text"}';

if (oldPattern.test(editorContent)) {
    editorContent = editorContent.replace(oldPattern, newPattern);
    fs.writeFileSync('editor/editor.js', editorContent, 'utf-8');
    console.log('   ✓ editor.js 已修复 - 移除了空格↔换行转换');
} else {
    console.log('   ⚠ 未找到预期的模式，尝试手动查找...');
    
    // 尝试更宽松的匹配
    const index = editorContent.indexOf('rule.text.replace(/ +/g');
    if (index !== -1) {
        console.log('   找到位置:', index);
        console.log('   上下文:', editorContent.substring(index - 50, index + 200));
    }
}

// 2. 修复关键字分割逻辑 - 在压缩的代码中查找 split(" ")
console.log('\n2. 检查关键字分割逻辑...');

// 检查 background_ah.js
let bgContent = fs.readFileSync('background/background_ah.js', 'utf-8');
const splitSpacePattern = /\.split\([" ]\)/g;
const matches = bgContent.match(splitSpacePattern);

if (matches) {
    console.log(`   在 background_ah.js 中找到 ${matches.length} 个 split(" ") 或 split(' ')`);
    console.log('   需要手动检查这些是否与关键字处理相关');
}

// 检查 content_scripts
let csContent = fs.readFileSync('content_scripts/auto_highlight_cs.js', 'utf-8');
const csMatches = csContent.match(splitSpacePattern);

if (csMatches) {
    console.log(`   在 auto_highlight_cs.js 中找到 ${csMatches.length} 个 split(" ") 或 split(' ')`);
}

console.log('\n=== 修复完成 ===');
console.log('\n下一步：');
console.log('1. 重新加载扩展');
console.log('2. 测试输入包含空格的关键字');
console.log('3. 如果高亮不工作，需要修改关键字分割逻辑（从空格改为换行）');

