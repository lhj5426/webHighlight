const fs = require('fs');

const filePath = './editor/editor.js.backup';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Extracting v-textarea section...\n');

// 查找 v-textarea 及其完整的定义
const match = content.match(/.{3000}v-textarea.{3000}/);

if (match) {
    const section = match[0];
    
    // 美化输出，添加换行
    const formatted = section
        .replace(/,t\(/g, ',\n  t(')
        .replace(/\},/g, '},\n')
        .replace(/model:/g, '\nmodel:')
        .replace(/on:/g, '\non:')
        .replace(/attrs:/g, '\nattrs:');
    
    console.log('=== Full v-textarea section ===\n');
    console.log(formatted);
    
    // 提取 model 部分
    const modelMatch = section.match(/model:\{[^}]+\}[^}]*\}/);
    if (modelMatch) {
        console.log('\n\n=== Model binding ===');
        console.log(modelMatch[0]);
    }
    
    // 提取 on 部分
    const onMatch = section.match(/on:\{[^}]+\}/);
    if (onMatch) {
        console.log('\n\n=== Event handlers ===');
        console.log(onMatch[0]);
    }
    
    // 查找确切的位置
    const index = content.indexOf('v-textarea');
    console.log('\n\n=== Position ===');
    console.log('v-textarea found at index:', index);
    
    // 提取前后各500字符
    const before = content.substring(index - 500, index);
    const after = content.substring(index, index + 1500);
    
    console.log('\n=== Context (500 chars before, 1500 after) ===');
    console.log('BEFORE:', before.substring(before.length - 200));
    console.log('\n---v-textarea starts here---\n');
    console.log('AFTER:', after.substring(0, 1000));
}

