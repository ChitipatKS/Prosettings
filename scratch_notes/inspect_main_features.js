const pageId = '3834badc-5d57-80c7-9e3f-dbfefb4f076f';

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
        console.log("Blocks keys for Main Features:", Object.keys(data.recordMap.block));
        for (const id in data.recordMap.block) {
            const block = data.recordMap.block[id].value.value;
            if (block) {
                console.log(`ID: ${id}, Type: ${block.type}, Title:`, block.properties ? JSON.stringify(block.properties.title) : 'none');
                if (block.content) console.log(`  Content:`, block.content);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

run();
