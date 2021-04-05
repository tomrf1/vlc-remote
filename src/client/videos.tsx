import * as React from 'react';
import { useState, useEffect } from 'react';
import { VideoList, PlaybackState, VideoRequest, Playing } from '../shared/models';
import { CloseIcon } from './icons/close-icon';
import { ExpandIcon } from './icons/expand-icon';
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

    useEffect(() => {
        try {
            const ws = new WebSocket(`ws://${window.location.host}/video`);
            ws.onopen = event => {
                setWebsocket(ws);
            }
            ws.onmessage = event => {
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
                        alert('Request failed')
                        break;
                    default:
                        console.log('unknown event:', data)
                }
            };
        } catch (err) {
            console.log(err)
            alert('websocket failed')
        }
    }, []);

    useEffect(() => {
        fetch('/videos')
            .then(resp => resp.json())
            .then(setVideos);
    }, []);

    const wsRequest = (req: VideoRequest): void => websocket.send(JSON.stringify(req));

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

    const renderVideos = (videos: VideoList, path: string | null = null) => (
        <div className="videoDir">
            {
                Object.keys(videos).map(key => {
                    const fullPath = `${path ? `${path}/` : ''}${key}`;
                    if (videos[key].size) {
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
                                    <label htmlFor={fullPath}>Viewed</label>
                                    <input 
                                        type="checkbox" 
                                        defaultChecked={videos[key].viewed === true} 
                                        id={fullPath}
                                        onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>): void => {
                                            event.currentTarget.checked === true ? setViewed(fullPath) : unsetViewed(fullPath)
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    } else {
                        return (
                            <>
                                <CollapsibleDirectory name={key}>
                                    {renderVideos(videos[key] as VideoList, fullPath)}
                                </CollapsibleDirectory>
                            </>
                        )                 
                    }
                })
            }
        </div>
    );

    return (
        <div>
            <div className="videoListContainer">
                { renderVideos(videos) }
            </div>
            { playbackState && (
                <div className="playbackContainer">
                    {playbackState.path}
                    <div
                        className="pauseButton button"
                        onClick={() => togglePause(playbackState.paused)}
                    >
                        {playbackState.paused ? 'Resume' : 'Pause'}
                    </div>
                    <div
                        className="stopButton button"
                        onClick={stop}
                    >
                        Stop
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
