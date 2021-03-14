import * as React from 'react';
import { useState, useEffect } from 'react';
import { VideoList } from '../shared/models';
import useInterval from './useInterval';

interface Playing {
    path: string;
    paused: boolean;
    position: number;
}
type PlaybackState = null | Playing;

const OneSecondInUS = 1000000;

const minsAndSecs = (s: number): string => {
    const mins = `${Math.floor(s/60)}`;
    const seconds = `${s%60}`.padStart(2, '0');
    return `${mins}:${seconds}`;
}

interface TimerProps {
    playbackState: PlaybackState;
    setPosition: (position: number) => void;
    length?: number;
}
function Timer(props: TimerProps): React.ReactElement<TimerProps> {
    useInterval(() => {
        if (!props.playbackState.paused) {
            props.setPosition(props.playbackState.position+1)
        }
    }, 1000);

    const lengthString = props.length ? ` / ${minsAndSecs(props.length)}` : '';

    return (
        <div>{minsAndSecs(props.playbackState.position)}{lengthString}</div>
    )
}

export default function Videos(): React.ReactElement {
    const [videos, setVideos] = useState<VideoList>({});
    const [playbackState, setPlaybackState] = useState<PlaybackState>(null);
    const [length, setLength] = useState<number | null>(null);

    useEffect(() => {
        fetch('/videos')
            .then(resp => resp.json())
            .then(setVideos);
    }, []);

    const fetchPosition = (): Promise<number> =>
        fetch('/video/position')
            .then(resp => resp.json())
            .then(json => Math.round(json.position as number / OneSecondInUS));

    const playVideo = (path: string) => {
        if (playbackState === null) {
            fetch(
                `/videos/${path}`,
                { method: 'PUT' }
            ).then(result => {
                if (result.ok) {
                    setPlaybackState({path: path, paused: false, position: 0});

                    setTimeout(() => fetch('video/length')
                        .then(resp => resp.json())
                        .then(json => {
                            setLength(Math.round(json.length / OneSecondInUS))
                        }),
                        2000
                    );
                }
            })
        }
    }

    const togglePause = (paused: boolean) => {
        if (paused) {
            fetch('/video/resume', { method: 'PUT' }).then(resp => {
                if (resp.ok) {
                    setPlaybackState({...playbackState, paused: false});
                }
            })
        } else {
            fetch('/video/pause', { method: 'PUT' }).then(resp => {
                if (resp.ok) {
                    fetchPosition().then(position => 
                        setPlaybackState({
                            ...playbackState,
                            paused: true,
                            position
                        })
                    );
                }
            })
        }
    }

    const stop = () => {
        fetch('/video/stop', { method: 'PUT'} ).then(resp => {
            if (resp.ok) {
                setPlaybackState(null);
            }
        })
    }

    const seek = (us: number) => () => {
        fetch(`/video/seek/${us}`, { method: 'PUT'})
            .then(fetchPosition)
            .then(position => setPlaybackState({
                ...playbackState,
                position
            })
        )
    }

    const renderVideos = (videos: VideoList, path: string) => (
        <div className="videoDir">
            {
                Object.keys(videos).map(key => {
                    if (videos[key].size) {
                        return (
                            <div 
                                className="videoName button"
                                key={key}
                                onClick={() => playVideo(`${path}/${key}`)}
                            >
                                <span>{key}</span>
                            </div>
                        )
                    } else {
                        return (
                            <>
                                <div className="videoDirName" key={key}>{key}</div>
                                {renderVideos(videos[key] as VideoList, `${path}/${key}`)}
                            </>
                        )                 
                    }
                })
            }
        </div>
    );

    return (
        <div>
            { renderVideos(videos, '') }
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
                        setPosition={position => setPlaybackState({...playbackState, position})}
                        length={length}
                    />
                </div>
            )}
        </div>
    )
}
