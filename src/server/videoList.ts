import * as fs from 'fs';
import * as path from 'path';
import { VideoList, Video } from '../shared/models';

export const fetchVideoList = (p: string, history: string[]): Promise<VideoList> => new Promise((resolve, reject) => {
    fs.readdir(p, function(err, list) {
        if (err) {
            reject(err)
        } else {
            const fPs: Promise<[string, Video | VideoList]>[] = list.map(f => {
                return new Promise<[string, Video | VideoList]>((fResolve, fReject) => {
                    const file = path.resolve(p, f);
                    fs.stat(file, (err, stat) => {
                        if (err) {
                            fReject(err)
                        } else {
                            if (stat && stat.isDirectory()) {
                                fetchVideoList(file, history).then(r => fResolve([f, r]));
                            } else {
                                const viewed = history.includes(`${p}/${f}`);
                                fResolve([f, {size: stat.size, created: stat.birthtime.toISOString(), viewed: viewed}]);
                            }
                        }
                    })
                });
            });
            Promise.all(fPs).then(ps => {
                resolve(ps.reduce((acc, [k,v]) => {
                    acc[k] = v;
                    return acc;
                }, {}));
            })
        }
    });
});
