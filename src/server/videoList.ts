import * as fs from 'fs';
import * as path from 'path';
import { VideoList, Video } from '../shared/models';

export const fetchVideoList = (p: string, history: string[]): Promise<VideoList> =>
    fs.promises.readdir(p).then(files => {
        const videoLists: Promise<VideoList>[] = files.map(fileName => {
            const filePath = path.resolve(p, fileName);
            return fs.promises.stat(filePath).then(stat => {
                if (stat && stat.isDirectory()) {
                    return fetchVideoList(filePath, history)
                        .then(videoList => ({[fileName]: videoList}));
                } else {
                    const viewed = history.includes(`${p}/${fileName}`);
                    const video: Video = {
                        size: stat.size,
                        created: stat.birthtime.toISOString(),
                        viewed: viewed
                    };
                    return Promise.resolve({[fileName]: video});
                }
            })
        })
        return Promise.all(videoLists).then(vls => 
            vls.reduce<VideoList>((acc, vl) => {
                return {
                    ...acc,
                    ...vl
                }
            }, {})
        )
    });
