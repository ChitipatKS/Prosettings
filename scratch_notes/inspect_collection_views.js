const pageId = '3834badc-5d57-8073-be90-ec9e12c94c42';

async function run() {
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

        const data = await res.json();
        for (const id in data.recordMap.block) {
            const block = data.recordMap.block[id].value.value;
            if (block && block.type === 'collection_view') {
                console.log(`Block collection_view ${id}:`, JSON.stringify(block, null, 2));
            }
        }
    } catch (err) {
        console.error(err);
    }
}

run();
