const fs = require('fs');
console.log('修复 background_ah.js...');
let content = fs.readFileSync('background/background_ah.js', 'utf-8');

// 修复 1: add_to_rule 中的 split
const before1 = content.includes('s.text.split(" ")');
content = content.replace(
    's.text.split(" ").concat(r));s.text=[...e.values()].join(" ")',
    's.text.split("\\n").concat(r));s.text=[...e.values()].join("\\n")'
);
const after1 = content.includes('s.text.split("\\n")');
console.log('修复 split(" "):', before1 && after1 ? '✓' : '✗');

// 修复 2: eachWord 判断
const before2 = content.includes('!this.text.includes(" ")');
content = content.replace(
    /!this\.text\.includes\(" "\)/g,
    '!this.text.includes("\\n")'
);
const after2 = content.includes('!this.text.includes("\\n")');
console.log('修复 includes(" "):', before2 && after2 ? '✓' : '✗');

fs.writeFileSync('background/background_ah.js', content, 'utf-8');
console.log('✓ 保存完成！');

