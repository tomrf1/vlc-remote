import * as fs from 'fs';

const FILE_PATH = './video-history.txt';

const bufferToLines = (buffer: Buffer): string[] => buffer
    .toString()
    .split("\n")
    .map(l => l.trim())
    .filter(l => l !== '');

const fileExists = (path: string): Promise<boolean> => new Promise((resolve, reject) => 
    fs.stat(FILE_PATH, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                resolve(false);
            } else {
                reject(`${err}`);
            }
        } else {
            resolve(true);
        }
    })
);

const getVideoHistory = (): Promise<string[]> =>
    fileExists(FILE_PATH).then(exists => {
        if (exists) {
            return fs.promises.readFile(FILE_PATH).then(bufferToLines);
        } else {
            return Promise.resolve([]);
        }
    });

const modifyHistoryData = (lines: string[], path: string, viewed: boolean): string[] => {
    const idx = lines.findIndex(l => l.trim() === path);
    if (idx >= 0) {
        if (viewed) {
            lines.splice(idx, 1, path);
        } else {
            lines.splice(idx, 1);
        }
    } else if (viewed) {
        lines.push(path);
    }
    return lines;
}

// Returns true if a new file was created
const updateVideoHistory = (path: string, viewed: boolean): Promise<boolean> =>
    fileExists(FILE_PATH).then(exists => {
        if (exists) {
            return fs.promises.readFile(FILE_PATH)
                .then(bufferToLines)
                .then(lines => modifyHistoryData(lines, path, viewed))
                .then(lines => fs.promises.writeFile(FILE_PATH, lines.join('\n')))
                .then(() => false);
        } else if (viewed) {
            return fs.promises.writeFile(FILE_PATH, path)
                .then(() => true);
        } else {
            return Promise.resolve(false);
        }
    });

export { getVideoHistory, updateVideoHistory }
