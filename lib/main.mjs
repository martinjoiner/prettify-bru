import {findFiles, readFile, writeFile} from './files.mjs';
import {formatBlocks} from './format.mjs'

/**
 * Finds all .bru files and formats contents
 *
 * @param {object} console The console to be used for outputting messages
 * @param {string} cwd Current working directory
 * @param {string} path
 * @param {boolean} write
 * @param {?string} only Limit to only the block type with a name containing value
 * @returns {Promise<void>}
 */
export async function main(console, cwd, path, write, only = null) {

    if (path === '') {
        path = cwd
    } else {
        // Append the relative path to the current working directory
        path = cwd + '/' + path
    }

    const files = findFiles(path);

    if (files.length === 0) {
        console.log("No .bru files found.");
        return;
    }

    console.log(`Found ${files.length} .bru file(s)\n`);

    let changeableFiles = [];
    let erroredFiles = [];

    for (const filePath of files) {
        const outcome = await processFile(filePath, write, only);

        let displayFilePath = filePath.replace(new RegExp('^' + cwd + '/'), "");

        if (outcome.changeable) {
            changeableFiles.push({displayFilePath, outcome});
        } else if (outcome.error_messages.length) {
            erroredFiles.push({displayFilePath, outcome});
        }
    }

    const changeablePrefix = write ? 'Reformatted blocks' : 'Found blocks that need reformatting';

    if (changeableFiles.length) {
        const emoji = write ? '✏️' : '🔍';
        console.log(`\x1b[4m\x1b[32m${changeablePrefix} in ${changeableFiles.length} file(s):\x1b[0m\n`);
        changeableFiles.forEach((r) => console.log(`${emoji}  \x1b[32m${r.displayFilePath}\x1b[0m`));
        console.log(" ")
    }

    if (erroredFiles.length) {
        console.warn(`\x1b[4m\x1b[33mEncountered errors in ${erroredFiles.length} file(s):\x1b[0m\n`);
        erroredFiles.forEach((r, i) => {
            console.warn(`${i + 1}) ${r.displayFilePath}\n`)
            r.outcome.error_messages.forEach((err) => {
                console.warn(`⚠️  \x1b[33m${err}\x1b[0m\n`)
            })
        })
    }

    const requireNothing = files.length - changeableFiles.length - erroredFiles.length;
    console.log(
        `\x1b[35mProcessed ${files.length} .bru file(s):\x1b[0m ${changeablePrefix} in ${changeableFiles.length}. `
        + `Encountered errors in ${erroredFiles.length}. ${requireNothing} file(s) did not require any changes.`
    );
}

/**
 * @param {string} filePath
 * @param {boolean} write
 * @param {?string} only Limit to only the block type with a name containing value
 * @returns {Promise<void>}
 */
async function processFile(filePath, write, only) {
    const original = readFile(filePath);

    const fileOutcome = await formatBlocks(original, only);

    if (write && fileOutcome.changeable > 0) {
        writeFile(filePath, fileOutcome.newContents);
    }

    return fileOutcome;
}
