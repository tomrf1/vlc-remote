import * as React from 'react';
import { useState, useEffect } from 'react';
import { VideoList, PlaybackState, VideoRequest, Playing } from '../shared/models';
import { CloseIcon } from './icons/closeIcon';
import { ExpandIcon } from './icons/expandIcon';
import { PauseIcon } from './icons/pauseIcon';
import { PlayIcon } from './icons/playIcon';
import { StopIcon } from './icons/stopIcon';
import useInterval from './useInterval';

const OneSecondInUS = 1000000;

const minsAndSecs = (s: number): string => {
    const mins = `${Math.floor(s/60)}`;
    const seconds = `${s%60}`.padStart(2, '0');
    return `${mins}:${seconds}`;
}

interface TimerProps {
    playbackState: Playing;
}
function Timer(props: TimerProps): React.ReactElement<TimerProps> {
    const [position, setPosition] = useState<number>(0);
    useInterval(() => {
        if (!props.playbackState.paused && props.playbackState.position !== 0) {
            setPosition(position+1);
        }
    }, 1000);

    useEffect(() => {
        setPosition(Math.round(props.playbackState.position / OneSecondInUS));
    }, [props.playbackState.position])

    const lengthString = minsAndSecs(Math.round(props.playbackState.length / OneSecondInUS));
    const positionString = minsAndSecs(position);

    return (
        <div>{positionString} / {lengthString}</div>
    )
}

interface CollapsibleDirectoryProps {
    name: string;
    children: React.ReactNode;
}
function CollapsibleDirectory(props: CollapsibleDirectoryProps): React.ReactElement<CollapsibleDirectoryProps> {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    return (
        <>
            <div 
                className={`videoDirName ${isExpanded ? 'videoDirName-expanded' : 'videoDirName-closed'}`} 
                key={props.name}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {props.name}
                {isExpanded ? <CloseIcon /> : <ExpandIcon/>}
            </div>
            <div className={isExpanded ? '' : 'hidden'}>
                {props.children}
            </div>
        </>
    )
}

export default function Videos(): React.ReactElement {
    const [videos, setVideos] = useState<VideoList>({});
    const [playbackState, setPlaybackState] = useState<PlaybackState>(null);
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);
    const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(Date.now());

    useEffect(() => {
        if (websocket === null) {
            console.log('creating websocket connection')
            try {
                const ws = new WebSocket(`ws://${window.location.host}/video`);
                setLastMessageTimestamp(Date.now());
                ws.onopen = event => {
                    setWebsocket(ws);
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
        if (websocket) {
            if (websocket.readyState === 3 || lastMessageTimestamp < (Date.now() - 8000)) {
                console.log('heartbeat failed');
                setWebsocket(null);
            } else {
                websocket.send(JSON.stringify({type: 'PING'}));
            }
        }
    }, 4000);

    useEffect(() => {
        fetch('/videos')
            .then(resp => resp.json())
            .then(setVideos);
    }, []);

    const wsRequest = (req: VideoRequest): void => {
        if (websocket) {
            websocket.send(JSON.stringify(req));
        }
    }

    const playVideo = (path: string) => {
        if (playbackState === null) {
            wsRequest({
                type: 'START',
                path
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

    const seek = (us: number) => () => {
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

    const renderVideos = (videos: VideoList, path: string | null = null) => {
        const dirs = Object.entries(videos).filter(([key, item]) => !item.size);
        const files = Object.entries(videos).filter(([key, item]) => !!item.size);
        return (
            <div className="videoDir">
                {
                    files.map(([key, file]) => {
                        const fullPath = `${path ? `${path}/` : ''}${key}`;
                        return (
                            <div className="videoContainer">
                                <div 
                                    className="videoName button"
                                    key={key}
                                    onClick={() => playVideo(fullPath)}
                                >
                                    <span>{key}</span>
                                </div>
                                <div className="viewed">
                                    <input 
                                        type="checkbox" 
                                        defaultChecked={file.viewed === true} 
                                        id={fullPath}
                                        onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>): void => {
                                            event.currentTarget.checked === true ? setViewed(fullPath) : unsetViewed(fullPath)
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })
                }
                {
                    dirs.map(([key, dir]) => {
                        const fullPath = `${path ? `${path}/` : ''}${key}`;
                        return (
                            <>
                                <CollapsibleDirectory name={key}>
                                    {renderVideos(dir as VideoList, fullPath)}
                                </CollapsibleDirectory>
                            </>
                        )  
                    })
                }
            </div>
        );
    }

    return (
        <div className="videoPageContainer">
            <div className="videoListContainer">
                { renderVideos(videos) }
            </div>
            { playbackState && (
                <div className="playbackContainer">
                    <div className="title">
                        {playbackState.path}
                    </div>
                    <div
                        className="pauseButton button"
                        onClick={() => togglePause(playbackState.paused)}
                    >
                        {playbackState.paused ? <PlayIcon/> : <PauseIcon /> }
                    </div>
                    <div
                        className="stopButton button"
                        onClick={stop}
                    >
                        <StopIcon />
                    </div>
                    <div className="seekContainer">
                        <div
                            className="seekButton button"
                            onClick={seek(-OneSecondInUS*15)}
                        >
                            {'<<'}
                        </div>
                        <div
                            className="seekButton button"
                            onClick={seek(OneSecondInUS*15)}
                        >
                            {'>>'}
                        </div>
                    </div>
                    <Timer 
                        playbackState={playbackState}
                    />
                </div>
            )}
        </div>
    )
}
