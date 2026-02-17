const fs = require('fs');

// 读取编辑器 JS 文件
const filePath = './editor/editor.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Searching for data handling code...\n');

// 查找 v-textarea 的 model 绑定
const textareaContext = content.match(/.{2000}v-textarea.{2000}/gi);
if (textareaContext) {
    console.log('=== v-textarea full context ===\n');
    textareaContext.forEach((ctx, i) => {
        // 查找 model 绑定
        const modelMatch = ctx.match(/model:\{[^}]+\}/g);
        if (modelMatch) {
            console.log('Model binding found:');
            modelMatch.forEach(m => console.log(m));
        }
        
        // 查找 value 或 v-model
        const valueMatch = ctx.match(/value:[^,]+/g);
        if (valueMatch) {
            console.log('\nValue bindings:');
            valueMatch.forEach(v => console.log(v));
        }
    });
}

// 查找 label 相关的处理
console.log('\n\n=== Searching for label processing ===\n');
const labelProcessing = content.match(/.{200}\.label[^,]{0,200}/g);
if (labelProcessing) {
    labelProcessing.slice(0, 10).forEach((ctx, i) => {
        console.log(`${i + 1}: ${ctx}\n`);
    });
}

// 查找 split 和 join 的使用
console.log('\n=== Searching for split/join operations ===\n');
const splitJoin = content.match(/.{100}(split|join)\([^)]+\).{100}/g);
if (splitJoin) {
    splitJoin.slice(0, 15).forEach((ctx, i) => {
        if (ctx.includes('label') || ctx.includes('text') || ctx.includes('word')) {
            console.log(`${i + 1}: ${ctx}\n`);
        }
    });
}

