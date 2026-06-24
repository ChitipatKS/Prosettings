const fs = require('fs');
const path = require('path');

const filePath = `C:\\Users\\Admin\\.gemini\\antigravity\\brain\\e859e578-ad51-41c0-9716-8608490ec7df\\.system_generated\\steps\\3\\content.md`;
const content = fs.readFileSync(filePath, 'utf8');

console.log("Length of content:", content.length);

// Let's search for "Prosettings" or something similar
const regex = /Prosettings/gi;
let match;
while ((match = regex.exec(content)) !== null) {
    console.log(`Found "Prosettings" at index ${match.index}. Context: ${content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 100))}\n`);
}

// Let's also look for any large json scripts or text elements
// Let's extract script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let scriptCount = 0;
while ((match = scriptRegex.exec(content)) !== null) {
    scriptCount++;
    const scriptContent = match[1];
    if (scriptContent.includes('boot_data') || scriptContent.includes('bootReady') || scriptContent.includes('statsigResults')) {
        console.log(`Script ${scriptCount} contains interesting keys. Length: ${scriptContent.length}`);
        console.log(scriptContent.substring(0, 500));
    }
}
