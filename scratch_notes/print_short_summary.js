const fs = require('fs');

const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\all_notion_blocks.json';
const blocks = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function getText(properties) {
    if (!properties || !properties.title) return '';
    return properties.title.map(part => part[0]).join('');
}

const pages = [];
for (const id in blocks) {
    const block = blocks[id].value.value;
    if (block && block.type === 'page') {
        pages.push({ id, title: getText(block.properties) });
    }
}

pages.forEach(page => {
    const pageBlock = blocks[page.id].value.value;
    if (!pageBlock || !pageBlock.content) return;
    
    // Check if this page has any content text
    let hasContent = false;
    const lines = [];
    pageBlock.content.forEach(childId => {
        const childWrapper = blocks[childId];
        if (childWrapper && childWrapper.value && childWrapper.value.value) {
            const child = childWrapper.value.value;
            const text = getText(child.properties);
            if (text) {
                hasContent = true;
                lines.push(`  [${child.type}] ${text}`);
            }
        }
    });

    if (hasContent) {
        console.log(`\n========================================`);
        console.log(`PAGE: ${page.title} (ID: ${page.id})`);
        console.log(`========================================`);
        console.log(lines.join('\n'));
    }
});
