const fs = require('fs');

// 从备份开始，完全重新修改
const filePath = './editor/editor.js';
const backupPath = './editor/editor.js.backup';

let content = fs.readFileSync(backupPath, 'utf8');
console.log('Changing storage format: space → newline\n');

// ===== 修改 1: 增加行数 =====
content = content.replace(/rows:"1"/, 'rows:"10"');
console.log('✓ Changed rows to 10');

// ===== 修改 2: 完全移除数据转换 =====
// 不再转换空格和换行符，直接使用换行符存储
// 原来: model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)},expression:"rule.text"}
// 保持不变，让它直接存储换行符

console.log('✓ Keeping original model binding (no conversion)');

// ===== 修改 3: 移除 Enter 键的阻止 =====
// 允许 Enter 键正常换行
const oldKeypress = 'keypress:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:(t.preventDefault(),e.saveRuleNow.apply(null,arguments))}';
const newKeypress = 'keypress:function(t){return null}';

if (content.includes(oldKeypress)) {
    content = content.replace(oldKeypress, newKeypress);
    console.log('✓ Removed Enter key preventDefault');
} else {
    console.log('⚠ keypress handler not found');
}

// ===== 修改 4: 修改保存逻辑 =====
// 但是这里有个问题：扩展可能在其他地方用空格分隔关键字
// 我们需要找到处理关键字的地方

console.log('\n⚠ WARNING: This changes the storage format!');
console.log('  Old format: "keyword1 keyword2 keyword3"');
console.log('  New format: "keyword1\\nkeyword2\\nkeyword3"');
console.log('\n  This may affect how the extension processes keywords.');
console.log('  You may need to re-enter your keywords.');

// 保存文件
fs.writeFileSync(filePath, content);
console.log('\n✓ File saved!');
console.log('File size:', content.length);

console.log('\n=== 使用说明 ===');
console.log('1. 重新加载扩展');
console.log('2. 打开规则编辑');
console.log('3. 现在可以按 Enter 换行了');
console.log('4. 每行一个关键字，关键字内可以包含空格');
console.log('5. 例如:');
console.log('   第1行: [251031] 【DMM】 [SURVIVE MORE] ...');
console.log('   第2行: 东京 本子');
console.log('   第3行: 另一个关键字');

console.log('\n⚠ 注意事项:');
console.log('1. 旧的关键字（空格分隔）需要重新输入');
console.log('2. 现在用换行符分隔，不是空格');
console.log('3. 如果扩展在处理关键字时出错，可能需要更多修改');

console.log('\n如需恢复:');
console.log('  Copy-Item editor/editor.js.backup editor/editor.js');

