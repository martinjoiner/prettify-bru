import fs from 'fs'
import path from 'path'
import {formatBlocks} from './format.mjs'

/**
 * Finds all .bru files and formats contents
 *
 * @param cwd {String} Current working directory
 * @param path {String}
 * @param write {Boolean}
 * @returns {Promise<void>}
 */
export async function main(cwd, path, write) {

    if (path === '') {
        path = cwd
    } else {
        // Append the relative path to the current working directory
        path = cwd + '/' + path
    }

    const files = [];

    walkDir(path, (p) => {
        if (p.endsWith(".bru")) files.push(p);
    });

    if (files.length === 0) {
        console.log("No .bru files found.");
        return;
    }

    console.log(`Found ${files.length} .bru file(s)\n`);

    let changeableFiles = [];
    let erroredFiles = [];

    for (const filePath of files) {
        const outcome = await processFile(filePath, write);

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

function walkDir(dir, onFile) {
    // Skip node_modules by default
    const skip = new Set(["node_modules", ".git"]);
    let entries;
    try {
        entries = fs.readdirSync(dir, {withFileTypes: true});
    } catch (e) {
        return;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (skip.has(entry.name)) continue;
            walkDir(full, onFile);
        } else if (entry.isFile()) {
            onFile(full);
        }
    }
}

async function processFile(filePath, write) {
    const original = fs.readFileSync(filePath, "utf8");

    const fileOutcome = await formatBlocks(original);

    if (write && fileOutcome.changeable) {
        fs.writeFileSync(filePath, fileOutcome.newContents, "utf8");
    }

    return fileOutcome;
}
