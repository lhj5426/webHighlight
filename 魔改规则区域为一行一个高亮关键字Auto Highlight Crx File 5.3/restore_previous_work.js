// 恢复之前AI的工作
const fs = require('fs');

console.log('=== 恢复之前AI的修改 ===\n');

// 1. 恢复 editor.js 的数据转换逻辑
console.log('1. 恢复 editor.js 的数据转换...');
let editorContent = fs.readFileSync('editor/editor.js', 'utf-8');

// 我错误地删除了转换，现在恢复回来
const myWrongChange = 'model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)},expression:"rule.text"}';
const previousAICorrectChange = 'model:{value:e.rule.text.replace(/ +/g,"\\n"),callback:t=>{e.$set(e.rule,"text",t.replace(/\\n+/g," ").trim())},expression:"rule.text"}';

if (editorContent.includes(myWrongChange)) {
    editorContent = editorContent.replace(myWrongChange, previousAICorrectChange);
    fs.writeFileSync('editor/editor.js', editorContent, 'utf-8');
    console.log('  ✓ 已恢复数据转换逻辑（显示时空格→换行，保存时换行→空格）');
} else {
    console.log('  ⚠ 未找到我的错误修改，可能已经是正确的了');
}

// 2. 撤销 background_ah.js 的修改
console.log('\n2. 撤销 background_ah.js 的错误修改...');
let bgContent = fs.readFileSync('background/background_ah.js', 'utf-8');

// 撤销我的修改，恢复原来的空格分割
const myWrongSplit = 's.text.split("\\n").concat(r));s.text=[...e.values()].join("\\n")';
const originalSplit = 's.text.split(" ").concat(r));s.text=[...e.values()].join(" ")';

if (bgContent.includes(myWrongSplit)) {
    bgContent = bgContent.replace(myWrongSplit, originalSplit);
    console.log('  ✓ 已恢复 split 逻辑（换行→空格）');
} else {
    console.log('  ⚠ 未找到我的错误修改');
}

// 撤销 eachWord 的修改
const myWrongEachWord = '!this.text.includes("\\n")';
const originalEachWord = '!this.text.includes(" ")';

if (bgContent.includes(myWrongEachWord)) {
    bgContent = bgContent.replace(new RegExp(myWrongEachWord.replace(/\\/g, '\\\\'), 'g'), originalEachWord);
    console.log('  ✓ 已恢复 eachWord 判断（换行→空格）');
} else {
    console.log('  ⚠ 未找到我的错误修改');
}

fs.writeFileSync('background/background_ah.js', bgContent, 'utf-8');

console.log('\n=== 恢复完成 ===\n');
console.log('现在的状态应该和之前AI的工作一样：');
console.log('✓ 输入框可以换行显示（每行一个关键字）');
console.log('✓ 但保存时仍然用空格分隔存储');
console.log('✓ 这样可以在输入框中看到换行，但不会破坏原有的存储格式');
console.log('\n抱歉给你添麻烦了！😔');

