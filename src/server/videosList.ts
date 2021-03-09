const fs = require('fs');
const path = require('path');
import { VideoList, Video } from '../shared/models';

export const getVideosList = (p: string): Promise<VideoList> => new Promise((resolve, reject) => {
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
                                getVideosList(file).then(r => fResolve([f, r]));
                            } else {
                                fResolve([f, {size: stat.size, created: stat.birthtime}]);
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
