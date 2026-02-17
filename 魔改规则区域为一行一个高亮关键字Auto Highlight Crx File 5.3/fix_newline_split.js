const fs = require('fs');

console.log('=== 修复换行分隔关键字高亮问题 ===\n');

// 策略：在 background.js 中，当发送规则给 content script 时
// 如果规则的 text 包含换行符，就将其分割成多个"虚拟规则"
// 每个虚拟规则只包含一个关键字

console.log('1. 读取 background/background_ah.js...');
let content = fs.readFileSync('background/background_ah.js', 'utf-8');

// 查找发送规则给 content script 的代码
// 应该是在 page_loaded 或类似的消息处理中

console.log('2. 查找规则发送逻辑...');

// 搜索 "page_loaded" 相关代码
const pageLoadedIndex = content.indexOf('"page_loaded"');
if (pageLoadedIndex !== -1) {
    const context = content.substring(pageLoadedIndex - 200, pageLoadedIndex + 300);
    console.log('   找到 page_loaded 处理:');
    console.log('   ' + context.substring(0, 200));
}

// 搜索 ue(e.url) - 这是获取规则的函数
const ueIndex = content.indexOf('ue(e.url)');
if (ueIndex !== -1) {
    const context = content.substring(ueIndex - 300, ueIndex + 200);
    console.log('\n   找到规则获取逻辑:');
    console.log('   ' + context);
}

console.log('\n3. 分析：');
console.log('   由于代码已压缩，直接修改会很困难');
console.log('   我们需要在规则发送前添加一个转换函数');

console.log('\n4. 建议的修复方案：');
console.log('   在 background_ah.js 中，找到 async function ue(e) 函数');
console.log('   这个函数返回匹配当前页面的规则列表');
console.log('   在返回前，将每个包含 \\n 的规则分割成多个规则');

console.log('\n5. 具体实现：');
console.log('   添加一个函数来分割规则：');
console.log('   ```javascript');
console.log('   function splitRuleByNewline(rule) {');
console.log('     if (!rule.text.includes("\\n")) return [rule];');
console.log('     const keywords = rule.text.split("\\n").filter(k => k.trim());');
console.log('     return keywords.map(keyword => ({');
console.log('       ...rule,');
console.log('       text: keyword,');
console.log('       search: { ...rule.search, eachWord: true }');
console.log('     }));');
console.log('   }');
console.log('   ```');

console.log('\n6. 查找 ue 函数的返回语句...');
// 查找 "Array.from(s)" - 这可能是返回规则数组的地方
const arrayFromIndex = content.lastIndexOf('Array.from(s)');
if (arrayFromIndex !== -1) {
    const context = content.substring(arrayFromIndex - 200, arrayFromIndex + 100);
    console.log('   找到返回语句:');
    console.log('   ' + context);
}

console.log('\n=== 分析完成 ===');
console.log('\n由于代码高度压缩，我们需要：');
console.log('1. 找到 async function ue(e) 的确切位置');
console.log('2. 在返回规则数组前，添加分割逻辑');
console.log('3. 或者修改 content script 的接收逻辑');

console.log('\n让我创建一个更简单的解决方案...');

