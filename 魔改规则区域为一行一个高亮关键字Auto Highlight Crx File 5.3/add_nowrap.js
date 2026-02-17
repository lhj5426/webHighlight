// 添加禁用自动换行，让长关键字水平滚动
const fs = require('fs');

console.log('=== 添加横向滚动功能 ===\n');

let content = fs.readFileSync('editor/editor.js', 'utf-8');

// 查找 v-textarea 的位置
const textareaPattern = /"v-textarea",{/;
const match = content.match(textareaPattern);

if (match) {
    console.log('找到 v-textarea 定义');
    
    // 需要添加 CSS 样式来禁用自动换行
    // 在 attrs 中添加 style 或 class
    
    // 方法1: 查找 attrs 并添加 style
    // 查找 attrs:{...} 部分
    const attrsPattern = /attrs:\{([^}]+rows:"10"[^}]+)\}/;
    const attrsMatch = content.match(attrsPattern);
    
    if (attrsMatch) {
        console.log('找到 attrs 定义');
        
        // 在 attrs 后面添加 style
        // 但是压缩的代码很难直接修改 attrs
        // 我们需要在 v-textarea 后面添加 style 属性
        
        // 更简单的方法：添加 CSS 到页面
        console.log('\n建议方案：');
        console.log('由于代码是压缩的，直接修改比较困难。');
        console.log('我们可以：');
        console.log('1. 添加自定义 CSS 文件');
        console.log('2. 或者修改 manifest.json 注入 CSS');
        console.log('3. 或者在 editor.html 中添加 <style>');
    }
} else {
    console.log('未找到 v-textarea');
}

// 让我们检查是否有 editor.html
if (fs.existsSync('editor/editor.html')) {
    console.log('\n✓ 找到 editor.html，可以在这里添加 CSS');
    
    let html = fs.readFileSync('editor/editor.html', 'utf-8');
    
    // 检查是否已经有自定义样式
    if (html.includes('white-space: nowrap')) {
        console.log('  已经有 nowrap 样式了');
    } else {
        // 在 </head> 前添加样式
        const customStyle = `
    <style>
        /* 禁用 textarea 自动换行，添加横向滚动 */
        .v-textarea textarea {
            white-space: nowrap !important;
            overflow-x: auto !important;
            word-wrap: normal !important;
        }
    </style>
`;
        
        if (html.includes('</head>')) {
            html = html.replace('</head>', customStyle + '</head>');
            fs.writeFileSync('editor/editor.html', html, 'utf-8');
            console.log('  ✓ 已添加 CSS 样式到 editor.html');
            console.log('  现在 textarea 不会自动换行，会显示横向滚动条');
        } else {
            console.log('  ⚠ 未找到 </head> 标签');
        }
    }
} else {
    console.log('\n⚠ 未找到 editor.html');
    console.log('让我查找其他 HTML 文件...');
    
    // 查找所有 HTML 文件
    const files = fs.readdirSync('.');
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    console.log('找到的 HTML 文件:', htmlFiles);
}

console.log('\n=== 完成 ===');

