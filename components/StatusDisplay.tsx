import React from 'react';
import { Status } from '../App';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface StatusDisplayProps {
    status: Status;
    error: string | null;
}

const statusConfig = {
    fetching: {
        text: 'Contacting AI to scrape events...',
        progress: 50,
        color: 'bg-indigo-500',
        icon: <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
    },
    processing: {
        text: 'AI is processing... Organizing results...',
        progress: 90,
        color: 'bg-indigo-500',
        icon: <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
    },
    success: {
        text: 'Successfully processed all events!',
        progress: 100,
        color: 'bg-green-500',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />
    },
    error: {
        text: 'An error occurred.',
        progress: 100,
        color: 'bg-red-500',
        icon: <XCircleIcon className="h-5 w-5 text-red-400" />
    }
}


const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error }) => {
    if (status === 'idle') return null;

    const config = statusConfig[status];
    const displayText = status === 'error' ? error || config.text : config.text;

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm font-medium">
                <div className="flex-shrink-0">{config.icon}</div>
                <p className={`${status === 'error' ? 'text-red-300' : 'text-gray-300'}`}>{displayText}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                    className={`${config.color} h-2.5 rounded-full transition-all duration-500 ease-out`} 
                    style={{ width: `${config.progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default StatusDisplay;
