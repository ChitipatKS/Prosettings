const fs = require('fs');

const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\all_notion_blocks.json';
const blocks = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function getText(properties) {
    if (!properties || !properties.title) return '';
    return properties.title.map(part => part[0]).join('');
}

const targetIds = [
    '3834badc-5d57-80c7-9e3f-dbfefb4f076f', // Main Features page
    '3824badc-5d57-80a6-b6dd-c1bac82b89b2'  // Value-Added Features
];

targetIds.forEach(pageId => {
    const pageBlock = blocks[pageId] && blocks[pageId].value && blocks[pageId].value.value;
    if (!pageBlock) return;
    
    console.log(`\n========================================`);
    console.log(`PAGE: ${getText(pageBlock.properties)} (${pageId})`);
    console.log(`========================================`);
    
    if (pageBlock.content) {
        pageBlock.content.forEach(childId => {
            const childWrapper = blocks[childId];
            if (childWrapper && childWrapper.value && childWrapper.value.value) {
                const child = childWrapper.value.value;
                const text = getText(child.properties);
                console.log(`[${child.type}] ${text || '(empty)'}`);
                if (child.content) {
                    child.content.forEach(cId => {
                        const cWrapper = blocks[cId];
                        if (cWrapper && cWrapper.value && cWrapper.value.value) {
                            const c = cWrapper.value.value;
                            console.log(`  [${c.type}] ${getText(c.properties)}`);
                        }
                    });
                }
            }
        });
    }
});
