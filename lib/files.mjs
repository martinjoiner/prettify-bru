import fs from 'fs';
import path from 'path'

/**
 * @param {string} filePath
 * @returns {string}
 */
export function readFile(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns void
 */
export function writeFile(filePath, contents) {
    fs.writeFileSync(filePath, contents, "utf8")
}

export function findFiles(path) {
    const files = [];

    if (path.match(/\.bru$/) && fs.existsSync(path)) {
        return [path]
    }

    walkDir(path, (p) => {
        if (p.endsWith(".bru")) files.push(p);
    });
    return files;
}

/**
 * @callback fileCallback
 * @param {string} fullPath
 */

/**
 * @param {string} dir
 * @param {fileCallback} onFile
 */
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
