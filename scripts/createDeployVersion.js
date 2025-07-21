const fs = require('fs');

const inputFilePath = '../src/activityFeedFilter.user.js';
const outputFilePath = '../out/activityFeedFilter.user.js';

fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading input file:', err);
    } else {
        const modifiedCode = data
            .replace(/if \(require\.main === module\) \{[\s\S]*?initializeApp\(\);[\s\S]*?}/, 'initializeApp();')
            .replace(/module\.exports = \{[^{}]*};/, '')
            .replace(/\/\/\s*noinspection.*(\r\n|\r|\n)/g, '')
            .trim() + '\n';

        fs.writeFile(outputFilePath, modifiedCode, 'utf8', (err) => {
            if (err) {
                console.error('Error writing output file:', err);
            } else {
                console.log('Code has been modified and saved to the output file.');
            }
        });
    }
});
