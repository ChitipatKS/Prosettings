const fs = require('fs');
const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\schema_blocks.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (data.recordMap && data.recordMap.block) {
    for (const id in data.recordMap.block) {
        const wrapper = data.recordMap.block[id];
        if (wrapper && wrapper.value && wrapper.value.value) {
            const b = wrapper.value.value;
            console.log(`ID: ${id}, Type: ${b.type}, Title: ${b.properties && b.properties.title ? JSON.stringify(b.properties.title) : 'none'}`);
            if (b.content) {
                console.log(`  Content:`, b.content);
            }
        }
    }
}
