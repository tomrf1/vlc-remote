import * as React from 'react';
import { Video, VideoList } from 'shared/models';
import { BackIcon } from './icons/backIcon';
import { removeExtension } from './utils';

interface DirectoryProps {
    path: string;
    dirs: string[];
    files: [string,Video][];
    subtitles: boolean;
    onBack: () => void;
    onPlay: (name: string) => void;
    onOpen: (name: string) => void;
    setViewed: (name: string) => void;
    unsetViewed: (name: string) => void;
    setSubtitles: (subtitles: boolean) => void;
}

export const Directory = ({
    path,
    dirs,
    files,
    subtitles,
    onBack,
    onPlay,
    onOpen,
    setViewed,
    unsetViewed,
    setSubtitles,
}: DirectoryProps): React.ReactElement<DirectoryProps> => {

    const renderFile = (name: string, video: Video) => {
        return (
            <div className="directory_videoContainer">
                <div 
                    className="directory_videoName button"
                    key={name}
                    onClick={() => onPlay(name)}
                >
                    <span>{removeExtension(name)}</span>
                </div>
                <div className="directory_viewed">
                    <input 
                        type="checkbox" 
                        defaultChecked={video.viewed === true} 
                        id={name}
                        onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>): void => {
                            event.currentTarget.checked === true ? setViewed(name) : unsetViewed(name)
                        }}
                    />
                </div>
            </div>
        )
    }

    const renderDir = (name: string) => {
        const fullPath = `${path ? `${path}/` : ''}${name}`;
        return (
            <div
                className="directory_dir"
                onClick={() => onOpen(name)}
            >
                {name}
            </div>
        )  
    }

    const renderSubtitlesToggle = (subtitles: boolean) => (
        <div className="directory_subtitles-toggle">
            <div 
                className={`button ${subtitles ? '' : 'disabled'}`}
                onClick={() => setSubtitles(!subtitles)}
            >
                CC
            </div>
        </div>
    )

    return (
        <div className="directory_container">
            <div 
                className="directory_header"
                onClick={onBack}
            >
                <div
                    className={`directory_backButton ${path === '' ? 'disabled' : ''}`}
                >
                    <BackIcon />
                </div>
                <div className="directory_name">{path}</div>
            </div>
            <div className="directory_body">
                { renderSubtitlesToggle(subtitles) }
                {
                    dirs.map(name => renderDir(name))
                }
                {
                    files.map(([key, file]) => renderFile(key, file))
                }
            </div>
        </div>
    )
}
