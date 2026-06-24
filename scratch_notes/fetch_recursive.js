const fs = require('fs');

const rootId = '3824badc-5d57-80a2-bb77-c04f521cc746';
const spaceId = 'cf64badc-5d57-8161-b0b4-00034a8a7f7b';

const allBlocks = {};
const fetchedPages = new Set();

async function fetchPageChunk(pageId) {
    if (fetchedPages.has(pageId)) return;
    fetchedPages.add(pageId);
    console.log(`Fetching page chunk for: ${pageId}...`);

    try {
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
            console.error(`HTTP error fetching ${pageId}: Status ${res.status}`);
            return;
        }

        const data = await res.json();
        if (data.recordMap && data.recordMap.block) {
            Object.assign(allBlocks, data.recordMap.block);
            
            // Look for nested pages or collections that we should fetch
            for (const id in data.recordMap.block) {
                const wrapper = data.recordMap.block[id];
                if (wrapper && wrapper.value && wrapper.value.value) {
                    const block = wrapper.value.value;
                    if (block.type === 'page' && id !== pageId) {
                        // It's a nested page, let's fetch it recursively!
                        await fetchPageChunk(id);
                    } else if (block.type === 'collection_view') {
                        // It's a collection view, let's query the collection!
                        await fetchCollection(block.collection_id, block.view_ids[0]);
                    }
                }
            }
        }
    } catch (e) {
        console.error(`Error fetching page ${pageId}:`, e);
    }
}

async function fetchCollection(collectionId, viewId) {
    const key = `col_${collectionId}`;
    if (fetchedPages.has(key)) return;
    fetchedPages.add(key);
    console.log(`Querying collection: ${collectionId}...`);

    try {
        const res = await fetch('https://www.notion.so/api/v3/queryCollection', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                collection: { id: collectionId, spaceId: spaceId },
                collectionView: { id: viewId, spaceId: spaceId },
                loader: {
                    type: "reducer",
                    reducers: {
                        collection_group_by: { type: "results", limit: 100 }
                    },
                    searchQuery: "",
                    userTimeZone: "Asia/Bangkok"
                }
            })
        });

        if (!res.ok) {
            console.error(`HTTP error querying collection ${collectionId}: Status ${res.status}`);
            return;
        }

        const data = await res.json();
        if (data.recordMap && data.recordMap.block) {
            Object.assign(allBlocks, data.recordMap.block);
            
            // Fetch any pages returned in the collection rows
            for (const id in data.recordMap.block) {
                const wrapper = data.recordMap.block[id];
                if (wrapper && wrapper.value && wrapper.value.value) {
                    const block = wrapper.value.value;
                    if (block.type === 'page' && block.parent_id === collectionId) {
                        await fetchPageChunk(id);
                    }
                }
            }
        }
        
        // Also save the collection schema
        if (data.recordMap && data.recordMap.collection) {
            if (!global.collections) global.collections = {};
            Object.assign(global.collections, data.recordMap.collection);
        }
    } catch (e) {
        console.error(`Error querying collection ${collectionId}:`, e);
    }
}

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

function renderBlockToMarkdown(blockId, depth = 0, visited = new Set()) {
    if (visited.has(blockId)) return '';
    visited.add(blockId);

    const blockWrapper = allBlocks[blockId];
    if (!blockWrapper || !blockWrapper.value || !blockWrapper.value.value) return '';
    const block = blockWrapper.value.value;

    const text = getText(block.properties);
    const indent = '  '.repeat(depth);
    let md = '';

    switch (block.type) {
        case 'page':
            md += `\n${'#'.repeat(Math.min(6, depth + 1))} ${text}\n`;
            break;
        case 'header':
            md += `\n## ${text}\n`;
            break;
        case 'sub_header':
            md += `\n### ${text}\n`;
            break;
        case 'sub_sub_header':
            md += `\n#### ${text}\n`;
            break;
        case 'text':
            if (text) md += `${text}\n`;
            else md += `\n`;
            break;
        case 'bulleted_list':
            md += `${indent}- ${text}\n`;
            break;
        case 'numbered_list':
            md += `${indent}1. ${text}\n`;
            break;
        case 'to_do':
            const checked = block.properties.checked && block.properties.checked[0][0] === 'Yes';
            md += `${indent}- [${checked ? 'x' : ' '}] ${text}\n`;
            break;
        case 'code':
            const lang = (block.properties.language && block.properties.language[0][0]) || '';
            md += `\n\`\`\`${lang.toLowerCase()}\n${text}\n\`\`\`\n`;
            break;
        case 'quote':
            md += `> ${text}\n`;
            break;
        case 'callout':
            md += `\n> [!NOTE]\n> ${text}\n`;
            break;
        case 'collection_view':
            // Render collection table summary
            const colId = block.collection_id;
            const colObj = global.collections && global.collections[colId] && global.collections[colId].value;
            const colName = (colObj && colObj.name) ? colObj.name.flat().join('') : 'Database';
            md += `\n### Database: ${colName}\n`;
            
            // Find all row page blocks for this collection
            const rows = [];
            for (const bId in allBlocks) {
                const bWrapper = allBlocks[bId];
                if (bWrapper && bWrapper.value && bWrapper.value.value) {
                    const b = bWrapper.value.value;
                    if (b.type === 'page' && b.parent_id === colId) {
                        rows.push({ id: bId, title: getText(b.properties) });
                    }
                }
            }
            rows.forEach(r => {
                md += `- Sub-page: [[${r.title}]] (ID: ${r.id})\n`;
            });
            break;
        default:
            if (text) {
                md += `${indent}[${block.type}] ${text}\n`;
            }
            break;
    }

    if (block.content && block.type !== 'collection_view') {
        for (const childId of block.content) {
            md += renderBlockToMarkdown(childId, depth + 1, visited);
        }
    }

    return md;
}

global.collections = {};

async function main() {
    console.log("Starting deep recursive Notion fetch...");
    await fetchPageChunk(rootId);
    console.log("Fetch finished! Total blocks loaded:", Object.keys(allBlocks).length);
    
    // Save raw blocks JSON for reference
    fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\all_notion_blocks.json', JSON.stringify(allBlocks, null, 2));

    // Render entire workspace to a single markdown file
    console.log("Rendering workspace to markdown...");
    const fullMarkdown = renderBlockToMarkdown(rootId);
    
    fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\complete_workspace.md', fullMarkdown);
    console.log("Saved complete workspace to complete_workspace.md");
}

main();
