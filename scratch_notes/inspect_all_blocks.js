const fs = require('fs');

const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\all_notion_blocks.json';
if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
}

const blocks = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Helper to convert notion properties title to plain/formatted text
function getText(properties) {
    if (!properties || !properties.title) return '';
    return properties.title.map(part => {
        const text = part[0];
        const formats = part[1];
        if (!formats) return text;
        
        let formatted = text;
        for (const format of formats) {
            const type = format[0];
            if (type === 'b') formatted = `**${formatted}**`;
            else if (type === 'i') formatted = `*${formatted}*`;
            else if (type === 'c') formatted = `\`${formatted}\``;
            else if (type === 'a') formatted = `[${formatted}](${format[1]})`;
        }
        return formatted;
    }).join('');
}

// Find all page blocks
const pages = [];
for (const id in blocks) {
    const block = blocks[id].value.value;
    if (block && block.type === 'page') {
        pages.push({ id, title: getText(block.properties) });
    }
}

console.log("Found Pages in JSON:", pages.map(p => `${p.title} (${p.id})`));

// Print details for each page
pages.forEach(page => {
    console.log(`\n========================================`);
    console.log(`PAGE: ${page.title} (ID: ${page.id})`);
    console.log(`========================================`);
    
    const pageBlock = blocks[page.id].value.value;
    if (pageBlock && pageBlock.content) {
        pageBlock.content.forEach(childId => {
            const childWrapper = blocks[childId];
            if (childWrapper && childWrapper.value && childWrapper.value.value) {
                const child = childWrapper.value.value;
                const text = getText(child.properties);
                if (text) {
                    console.log(`[${child.type}] ${text}`);
                } else if (child.type === 'collection_view') {
                    console.log(`[collection_view] (Database Ref: ${child.collection_id})`);
                }
            } else {
                console.log(`[missing] ${childId}`);
            }
        });
    }
});
