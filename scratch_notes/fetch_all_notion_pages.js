const fs = require('fs');
const path = require('path');

const spaceId = "cf64badc-5d57-8161-b0b4-00034a8a7f7b";
const collectionId = "3834badc-5d57-8050-934e-000bcad1d13b";
const viewId = "3834badc-5d57-80bd-902c-000c41622ad9"; // Table view

async function queryCollection() {
    console.log("Querying Project information collection...");
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
        throw new Error(`Failed to query collection: Status ${res.status}`);
    }

    return await res.json();
}

async function fetchPageChunk(pageId) {
    console.log(`Fetching page chunk for page: ${pageId}...`);
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
        throw new Error(`Failed to fetch page chunk: Status ${res.status}`);
    }

    return await res.json();
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

function parseBlocksToMarkdown(blocks, rootPageId) {
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

    renderBlock(rootPageId);
    
    // Render any remaining blocks
    for (const id in blocks) {
        if (!visited.has(id)) {
            renderBlock(id);
        }
    }

    return markdownLines.join('\n');
}

async function run() {
    try {
        const collectionData = await queryCollection();
        const blocks = collectionData.recordMap.block;
        
        // Find row pages
        const pages = [];
        for (const id in blocks) {
            const block = blocks[id].value.value;
            if (block && block.type === 'page' && block.parent_id === collectionId) {
                const title = block.properties && block.properties.title ? block.properties.title.flat().join('') : 'Untitled';
                pages.push({ id, title });
            }
        }

        console.log(`Found ${pages.length} sub-pages in Project information collection:`);
        pages.forEach(p => console.log(` - ${p.title} (ID: ${p.id})`));

        // Fetch each page and parse it
        for (const page of pages) {
            const pageData = await fetchPageChunk(page.id);
            const md = parseBlocksToMarkdown(pageData.recordMap.block, page.id);
            
            const sanitizedTitle = page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const outPath = `C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\${sanitizedTitle}.md`;
            
            fs.writeFileSync(outPath, md);
            console.log(`Saved parsed markdown for "${page.title}" to ${outPath}`);
        }
        
        console.log("All sub-pages successfully fetched and processed!");
    } catch (err) {
        console.error(err);
    }
}

run();
