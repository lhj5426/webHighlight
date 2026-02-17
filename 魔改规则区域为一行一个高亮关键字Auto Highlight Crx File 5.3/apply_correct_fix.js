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
} else {
    console.log('✓ Backup already exists at:', backupPath);
}

// 修改: 将 rows:"1" 改为 rows:"10" 以显示更多行
const originalContent = content;
content = content.replace(
    /rows:"1"/g,
    'rows:"10"'
);

if (content !== originalContent) {
    console.log('✓ Successfully changed rows:"1" to rows:"10"');
    
    // 显示修改前后的对比
    const before = originalContent.match(/.{100}rows:"1".{100}/)[0];
    const after = content.match(/.{100}rows:"10".{100}/)[0];
    
    console.log('\n--- Before ---');
    console.log(before);
    console.log('\n--- After ---');
    console.log(after);
} else {
    console.log('✗ No changes made');
}

// 保存修改后的文件
fs.writeFileSync(filePath, content);
console.log('\n✓ File saved successfully!');
console.log('Modified file size:', content.length);

console.log('\n=== 使用说明 ===');
console.log('1. 打开 Chrome 浏览器,访问 chrome://extensions/');
console.log('2. 找到 "Auto Highlight" 扩展');
console.log('3. 点击"重新加载"按钮 (或先删除再重新加载这个文件夹)');
console.log('4. 打开扩展的规则编辑页面');
console.log('5. 现在"高亮显示文本"输入框应该显示10行');
console.log('6. 你可以在每一行输入一个关键字,用换行符分隔');
console.log('\n注意: 关键字仍然用空格分隔存储,但现在可以每行一个关键字输入');
console.log('\n如果需要恢复原文件:');
console.log('  Copy-Item editor/editor.js.backup editor/editor.js');

