import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { PlaybackState } from '../shared/models';
import { removeExtension } from './utils';
import useInterval from './useInterval';
import { PauseIcon } from './icons/pauseIcon';
import { PlayIcon } from './icons/playIcon';
import { StopIcon } from './icons/stopIcon';

const OneSecondInUS = 1000000;

const minsAndSecs = (s: number): string => {
    const mins = `${Math.floor(s/60)}`;
    const seconds = `${s%60}`.padStart(2, '0');
    return `${mins}:${seconds}`;
}

interface ProgressBarProps {
    playbackState: PlaybackState;
    onSeek: (us: number) => void;
}

function ProgressBar(props: ProgressBarProps): React.ReactElement<ProgressBarProps> {
    const progressRef = useRef<HTMLDivElement>(null);

    const progress = props.playbackState.length > 0 
        ? (props.playbackState.position / props.playbackState.length) * 100 
        : 0;

    const seekToPercentage = (percentage: number) => {
        const clampedPercentage = Math.max(0, Math.min(1, percentage));
        const newPosition = clampedPercentage * props.playbackState.length;
        props.onSeek(newPosition - props.playbackState.position);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!progressRef.current) return;
        
        e.preventDefault();
        
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        seekToPercentage(percentage);
    };

    return (
        <div className="progressBarContainer">
            <div 
                ref={progressRef}
                className="progressBar"
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
            >
                <div 
                    className="progressBarFill"
                    style={{ width: `${progress}%` }}
                />
                <div 
                    className="progressBarThumb"
                    style={{ left: `${progress}%` }}
                />
            </div>
        </div>
    );
}

interface TimerProps {
    playbackState: PlaybackState;
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
        <div className="timer">{positionString} / {lengthString}</div>
    )
}

interface PlayerProps {
    playbackState: PlaybackState;
    onTogglePause: (paused: boolean) => void;
    onSeek: (us: number) => void;
    onStop: () => void;
}

export const Player = ({
    playbackState,
    onTogglePause,
    onSeek,
    onStop,
}: PlayerProps): React.ReactElement<PlayerProps> => {
    return (
        <div className="playbackContainer">
            <div className="title">
                {removeExtension(playbackState.path.split('/').pop() as string)}
            </div>
            <div
                className={`pauseButton button ${playbackState.paused ? '' : 'glow'}`}
                onClick={() => onTogglePause(playbackState.paused)}
            >
                {playbackState.paused ? <PlayIcon/> : <PauseIcon /> }
            </div>
            <div
                className="stopButton button"
                onClick={onStop}
            >
                <StopIcon />
            </div>
            <div className="seekContainer">
                <div
                    className="seekButton button"
                    onClick={() => onSeek(-OneSecondInUS*15)}
                >
                    {'<<'}
                </div>
                <div
                    className="seekButton button"
                    onClick={() => onSeek(OneSecondInUS*15)}
                >
                    {'>>'}
                </div>
            </div>
            <ProgressBar 
                playbackState={playbackState}
                onSeek={onSeek}
            />
            <Timer 
                playbackState={playbackState}
            />
        </div>
    )
}
