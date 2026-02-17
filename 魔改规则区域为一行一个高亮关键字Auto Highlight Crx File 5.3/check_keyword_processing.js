const fs = require('fs');

console.log('Checking how keywords are processed...\n');

// 检查所有可能处理关键字的文件
const files = [
    './editor/editor.js.backup',
    './content_scripts/content_script.js',
    './background/background.js'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`\n=== Checking ${file} ===`);
        const content = fs.readFileSync(file, 'utf8');
        
        // 查找 split 操作
        const splitMatches = content.match(/.{100}\.split\([^)]+\).{100}/g);
        if (splitMatches) {
            console.log(`\nFound ${splitMatches.length} split operations:`);
            splitMatches.slice(0, 10).forEach((match, i) => {
                if (match.includes('text') || match.includes('word') || match.includes('label')) {
                    console.log(`${i + 1}: ${match}`);
                }
            });
        }
        
        // 查找 eachWord 相关的处理
        const eachWordMatches = content.match(/.{200}eachWord.{200}/g);
        if (eachWordMatches) {
            console.log(`\nFound ${eachWordMatches.length} eachWord references:`);
            eachWordMatches.slice(0, 5).forEach((match, i) => {
                console.log(`${i + 1}: ${match.substring(0, 300)}`);
            });
        }
    }
});

console.log('\n\n=== Analysis ===');
console.log('Looking for how the extension splits keywords...');

