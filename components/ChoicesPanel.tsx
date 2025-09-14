
import React, { useState } from 'react';
import { Choice, Character, StoryPart, ActionType } from '../types';
import { DIFFICULTY_MAP } from '../constants';

type ActionInputType = 'do' | 'say' | 'auto';

interface ChoicesPanelProps {
    choices: Choice[];
    onAction: (action: { text: string; actionType: ActionInputType } | Choice) => void;
    character: Character;
    isLoading: boolean;
    latestNarration: StoryPart | undefined;
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);


export const ChoicesPanel: React.FC<ChoicesPanelProps> = ({ choices, onAction, character, isLoading, latestNarration }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [customAction, setCustomAction] = useState('');

    const handleCopyForTexting = () => {
        if (!latestNarration) return;
        const choiceText = choices.map((choice, index) => `${index + 1}. ${choice.text}`).join('\n');
        const fullText = `${latestNarration.text}\n\nWhat do you do?\n${choiceText}\n\n...or describe your own action by texting it!`;
        navigator.clipboard.writeText(fullText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }).catch(err => {
            console.error("Failed to copy for texting:", err);
        });
    };
    
    const handleCustomSubmit = (actionType: 'do' | 'say') => {
        if (!customAction.trim() || isLoading) return;
        onAction({ text: customAction, actionType });
        setCustomAction('');
    };

    if (character && character.isNpc) {
        return (
            <div className="text-center p-4">
                <p className="font-bold text-cyan-400">{character.name} is an NPC and will act on their own.</p>
                <p className="text-sm text-gray-400 mt-1">The AI is deciding their action...</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="font-medieval text-2xl text-center text-yellow-400 mb-3">It's {character.name}'s Turn!</h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                {choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => onAction(choice)}
                        disabled={isLoading}
                        className="w-full p-3 bg-gray-700 hover:bg-yellow-600 hover:text-gray-900 border border-gray-600 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:text-gray-200"
                    >
                        <p className="font-bold"><span className="text-yellow-300 capitalize">[{choice.actionType}]</span> {choice.text}</p>
                        <p className="text-xs text-gray-400 ml-2">
                            {choice.skill} Check (DC {choice.dc} - {DIFFICULTY_MAP[choice.dc] || 'Custom'})
                        </p>
                    </button>
                ))}
            </div>

            <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="text-center text-sm text-gray-400 mb-2">Or, describe your own action:</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customAction}
                        onChange={(e) => setCustomAction(e.target.value)}
                        placeholder="What do you do or say?"
                        className="flex-grow bg-gray-900 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCustomSubmit('do');
                            }
                        }}
                    />
                    <button
                        onClick={() => handleCustomSubmit('do')}
                        disabled={isLoading || !customAction.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                        title="Perform an action"
                    >
                        Do
                    </button>
                    <button
                        onClick={() => handleCustomSubmit('say')}
                        disabled={isLoading || !customAction.trim()}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                        title="Say something"
                    >
                        Say
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
                <button 
                    onClick={() => onAction({ text: "Wait and observe the situation.", actionType: 'do' })}
                    disabled={isLoading}
                    className="flex-grow bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    Pass Turn / Wait
                </button>
                {choices.length > 0 && latestNarration && !isLoading && (
                    <div className="text-center">
                        <button
                            onClick={handleCopyForTexting}
                            title="Copy Story For Texting"
                            aria-label="Copy Story For Texting"
                            className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-yellow-300 transition-colors duration-200 p-2 rounded-lg bg-gray-900 bg-opacity-50 hover:bg-gray-800 border border-gray-600"
                        >
                            {isCopied ? (
                                <CheckIcon />
                            ) : (
                                <CopyIcon />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};