const fs = require('fs');

const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\notion_blocks.json';
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

const blocks = data.recordMap.block;

// Let's get the root page block
let rootBlockId = null;
for (const id in blocks) {
    const wrapper = blocks[id];
    if (wrapper && wrapper.value && wrapper.value.value && wrapper.value.value.type === 'page') {
        rootBlockId = id;
        break;
    }
}

if (!rootBlockId) {
    rootBlockId = Object.keys(blocks)[0];
}

console.log("Root Block ID:", rootBlockId);

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

const visited = new Set();
const markdownLines = [];

function renderBlock(blockId, depth = 0) {
    if (visited.has(blockId)) return;
    visited.add(blockId);

    const blockWrapper = blocks[blockId];
    if (!blockWrapper || !blockWrapper.value || !blockWrapper.value.value) return;
    const block = blockWrapper.value.value;

    const text = getText(block.properties);
    const indent = '  '.repeat(depth);

    switch (block.type) {
        case 'page':
            markdownLines.push(`# ${text}`);
            break;
        case 'header':
            markdownLines.push(`\n## ${text}`);
            break;
        case 'sub_header':
            markdownLines.push(`\n### ${text}`);
            break;
        case 'sub_sub_header':
            markdownLines.push(`\n#### ${text}`);
            break;
        case 'text':
            if (text) markdownLines.push(text);
            else markdownLines.push(''); // blank line
            break;
        case 'bulleted_list':
            markdownLines.push(`${indent}- ${text}`);
            break;
        case 'numbered_list':
            markdownLines.push(`${indent}1. ${text}`);
            break;
        case 'to_do':
            const checked = block.properties.checked && block.properties.checked[0][0] === 'Yes';
            markdownLines.push(`${indent}- [${checked ? 'x' : ' '}] ${text}`);
            break;
        case 'code':
            const lang = (block.properties.language && block.properties.language[0][0]) || '';
            markdownLines.push(`\n\`\`\`${lang.toLowerCase()}\n${text}\n\`\`\``);
            break;
        case 'quote':
            markdownLines.push(`> ${text}`);
            break;
        case 'callout':
            markdownLines.push(`\n> [!NOTE]\n> ${text}`);
            break;
        default:
            if (text) {
                markdownLines.push(`${indent}[${block.type}] ${text}`);
            }
            break;
    }

    if (block.content) {
        for (const childId of block.content) {
            renderBlock(childId, depth + 1);
        }
    }
}

// Render root block and all children
renderBlock(rootBlockId);

// For any blocks that might not be in the hierarchy but were returned
for (const id in blocks) {
    if (!visited.has(id)) {
        renderBlock(id);
    }
}

const outputMd = markdownLines.join('\n');
console.log("\n--- Parsed Markdown Output ---\n");
console.log(outputMd);

fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\notion_page.md', outputMd);
