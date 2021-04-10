import { ChildProcess } from 'child_process';
import { PlaybackState, VideoList } from '../shared/models';
import { getVideoHistory } from './videoHistory';
import { fetchVideoList } from './videoList';
import * as Vlc from './vlc';

const VIDEO_PATH = process.env.VIDEO_PATH || '';

class VideoState {
    playbackState: PlaybackState;
    vlcProcess: ChildProcess | null;
    videoList: VideoList;
    positionPoller: NodeJS.Timeout | null;
    onUpdate: (playbackState: PlaybackState) => void;

    constructor(onUpdate: (playbackState: PlaybackState) => void) {
        this.playbackState = null;
        this.vlcProcess = null;
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
            })
            .catch(err => {
                console.log('Failed to refresh video list', err);
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
        Vlc
            .position()
            .then(position => {
                if (this.playbackState) {
                    this.playbackState = {
                        ...this.playbackState,
                        position: parseInt(position)
                    }
                    this.onUpdate(this.playbackState);
                }
            })
            .catch(err => {
                console.log('Failed to refresh position', err);
            });
    }
    fetchLength(): void {
        Vlc
            .length()
            .then(length => {
                if (this.playbackState) {
                    this.playbackState = {
                        ...this.playbackState,
                        length
                    }
                    this.onUpdate(this.playbackState);
                }
            })
            .catch(err => {
                console.log('Failed to fetch length', err);
            });
    }
    start(path: string, process: ChildProcess): void {
        console.log('starting', path)
        this.playbackState = {
            path,
            paused: false,
            position: 0,
            length: 0
        }

        process.on('exit', code => {
            console.log(`VLC child process exited with code ${code}`);
            this.stopped();
        });
        process.on('error', err => {
            console.log(`VLC child process failed with error ${err}`);
            this.stopped();
        });
        this.vlcProcess = process;

        this.onUpdate(this.playbackState);

        // Give it a chance to start before fetching time data
        setTimeout(() => {
            this.fetchLength();
            this.refreshPosition();
            this.positionPoller = setInterval(this.refreshPosition.bind(this), 5000);
        }, 4000);
    }
    pause() {
        if (this.playbackState) {
            this.playbackState = {
                ...this.playbackState,
                paused: true
            }
            this.onUpdate(this.playbackState);
        }
    }
    resume() {
        if (this.playbackState) {
            this.playbackState = {
                ...this.playbackState,
                paused: false
            }
            this.onUpdate(this.playbackState);
        }
    }
    stopped() {
        this.vlcProcess = null;
        if (this.positionPoller) {
            clearInterval(this.positionPoller);
        }
        this.playbackState = null;
        this.onUpdate(this.playbackState);
    }
    stop() {
        if (this.vlcProcess) {
            console.log('Killing vlc process...')
            this.vlcProcess.kill('SIGTERM')
        } else {
            // This shouldn't happen...
            this.stopped();
        }
    }
}

export {
    VideoState,
    VIDEO_PATH
}
