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

        console.log('Status:', res.status);
        const data = await res.json();
        
        fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\schema_blocks.json', JSON.stringify(data, null, 2));
        console.log('Saved to schema_blocks.json');
    } catch (err) {
        console.error('Error fetching page:', err);
    }
}

const fs = require('fs');
run();
