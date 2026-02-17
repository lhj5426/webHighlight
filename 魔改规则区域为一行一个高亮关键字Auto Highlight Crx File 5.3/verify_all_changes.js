const fs = require('fs');

console.log('=== 验证所有修改 ===\n');

// 1. 检查 editor.js
console.log('1. 检查 editor.js:');
const editorContent = fs.readFileSync('editor/editor.js', 'utf-8');

// 检查行数
if (editorContent.includes('rows:"10"')) {
    console.log('  ✓ 行数已改为 10');
} else {
    console.log('  ✗ 行数未改');
}

// 检查是否移除了数据转换
if (editorContent.includes('model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)},expression:"rule.text"}')) {
    console.log('  ✓ 已移除数据转换（直接保存换行）');
} else if (editorContent.includes('t.replace(/\\n+/g," ")')) {
    console.log('  ✗ 仍然有数据转换（换行→空格）');
} else {
    console.log('  ? 未知状态');
}

// 2. 检查 background_ah.js
console.log('\n2. 检查 background_ah.js:');
const bgContent = fs.readFileSync('background/background_ah.js', 'utf-8');

// 检查 split
if (bgContent.includes('s.text.split("\\n")')) {
    console.log('  ✓ split 已改为换行分割');
} else if (bgContent.includes('s.text.split(" ")')) {
    console.log('  ✗ split 仍然是空格分割');
} else {
    console.log('  ? 未找到 split');
}

// 检查 eachWord
if (bgContent.includes('!this.text.includes("\\n")')) {
    console.log('  ✓ eachWord 已改为检查换行');
} else if (bgContent.includes('!this.text.includes(" ")')) {
    console.log('  ✗ eachWord 仍然检查空格');
} else {
    console.log('  ? 未找到 eachWord');
}

console.log('\n=== 验证结果 ===\n');

const editorOK = editorContent.includes('rows:"10"') && 
                 editorContent.includes('model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)},expression:"rule.text"}');
const bgOK = bgContent.includes('s.text.split("\\n")') && 
             bgContent.includes('!this.text.includes("\\n")');

if (editorOK && bgOK) {
    console.log('🎉 所有修改都已正确应用！\n');
    console.log('现在的功能：');
    console.log('✓ 输入框 10 行，可以换行');
    console.log('✓ 每行一个关键字');
    console.log('✓ 关键字用换行符存储');
    console.log('✓ 包含空格的关键字会作为整体高亮');
    console.log('\n下一步：');
    console.log('1. 在浏览器中重新加载扩展');
    console.log('2. 打开扩展编辑器');
    console.log('3. 输入测试关键字（每行一个）');
    console.log('4. 保存并测试');
} else {
    console.log('⚠️ 还有一些修改未完成：');
    if (!editorOK) console.log('  - editor.js 需要检查');
    if (!bgOK) console.log('  - background_ah.js 需要检查');
}

