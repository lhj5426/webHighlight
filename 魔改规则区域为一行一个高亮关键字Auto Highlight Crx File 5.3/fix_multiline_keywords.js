const fs = require('fs');

console.log('=== 修复多行关键字高亮问题 ===\n');

// 问题分析：
// 当前逻辑：如果文本包含 \n，则 eachWord = false
// 这导致扩展尝试匹配整个多行文本，而不是分别匹配每一行

// 解决方案：
// 在 content script 中，如果检测到文本包含 \n，
// 应该先按 \n 分割，然后分别高亮每个关键字

console.log('1. 检查 content_scripts/auto_highlight_cs.js...');
let csContent = fs.readFileSync('content_scripts/auto_highlight_cs.js', 'utf-8');

// 查找关键的 mark 函数
const markFunctionPattern = /async mark\(t\)\{[^}]+this\.rule\.text[^}]+\}/;
const match = csContent.match(markFunctionPattern);

if (match) {
    console.log('   找到 mark 函数');
    console.log('   当前逻辑:', match[0].substring(0, 200));
} else {
    console.log('   ⚠ 未找到 mark 函数（代码已压缩）');
}

// 由于代码已压缩，我们需要在 background 中修改逻辑
console.log('\n2. 修改策略：');
console.log('   由于 content script 已压缩，我们需要修改 background 的逻辑');
console.log('   让每个规则在保存时就分割成多个关键字');

console.log('\n3. 建议的解决方案：');
console.log('   方案 A: 修改 editor.js，在保存时将多行文本分割成多个规则');
console.log('   方案 B: 修改 background.js，在发送给 content script 前分割文本');
console.log('   方案 C: 重新编译 content script（需要源代码）');

console.log('\n4. 最简单的方案：修改 background.js');
console.log('   在发送规则给 content script 时，如果文本包含 \\n，');
console.log('   就将其分割成多个规则');

// 查找 background 中发送规则的代码
console.log('\n5. 检查 background/background_ah.js...');
let bgContent = fs.readFileSync('background/background_ah.js', 'utf-8');

// 查找 getRulesInTab 或类似的函数
const getRulesPattern = /getRulesInTab|ue\(e\.url\)/;
const bgMatch = bgContent.match(getRulesPattern);

if (bgMatch) {
    console.log('   找到规则获取逻辑');
} else {
    console.log('   ⚠ 未找到规则获取逻辑');
}

console.log('\n=== 分析完成 ===');
console.log('\n由于代码已压缩，最佳解决方案是：');
console.log('1. 在 editor.js 中，当用户输入多行文本时');
console.log('2. 自动将每一行作为一个独立的关键字');
console.log('3. 或者提示用户每行只能输入一个关键字');

console.log('\n让我们检查 editor.js 是否可以修改...');

