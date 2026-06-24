const fs = require('fs');

async function run() {
    try {
        const collectionIds = [
            '3834badc-5d57-8075-8a80-000b8970c603',
            '3834badc-5d57-809f-b769-000b2213ee0a',
            '3834badc-5d57-8066-b888-000bde70e70f',
            '3834badc-5d57-80db-a19f-000b212a4a48'
        ];

        const requests = collectionIds.map(id => ({
            table: 'collection',
            id: id
        }));

        const res = await fetch('https://www.notion.so/api/v3/getRecordValues', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ requests })
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
