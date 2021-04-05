import * as fs from 'fs';

const FILE_PATH = './video-history.txt';

const getVideoHistory = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(FILE_PATH)) {
            fs.readFile(FILE_PATH, function(err, data) {
                if (err) {
                    return reject(err);
                }
                const lines = data.toString().split("\n").map(l => l.trim()).filter(l => l !== '');
                return resolve(lines);
            });
        } else {
            return resolve([]);
        }
    })
};

const updateVideoHistory = (path: string, viewed: boolean) => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(FILE_PATH)) {
            fs.readFile(FILE_PATH, function(err, data) {
                if (err) {
                    return reject(err);
                }
                const lines = data.toString().split("\n").map(l => l.trim()).filter(l => l !== '');
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
                fs.writeFile(FILE_PATH, lines.join('\n'), function(err) {
                    if (err) {
                        reject(err);
                    }
                })
                resolve(path)
            })
        } else if (viewed) {
            fs.writeFile(FILE_PATH, path, function(err) {
                if (err) {
                    reject(err);
                }
                resolve(path);
            })
        } else {
            resolve(path);
        }
    })
}

export { getVideoHistory, updateVideoHistory }
