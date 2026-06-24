const fs = require('fs');
const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\notion_blocks.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (data.recordMap) {
    if (data.recordMap.collection) {
        console.log("Collections:", Object.keys(data.recordMap.collection));
        for (const id in data.recordMap.collection) {
            const coll = data.recordMap.collection[id].value;
            console.log(`Collection ${id}:`, coll ? JSON.stringify(coll.name) : 'none');
        }
    }
    if (data.recordMap.collection_view) {
        console.log("Collection Views:", Object.keys(data.recordMap.collection_view));
    }
}
