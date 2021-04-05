import { PlaybackState, VideoList } from '../shared/models';
import { getVideoHistory } from './videoHistory';
import { fetchVideoList } from './videoList';
import * as Vlc from './vlc';

const VIDEO_PATH = process.env.VIDEO_PATH;

class VideoState {
    playbackState: PlaybackState;
    videoList: VideoList;
    positionPoller: NodeJS.Timeout | null;
    onUpdate: (playbackState: PlaybackState) => void;

    constructor(onUpdate: (playbackState: PlaybackState) => void) {
        this.playbackState = null;
        this.videoList = {};
        this.positionPoller = null;
        this.onUpdate = onUpdate;
    }

    getPlaybackState(): PlaybackState {
        return this.playbackState;
    }
    getVideoList(): VideoList {
        return this.videoList;
    }
    refreshVideoList() {
        getVideoHistory()
            .then(history => fetchVideoList(VIDEO_PATH, history))
            .then(newList => {
                this.videoList = newList;
            });
    }
    isValidPath(path: string, videos: VideoList = this.videoList): boolean {
        const dirs = path.split('/');
        if (dirs.length > 1) {
            if (videos[dirs[0]]) {
                return this.isValidPath(
                    dirs.slice(1).join('/'),
                    videos[dirs[0]] as VideoList
                );
            } else {
                return false;
            }
        } else if (videos[path]) {
            return true;
        } else {
            return false;
        }
    }
    refreshPosition(): void {
        Vlc.position().then(position => {
            this.playbackState = {
                ...this.playbackState,
                position
            }
            this.onUpdate(this.playbackState);
        })
    }
    start(path: string): void {
        this.playbackState = {
            path,
            paused: false,
            position: 0,
            length: 0
        }
        this.onUpdate(this.playbackState);

        // Give it a chance to start
        setTimeout(() => {
            Vlc.length().then(({length}) => {
                this.playbackState = {
                    ...this.playbackState,
                    length
                }
                this.onUpdate(this.playbackState);
            });
            this.refreshPosition();
            this.positionPoller = setInterval(this.refreshPosition.bind(this), 5000);
        }, 4000);
    }
    pause() {
        this.playbackState = {
            ...this.playbackState,
            paused: true
        }
        this.onUpdate(this.playbackState);
    }
    resume() {
        this.playbackState = {
            ...this.playbackState,
            paused: false
        }
        this.onUpdate(this.playbackState);
    }
    stop() {
        clearInterval(this.positionPoller);
        this.playbackState = null;
        this.onUpdate(this.playbackState);
    }
}

export {
    VideoState,
    VIDEO_PATH
}
