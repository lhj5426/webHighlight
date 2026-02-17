const fs = require('fs');
const content = fs.readFileSync('background/background_ah.js', 'utf-8');

// 查找 eachWord
const matches = content.match(/eachWord[^,}]{0,100}/g);
if (matches) {
    console.log('找到 eachWord:');
    matches.forEach((x, i) => console.log(`${i + 1}. ${x}`));
} else {
    console.log('未找到 eachWord');
}

// 查找 includes
const includesMatches = content.match(/\.includes\([^)]+\)/g);
if (includesMatches) {
    console.log('\n找到 includes:');
    const unique = [...new Set(includesMatches)];
    unique.forEach((x, i) => console.log(`${i + 1}. ${x}`));
}

