const fs = require('fs');

const mappings = [
    { name: "Collection 1", collectionId: "3834badc-5d57-8075-8a80-000b8970c603", viewId: "3834badc-5d57-806b-90c7-000ccec286e1" },
    { name: "Collection 2", collectionId: "3834badc-5d57-809f-b769-000b2213ee0a", viewId: "3834badc-5d57-8032-900c-000c9542d7e5" },
    { name: "Collection 3", collectionId: "3834badc-5d57-8066-b888-000bde70e70f", viewId: "3834badc-5d57-8090-89ec-000c103860ba" },
    { name: "Collection 4", collectionId: "3834badc-5d57-80db-a19f-000b212a4a48", viewId: "3834badc-5d57-8055-8e88-000ce4c9e49f" }
];

const spaceId = "cf64badc-5d57-8161-b0b4-00034a8a7f7b";

async function queryCollection(mapping) {
    console.log(`Querying ${mapping.name}...`);
    try {
        const res = await fetch('https://www.notion.so/api/v3/queryCollection', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                collection: { id: mapping.collectionId, spaceId: spaceId },
                collectionView: { id: mapping.viewId, spaceId: spaceId },
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
            console.error(`Error querying ${mapping.name}: Status ${res.status}`);
            return null;
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`Fetch error for ${mapping.name}:`, err);
        return null;
    }
}

async function run() {
    let summaryText = "";
    
    for (const mapping of mappings) {
        const data = await queryCollection(mapping);
        if (!data) continue;

        summaryText += `\n=========================================\n`;
        
        // Extract collection name and schema
        let name = mapping.name;
        let schema = null;
        
        if (data.recordMap && data.recordMap.collection && data.recordMap.collection[mapping.collectionId]) {
            const collObj = data.recordMap.collection[mapping.collectionId].value;
            if (collObj) {
                name = (collObj.name && collObj.name.flat().join('')) || mapping.name;
                schema = collObj.schema;
            }
        }

        summaryText += `COLLECTION: ${name} (ID: ${mapping.collectionId})\n`;
        
        if (schema) {
            summaryText += `SCHEMA:\n`;
            for (const propId in schema) {
                const prop = schema[propId];
                summaryText += `  - ${prop.name} (ID: ${propId}, Type: ${prop.type})\n`;
            }
        } else {
            summaryText += `SCHEMA: Not found\n`;
        }

        // Extract rows
        summaryText += `ROWS:\n`;
        const blocks = data.recordMap && data.recordMap.block;
        let rowCount = 0;
        
        if (blocks) {
            for (const id in blocks) {
                const blockWrapper = blocks[id];
                if (blockWrapper && blockWrapper.value && blockWrapper.value.value) {
                    const block = blockWrapper.value.value;
                    if (block.type === 'page' && block.parent_id === mapping.collectionId) {
                        rowCount++;
                        summaryText += `  Row ${rowCount}:\n`;
                        if (block.properties) {
                            for (const propId in block.properties) {
                                const propName = schema && schema[propId] ? schema[propId].name : propId;
                                const propVal = block.properties[propId].flat().join('');
                                summaryText += `    ${propName}: ${propVal}\n`;
                            }
                        }
                    }
                }
            }
        }
        
        summaryText += `Total Rows Found: ${rowCount}\n`;
    }

    console.log(summaryText);
    fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\scratch\\collections_summary.txt', summaryText);
}

run();
