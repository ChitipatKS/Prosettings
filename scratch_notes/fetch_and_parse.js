const fs = require('fs');

const pageId = '3834badc-5d57-8073-be90-ec9e12c94c42';

async function run() {
    try {
        console.log(`Fetching page chunk for pageId: ${pageId}...`);
        const res = await fetch('https://www.notion.so/api/v3/loadCachedPageChunk', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                pageId: pageId,
                limit: 100,
                cursor: { stack: [] },
                chunkNumber: 0,
                verticalColumns: false
            })
        });

        if (!res.ok) {
            console.error(`HTTP error! Status: ${res.status}`);
            return;
        }

        const data = await res.json();
        if (!data.recordMap || !data.recordMap.block) {
            console.error('No recordMap or block found in response');
            console.log(JSON.stringify(data, null, 2));
            return;
        }

        const blocks = data.recordMap.block;
        console.log(`Successfully fetched ${Object.keys(blocks).length} blocks for Database Schema`);

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
                    else markdownLines.push('');
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

        // Find the page root
        let rootBlockId = null;
        for (const id in blocks) {
            const block = blocks[id].value.value;
            if (block && block.type === 'page') {
                rootBlockId = id;
                break;
            }
        }
        if (!rootBlockId) rootBlockId = Object.keys(blocks)[0];

        renderBlock(rootBlockId);

        // Render remaining
        for (const id in blocks) {
            if (!visited.has(id)) {
                renderBlock(id);
            }
        }

        const mdContent = markdownLines.join('\n');
        fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\schema_page.md', mdContent);
        console.log('Saved parsed markdown to schema_page.md');
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
