import * as React from 'react';
import { useState, useEffect } from 'react';
import { VideoList } from '../shared/models';

interface Playing {
    path: string;
    paused: boolean;
}
type PlaybackState = null | Playing;

export default function Videos(): React.ReactElement {
    const [videos, setVideos] = useState<VideoList>({});
    const [playbackState, setPlaybackState] = useState<PlaybackState>(null);

    useEffect(() => {
        fetch('/videos')
            .then(resp => resp.json())
            .then(setVideos);
    }, []);

    const playVideo = (path: string) => {
        if (playbackState === null) {
            fetch(
                `/videos/${path}`,
                { method: 'PUT' }
            ).then(result => {
                if (result.ok) {
                    setPlaybackState({path: path, paused: false});
                }
            });
        }
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
                    setPlaybackState({...playbackState, paused: true});
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
                </div>
            )}
        </div>
    )
}
