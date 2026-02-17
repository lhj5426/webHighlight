const fs = require('fs');

// 读取备份文件，重新开始
const filePath = './editor/editor.js';
const backupPath = './editor/editor.js.backup';

// 从备份恢复
if (fs.existsSync(backupPath)) {
    let content = fs.readFileSync(backupPath, 'utf8');
    console.log('Starting from backup file...\n');
    
    let changesMade = [];
    
    // ===== 修改 1: 增加行数 =====
    const before1 = content;
    content = content.replace(/rows:"1"/, 'rows:"10"');
    if (content !== before1) {
        changesMade.push('✓ Changed rows to 10');
    }
    
    // ===== 修改 2: 修改 model 绑定，使用计算属性 =====
    // 查找 v-textarea 的完整定义
    const textareaRegex = /(t\("v-textarea",\{ref:"highlight_text_input",attrs:\{"auto-grow":"",rows:"10",spellcheck:"false",label:[^}]+\},on:\{input:t=>e\.save\(\)[^}]+\},model:\{value:e\.rule\.text,callback:t=>\{e\.\$set\(e\.rule,"text",t\)\}\})/;
    
    const match = content.match(textareaRegex);
    if (match) {
        console.log('Found v-textarea definition');
        
        // 我们需要修改 model 绑定
        // 原来: model:{value:e.rule.text,callback:t=>{e.$set(e.rule,"text",t)}}
        // 改为: model:{value:e.rule.text.replace(/ /g,"\n"),callback:t=>{e.$set(e.rule,"text",t.replace(/\n/g," "))}}
        
        const oldModel = /model:\{value:e\.rule\.text,callback:t=>\{e\.\$set\(e\.rule,"text",t\)\}\}/;
        const newModel = 'model:{value:e.rule.text.replace(/ /g,"\\n"),callback:t=>{e.$set(e.rule,"text",t.replace(/\\n/g," "))}}';
        
        const before2 = content;
        content = content.replace(oldModel, newModel);
        if (content !== before2) {
            changesMade.push('✓ Modified model binding to convert spaces ↔ newlines');
        }
    }
    
    // ===== 修改 3: 移除 input 事件中的 save，改为 blur 时保存 =====
    // 这样用户输入时不会立即保存，避免换行符被立即转换
    const oldInput = /on:\{input:t=>e\.save\(\)/;
    const newInput = 'on:{blur:t=>e.save(),input:t=>{}';
    
    const before3 = content;
    content = content.replace(oldInput, newInput);
    if (content !== before3) {
        changesMade.push('✓ Changed save trigger from input to blur');
    }
    
    // 保存修改后的文件
    fs.writeFileSync(filePath, content);
    
    console.log('\n=== Changes Applied ===');
    changesMade.forEach(change => console.log(change));
    
    console.log('\n=== 测试步骤 ===');
    console.log('1. 重新加载扩展');
    console.log('2. 打开规则编辑');
    console.log('3. 在"高亮显示文本"框中:');
    console.log('   - 现有的空格会显示为换行符');
    console.log('   - 可以按 Enter 输入新行');
    console.log('   - 失去焦点时自动保存并转换为空格');
    
    console.log('\n✓ Done! File size:', content.length);
    
} else {
    console.log('❌ Backup file not found!');
    console.log('Please run the first script to create a backup.');
}

