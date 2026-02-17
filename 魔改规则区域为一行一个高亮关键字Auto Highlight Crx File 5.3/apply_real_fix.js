// 真正的修复：彻底改为换行分隔
const fs = require('fs');

console.log('=== 应用真正的换行分隔修复 ===\n');

// 1. 修复 editor.js - 移除数据转换，直接保存换行
console.log('1. 修复 editor.js - 移除数据转换...');
let editorContent = fs.readFileSync('editor/editor.js', 'utf-8');

// 当前的转换逻辑（显示换行但保存空格）
const currentConversion = 'model:{value:e.rule.text.replace(/ +/g,"\\n"),callback:t=>{e.$set(e.rule,"text",t.replace(/\\n+/g," ").trim())},expression:"rule.text"}';

// 新的逻辑（直接保存换行，不转换）
const newNoConversion = 'model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)},expression:"rule.text"}';

if (editorContent.includes(currentConversion)) {
    editorContent = editorContent.replace(currentConversion, newNoConversion);
    fs.writeFileSync('editor/editor.js', editorContent, 'utf-8');
    console.log('  ✓ 已移除数据转换 - 现在直接保存换行符');
} else {
    console.log('  ⚠ 未找到预期的转换逻辑');
}

// 2. 修复 background_ah.js - 改为换行分割
console.log('\n2. 修复 background_ah.js - 改为换行分割...');
let bgContent = fs.readFileSync('background/background_ah.js', 'utf-8');

// 修复 add_to_rule 中的 split
const oldSplit = 's.text.split(" ").concat(r));s.text=[...e.values()].join(" ")';
const newSplit = 's.text.split("\\n").concat(r));s.text=[...e.values()].join("\\n")';

if (bgContent.includes(oldSplit)) {
    bgContent = bgContent.replace(oldSplit, newSplit);
    console.log('  ✓ 已修改 split: 空格 → 换行');
} else {
    console.log('  ⚠ 未找到 split 逻辑');
}

// 修复 eachWord 判断
const oldEachWord = '!this.text.includes(" ")';
const newEachWord = '!this.text.includes("\\n")';

const count = (bgContent.match(new RegExp(oldEachWord.replace(/[()]/g, '\\$&'), 'g')) || []).length;
if (count > 0) {
    bgContent = bgContent.replace(new RegExp(oldEachWord.replace(/[()]/g, '\\$&'), 'g'), newEachWord);
    console.log(`  ✓ 已修改 ${count} 处 eachWord 判断: 空格 → 换行`);
} else {
    console.log('  ⚠ 未找到 eachWord 判断');
}

fs.writeFileSync('background/background_ah.js', bgContent, 'utf-8');

console.log('\n=== 修复完成 ===\n');
console.log('现在的行为：');
console.log('✓ 输入框：每行一个关键字');
console.log('✓ 存储：用换行符(\\n)分隔');
console.log('✓ 高亮：每行作为一个整体关键字');
console.log('\n这意味着：');
console.log('✓ "[251031] 【DMM】 [SURVIVE MORE] ..." 会作为一个整体高亮');
console.log('✓ 不会被空格分割成多个关键字');
console.log('\n⚠️ 注意：');
console.log('- 需要重新加载扩展');
console.log('- 旧数据需要手动转换（将空格改为换行）');

