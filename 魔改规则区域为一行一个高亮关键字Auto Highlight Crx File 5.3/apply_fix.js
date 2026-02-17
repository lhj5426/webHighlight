const fs = require('fs');

// 读取编辑器 JS 文件
const filePath = './editor/editor.js';
const backupPath = './editor/editor.js.backup';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);
console.log('\nApplying fix...\n');

// 备份原文件(如果还没有备份)
if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log('✓ Backup created at:', backupPath);
}

// 修改 1: 将 rows="1" 改为 rows="10" 以显示更多行
const fix1 = content.replace(
    /rows="1"/g,
    'rows="10"'
);

if (fix1 !== content) {
    console.log('✓ Changed rows="1" to rows="10"');
    content = fix1;
} else {
    console.log('✗ Could not find rows="1" pattern');
}

// 保存修改后的文件
fs.writeFileSync(filePath, content);
console.log('\n✓ File saved successfully!');
console.log('Modified file size:', content.length);

console.log('\n=== Instructions ===');
console.log('1. 重新加载扩展 (chrome://extensions/)');
console.log('2. 打开扩展的规则编辑页面');
console.log('3. 现在"高亮显示文本"输入框应该显示10行');
console.log('4. 你可以在每一行输入一个关键字');
console.log('\n如果需要恢复原文件,请运行:');
console.log('Copy-Item editor/editor.js.backup editor/editor.js');

