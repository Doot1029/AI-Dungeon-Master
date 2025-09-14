
import React, { useState } from 'react';
import { StoryPart } from '../types';

interface StoryPanelProps {
    storyHistory: StoryPart[];
    storyEndRef: React.RefObject<HTMLDivElement>;
    onSpeak: (text: string) => void;
    onCopy: (text: string) => Promise<void>;
}

const SpeakIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 20V4M7 10h-.01M17 10h-.01M4 14h16" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);


export const StoryPanel: React.FC<StoryPanelProps> = ({ storyHistory, storyEndRef, onSpeak, onCopy }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        onCopy(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
        });
    };

    return (
        <div className="flex-grow overflow-y-auto pr-2 mb-4 space-y-4">
            {storyHistory.map((part, index) => {
                if (part.type === 'image' && part.imageUrl) {
                    return (
                        <div key={part.id} className="p-3 rounded-lg bg-gray-900 bg-opacity-50">
                            <img src={part.imageUrl} alt={part.text} className="rounded-lg border-2 border-yellow-700/50 mb-2 w-full object-contain" />
                            <p className="text-sm italic text-gray-400 text-center">{part.text}</p>
                        </div>
                    );
                }

                return (
                    <div key={part.id} className={`group relative p-3 rounded-lg ${
                        part.type === 'narrative' 
                            ? 'bg-gray-900 bg-opacity-50 border-l-4 border-yellow-500' 
                            : 'bg-blue-900 bg-opacity-30 text-right italic'
                    }`}>
                        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 bg-gray-800 p-1 rounded-md">
                            <button 
                                onClick={() => onSpeak(part.text)} 
                                className="p-1 text-gray-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
                                aria-label="Read text aloud"
                            >
                                <SpeakIcon />
                            </button>
                            <button 
                                onClick={() => handleCopy(part.text, index)}
                                className="p-1 text-gray-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
                                aria-label="Copy text"
                            >
                                {copiedIndex === index ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                        {part.type === 'action' && (
                            <p className="font-bold text-blue-300">{part.characterName} says:</p>
                        )}
                         <p className="whitespace-pre-wrap">{part.text}</p>
                    </div>
                );
            })}
             <div ref={storyEndRef} />
        </div>
    );
};