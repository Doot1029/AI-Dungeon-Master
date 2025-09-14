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
    const [customActionText, setCustomActionText] = useState('');
    const [actionInputType, setActionInputType] = useState<ActionInputType>('auto');
    const [isCopied, setIsCopied] = useState(false);

    const handleSubmitCustomAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (customActionText.trim()) {
            onAction({ text: customActionText.trim(), actionType: actionInputType });
            setCustomActionText('');
        }
    };

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
    
    if (character && character.isNpc) {
        return (
            <div className="border-t border-gray-600 pt-4 text-center p-4">
                <p className="font-bold text-cyan-400">{character.name} is an NPC and will act on their own.</p>
                <p className="text-sm text-gray-400 mt-1">Select a player-controlled character to make a choice.</p>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-600 pt-4">
            <h3 className="font-medieval text-2xl text-center text-yellow-400 mb-3">What do you do?</h3>
            <div className="grid grid-cols-1 gap-3 mb-4 max-h-48 overflow-y-auto pr-2">
                {choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => onAction(choice)}
                        disabled={isLoading}
                        className="p-3 bg-gray-700 hover:bg-yellow-600 hover:text-gray-900 border border-gray-600 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:text-gray-200"
                    >
                        <p className="font-bold"><span className="text-yellow-300 capitalize">[{choice.actionType}]</span> {choice.text}</p>
                        <p className="text-xs text-gray-400 ml-2">
                            {choice.skill} Check (DC {choice.dc} - {DIFFICULTY_MAP[choice.dc] || 'Custom'})
                        </p>
                    </button>
                ))}
            </div>

            <div className="border-t border-gray-700 pt-4">
                 <p className="text-center text-sm text-gray-400 mb-2">...or describe your own action:</p>
                 <form onSubmit={handleSubmitCustomAction} className="flex flex-col gap-2">
                     <div className="flex bg-gray-900 border border-gray-600 rounded-lg p-1">
                        {(['auto', 'do', 'say'] as ActionInputType[]).map(type => (
                            <button
                                type="button"
                                key={type}
                                onClick={() => setActionInputType(type)}
                                className={`flex-1 text-xs font-bold rounded-md py-1 capitalize transition-colors duration-200 ${actionInputType === type ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'}`}
                            >
                                {type}
                            </button>
                        ))}
                     </div>
                     <div className="flex gap-2">
                        <input
                            type="text"
                            value={customActionText}
                            onChange={(e) => setCustomActionText(e.target.value)}
                            placeholder="e.g., 'Search the room for hidden clues'"
                            disabled={isLoading}
                            className="flex-grow bg-gray-900 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !customActionText.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '...' : 'Act'}
                        </button>
                     </div>
                 </form>
            </div>
            
            {choices.length > 0 && latestNarration && !isLoading && (
                <div className="mt-4 text-center border-t border-gray-700 pt-4">
                    <button
                        onClick={handleCopyForTexting}
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-300 transition-colors duration-200 py-2 px-4 rounded-lg bg-gray-900 bg-opacity-50 hover:bg-gray-800 border border-gray-600"
                    >
                        {isCopied ? (
                            <>
                                <CheckIcon />
                                <span className="text-green-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon />
                                <span>Copy Story For Texting</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
