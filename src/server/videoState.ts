import { ChildProcess } from 'child_process';
import { PlaybackState, VideoList } from '../shared/models';
import { getVideoHistory } from './videoHistory';
import { fetchVideoList } from './videoList';
import * as Vlc from './vlc';
import * as O from '../shared/option';

const VIDEO_PATH = process.env.VIDEO_PATH || '';

class VideoState {
    playbackState: O.Option<PlaybackState>;
    vlcProcess: O.Option<ChildProcess>;
    videoList: VideoList;
    positionPoller: O.Option<NodeJS.Timeout>;
    onUpdate: (playbackState: O.Option<PlaybackState>) => void;

    constructor(onUpdate: (playbackState: O.Option<PlaybackState>) => void) {
        this.playbackState = O.none;
        this.vlcProcess = O.none;
        this.videoList = {};
        this.positionPoller = O.none;
        this.onUpdate = onUpdate;
    }

    getPlaybackState(): O.Option<PlaybackState> {
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
                O.map(this.playbackState)(state => {
                    this.playbackState = O.some({
                        ...state,
                        position: parseInt(position)
                    });
                    this.onUpdate(this.playbackState);
                });
            })
            .catch(err => {
                console.log('Failed to refresh position', err);
            });
    }
    fetchLength(): void {
        Vlc
            .length()
            .then(length => {
                O.map(this.playbackState)(state => {
                    console.log('Got length', length);
                    this.playbackState = O.some({
                        ...state,
                        length
                    });
                    this.onUpdate(this.playbackState);
                })
            })
            .catch(err => {
                console.log('Failed to fetch length', err);
                O.map(this.playbackState)(() => {
                    setTimeout(() => {
                        this.fetchLength.bind(this)();
                    }, 4000);
                });
            });
    }
    start(path: string, process: ChildProcess): void {
        console.log('starting', path)
        this.playbackState = O.some({
            path,
            paused: false,
            position: 0,
            length: 0
        });

        process.on('exit', code => {
            console.log(`VLC child process exited with code ${code}`);
            this.stopped();
        });
        process.on('error', err => {
            console.log(`VLC child process failed with error ${err}`);
            this.stopped();
        });
        this.vlcProcess = O.some(process);

        this.onUpdate(this.playbackState);

        // Give it a chance to start before fetching time data
        setTimeout(() => {
            this.fetchLength();
            this.refreshPosition();
            this.positionPoller = O.some(setInterval(this.refreshPosition.bind(this), 5000));
        }, 2000);
    }
    pause() {
        O.map(this.playbackState)(state => {
            this.playbackState = O.some({
                ...state,
                paused: true
            });
            this.onUpdate(this.playbackState);
        });
    }
    resume() {
        O.map(this.playbackState)(state => {
            this.playbackState = O.some({
                ...state,
                paused: false
            });
            this.onUpdate(this.playbackState);
        });
    }
    stopped() {
        this.vlcProcess = O.none;
        O.map(this.positionPoller)(clearInterval);
        this.playbackState = O.none;
        this.onUpdate(this.playbackState);
    }
    stop() {
        O.fold(this.vlcProcess)(
            process => {
                console.log('Killing vlc process...')
                process.kill('SIGTERM')
            },
            () => {
                // This shouldn't happen...
                this.stopped();
            }
        )
    }
}

export {
    VideoState,
    VIDEO_PATH
}
