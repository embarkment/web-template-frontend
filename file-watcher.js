const fs = require('fs');
const path = require('path');

const prefix = process.argv[2];
const target = process.argv[3] ?? 'dist';
const rootFilePattern = '.html';

if (!prefix) {
    throw Error('A directory must be specified!');
}

console.log(`Watching for changes in ${prefix}...`);

const watchedFiles = new Set();

let debounce = false;
fs.watch(prefix, {recursive: true}, (eventType, filename) => {
    if (!filename || filename.indexOf('~') !== -1) {
        return;
    }

    if (debounce)
    {
        console.warn(`Debounce is true, skipping event ${eventType} on file ${filename}.`);
        return;
    }

    if (eventType === 'change') {
        debounce = setTimeout(() => {
            debounce = false;
        }, 100) > -1;
    }

    const filePath = path.resolve(prefix, filename);

    let targetFilePath = path.resolve(target, prefix, filename);
    if (filename.indexOf(rootFilePattern) !== -1) {
        targetFilePath = path.resolve(target, filename);
    }

    if (eventType === 'rename' && !fs.existsSync(filePath)) {
        watchedFiles.delete(filePath);

        if (!fs.existsSync(targetFilePath))
        {
            console.warn(`File ${targetFilePath} does not exist, skipping removal.`);
            return;
        }

        fs.rmSync(targetFilePath, {recursive: true});
        console.log(`${targetFilePath} removed.`);
        return;
    }

    if (eventType === 'rename' && !watchedFiles.has(filePath)) {
        watchedFiles.add(filePath);

        let overwrite = false;
        if (fs.existsSync(targetFilePath))
        {
            console.warn(`File ${targetFilePath} already exists, overwriting.`);
            overwrite = true;
        }

        fs.cpSync(filePath, targetFilePath, { recursive: true });

        if (!overwrite) {
            console.log(`${filePath} added.`);
        }
        return;
    } else if (!watchedFiles.has(filePath)) {
        // First modification of the file.
        watchedFiles.add(filePath);
    }

    fs.cpSync(filePath, targetFilePath, { recursive: true });
    console.log(`${filePath} updated.`);
});