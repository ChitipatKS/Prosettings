const pageId = '3824badc-5d57-80a2-bb77-c04f521cc746'; // 3824badc5d5780a2bb77c04f521cc746

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

        console.log('Status:', res.status);
        const data = await res.json();
        
        if (data.recordMap && data.recordMap.block) {
            console.log('Successfully fetched blocks!');
            const blocks = data.recordMap.block;
            for (const blockId in blocks) {
                const block = blocks[blockId].value;
                if (block && block.properties && block.properties.title) {
                    console.log(`Block [${block.type}]:`, block.properties.title.map(t => t[0]).join(''));
                }
            }
            // Save full JSON for inspection
            fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\notion_blocks.json', JSON.stringify(data, null, 2));
        } else {
            console.log('No blocks returned. Maybe private page? Data keys:', Object.keys(data));
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Error fetching page:', err);
    }
}

const fs = require('fs');
run();
