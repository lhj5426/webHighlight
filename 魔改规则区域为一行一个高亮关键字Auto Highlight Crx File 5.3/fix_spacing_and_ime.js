const fs = require('fs');

// 从当前文件开始修改
const filePath = './editor/editor.js';
const backupPath = './editor/editor.js.backup';

let content = fs.readFileSync(filePath, 'utf8');
console.log('Fixing spacing and IME issues...\n');

// ===== 问题 1: 修复间隙问题 =====
// 原来: value:e.rule.text.replace(/ /g,"\n")
// 改为: value:e.rule.text.replace(/ +/g,"\n") 或 value:e.rule.text.split(/ +/).join("\n")
// 这样可以将多个连续空格也替换为一个换行符

const oldValuePattern = /value:e\.rule\.text\.replace\(\/ \/g,"\\n"\)/;
const newValuePattern = 'value:e.rule.text.replace(/ +/g,"\\n")';

if (content.match(oldValuePattern)) {
    content = content.replace(oldValuePattern, newValuePattern);
    console.log('✓ Fixed spacing: multiple spaces → single newline');
} else {
    console.log('⚠ Could not find value pattern');
}

// ===== 问题 2: 修复中文输入法问题 =====
// 原来: callback:t=>{e.$set(e.rule,"text",t.replace(/\n/g," "))}
// 改为: callback:t=>{e.$set(e.rule,"text",t.replace(/\n+/g," ").trim())}
// 同时将多个换行符合并为一个空格，并去除首尾空格

const oldCallbackPattern = /callback:t=>\{e\.\$set\(e\.rule,"text",t\.replace\(\/\\n\/g," "\)\)\}/;
const newCallbackPattern = 'callback:t=>{e.$set(e.rule,"text",t.replace(/\\n+/g," ").trim())}';

if (content.match(oldCallbackPattern)) {
    content = content.replace(oldCallbackPattern, newCallbackPattern);
    console.log('✓ Fixed callback: trim and merge multiple newlines');
} else {
    console.log('⚠ Could not find callback pattern');
}

// ===== 问题 3: 移除 keypress 事件，改用 keydown =====
// keypress 事件会干扰中文输入法
// 我们需要完全移除或修改这个事件处理

// 查找当前的 keypress 处理
const keypressPattern = /keypress:function\(t\)\{return null\}/;
if (content.match(keypressPattern)) {
    // 直接移除这个处理器
    content = content.replace(/,keypress:function\(t\)\{return null\}/, '');
    console.log('✓ Removed keypress handler (fixes IME input)');
} else {
    console.log('⚠ keypress handler not found or already modified');
}

// 保存文件
fs.writeFileSync(filePath, content);
console.log('\n✓ File saved successfully!');
console.log('File size:', content.length);

console.log('\n=== 修复说明 ===');
console.log('1. 多个连续空格 → 单个换行符（解决间隙问题）');
console.log('2. 多个连续换行符 → 单个空格（保存时）');
console.log('3. 移除 keypress 事件（修复中文输入法）');
console.log('4. 自动去除首尾空格');

console.log('\n=== 测试步骤 ===');
console.log('1. 重新加载扩展');
console.log('2. 打开规则编辑');
console.log('3. 测试中文输入: 东京 本子');
console.log('4. 测试换行: 每行一个关键字');
console.log('5. 检查间隙是否正常');

console.log('\n如需恢复:');
console.log('  Copy-Item editor/editor.js.backup editor/editor.js');

