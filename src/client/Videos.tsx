import * as React from 'react';
import { useState, useEffect } from 'react';
import { VideoList, Video, PlaybackState, VideoRequest } from '../shared/models';
import { Directory } from './Directory';
import { Player } from './Player';
import useInterval from './useInterval';
import * as O from '../shared/option';

export default function Videos(): React.ReactElement {
    const [videos, setVideos] = useState<VideoList>({});
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [playbackState, setPlaybackState] = useState<O.Option<PlaybackState>>(O.none);
    const [websocket, setWebsocket] = useState<O.Option<WebSocket>>(O.none);
    const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(Date.now());
    const [subtitles, setSubtitles] = useState<boolean>(false);

    useEffect(() => {
        if (O.isEmpty(websocket)) {
            console.log('creating websocket connection')
            try {
                const ws = new WebSocket(`ws://${window.location.host}/video`);
                setLastMessageTimestamp(Date.now());
                ws.onopen = event => {
                    setWebsocket(O.some(ws));
                    setLastMessageTimestamp(Date.now());
                }
                ws.onmessage = event => {
                    setLastMessageTimestamp(Date.now());
                    const data = JSON.parse(event.data);
                    switch(data.type) {
                        case 'PLAYBACK':
                            console.log('PLAYBACK update', data)
                            setPlaybackState(data.playbackState);
                            break;
                        case 'ACK':
                            console.log('ACK')
                            break;
                        case 'NACK':
                            console.log('NACK')
                            alert(`Request failed: ${data.reason}`)
                            break;
                        default:
                            console.log('unknown event:', data)
                    }
                };
            } catch (err) {
                console.log(err)
                alert('websocket failed')
            }
        }
    }, [websocket]);

    useInterval(() => {
        O.map(websocket)(ws => {
            if (ws.readyState === 3 || lastMessageTimestamp < (Date.now() - 8000)) {
                console.log('heartbeat failed');
                setWebsocket(O.none);
            } else {
                ws.send(JSON.stringify({type: 'PING'}));
            }
        })
    }, 4000);

    useEffect(() => {
        fetch('/videos')
            .then(resp => resp.json())
            .then(videos => {
                setVideos(videos);
            });
    }, []);

    const wsRequest = (req: VideoRequest): void => {
        O.map(websocket)(ws => {
            ws.send(JSON.stringify(req));
        });
    }

    const playVideo = (path: string) => {
        if (O.isEmpty(playbackState)) {
            wsRequest({
                type: 'START',
                path,
                subtitles,
            });
        }
    }

    const togglePause = (paused: boolean) => {
        wsRequest({
            type: paused ? 'RESUME' : 'PAUSE'
        })
    }

    const stop = () => {
        wsRequest({
            type: 'STOP'
        });
    }

    const seek = (us: number) => {
        wsRequest({
            type: 'SEEK',
            us
        });
    }

    const setViewed = (path: string) => {
        fetch(`/videos/viewed/${path}`, { method: 'POST'})
            .then(r => console.log(r))
    }
    const unsetViewed = (path: string) => {
        fetch(`/videos/viewed/${path}`, { method: 'DELETE'})
            .then(r => console.log(r))
    }

    const path = currentPath.join('/');
    const buildPath = (name: string) => `${path !== '' ? path + '/' : ''}${name}`;

    const dir: VideoList = currentPath.reduce((currentDir, next) => 
        (currentDir[next] && !currentDir[next].size) ? currentDir[next] as VideoList : currentDir,
        videos
    );

    const dirs = Object.keys(dir).filter(key => !dir[key].size);
    const files = Object.entries(dir).filter(([key, item]) => !!item.size) as [string,Video][];

    return (
        <div className="videoPageContainer">
            <Directory
                path={path}
                dirs={dirs}
                files={files}
                subtitles={subtitles}
                onBack={() => {
                    setCurrentPath(currentPath.slice(0, -1));
                }}
                onOpen={(name: string) => setCurrentPath(currentPath.concat(name))}
                onPlay={(name: string) => playVideo(buildPath(name))}
                setViewed={(name: string) => setViewed(buildPath(name))}
                unsetViewed={(name: string) => unsetViewed(buildPath(name))}
                setSubtitles={setSubtitles}
            />
            { O.nonEmpty(playbackState) &&
                <Player
                    playbackState={playbackState.value}
                    onTogglePause={togglePause}
                    onStop={stop}
                    onSeek={seek}
                />
            }
        </div>
    )
}
