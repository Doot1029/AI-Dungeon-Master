import React, { useState } from 'react';
import { LocationData, CardinalDirection, WorldNpc, WorldObject } from '../types';

interface LocationPanelProps {
    location: LocationData | null;
    onTravel: (direction: CardinalDirection) => void;
    onInteract: (actionText: string) => void;
    isLoading: boolean;
}

const getOpinionDescription = (opinion: number): string => {
    if (opinion > 75) return 'Devoted';
    if (opinion > 40) return 'Friendly';
    if (opinion > 10) return 'Amicable';
    if (opinion >= -10) return 'Neutral';
    if (opinion >= -40) return 'Wary';
    if (opinion >= -75) return 'Hostile';
    return 'Hateful';
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const objectActions = ['Examine', 'Take', 'Use on...', 'Push'];
const npcActions = ['Talk to', 'Ask about...', 'Give...', 'Attack'];

const TravelButton: React.FC<{ direction: CardinalDirection, onTravel: (dir: CardinalDirection) => void, disabled: boolean, available: boolean }> = 
({ direction, onTravel, disabled, available }) => {
    const gridPosition = {
        north: 'col-start-2 row-start-1',
        south: 'col-start-2 row-start-3',
        west: 'col-start-1 row-start-2',
        east: 'col-start-3 row-start-2'
    }[direction];

    return (
        <button
            onClick={() => onTravel(direction)}
            disabled={disabled || !available}
            className={`p-2 rounded-lg font-bold transition-colors duration-200 ${gridPosition}
                ${!available ? 'bg-gray-800 text-gray-600 cursor-default' 
                             : 'bg-gray-600 hover:bg-yellow-500 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-gray-600 disabled:hover:text-white'}`}
        >
            {direction.charAt(0).toUpperCase()}
        </button>
    );
};

interface InteractableProps {
    data: WorldObject | WorldNpc;
    type: 'object' | 'npc';
    onInteract: (action: string) => void;
    isLoading: boolean;
}

const Interactable: React.FC<InteractableProps> = ({ data, type, onInteract, isLoading }) => {
    const { name, description } = data;
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const actions = type === 'object' ? objectActions : npcActions;

    const handleActionClick = (action: string) => {
        if (action.endsWith('...')) {
            setActiveAction(action);
            setIsOpen(true);
        } else {
            onInteract(`${action} ${name}`);
            setIsOpen(false);
            setActiveAction(null);
        }
    };

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            let fullActionText = '';
            if (activeAction === 'Ask about...') {
                 fullActionText = `Ask ${name} about ${inputValue}`;
            } else if (activeAction === 'Use on...') {
                fullActionText = `Use ${name} on ${inputValue}`;
            } else if (activeAction === 'Give...') {
                fullActionText = `Give ${inputValue} to ${name}`;
            }
            onInteract(fullActionText);
            setInputValue('');
            setActiveAction(null);
            setIsOpen(false);
        }
    };

    return (
        <div className="py-2">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left font-bold text-gray-200 hover:text-yellow-300 flex justify-between items-center focus:outline-none">
                <span>{name}</span>
                 {type === 'npc' && <span className="text-xs text-gray-400">{getOpinionDescription((data as WorldNpc).opinion)}</span>}
                <span className={`transform transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="pl-4 pt-2 space-y-2">
                    <p className="text-xs italic text-gray-400">{description}</p>
                    <div className="flex flex-wrap gap-2">
                        {actions.map(action => (
                            <button 
                                key={action}
                                onClick={() => handleActionClick(action)}
                                disabled={isLoading}
                                className="text-xs bg-gray-600 hover:bg-yellow-600 hover:text-gray-900 px-2 py-1 rounded disabled:opacity-50"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                    {activeAction && (
                        <form onSubmit={handleInputSubmit} className="flex gap-2 pt-1">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder={activeAction.replace('...', '') + '...'}
                                className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                autoFocus
                            />
                            <button type="submit" disabled={isLoading} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded disabled:opacity-50">Go</button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};


export const LocationPanel: React.FC<LocationPanelProps> = ({ location, onTravel, onInteract, isLoading }) => {
    const [isCopied, setIsCopied] = useState(false);

    if (!location) {
        return (
            <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg text-center">
                <p className="italic text-gray-400">Loading location...</p>
            </div>
        );
    }
    
    const handleCopyForTexting = () => {
        if (!location) return;
        const parts = [];
        parts.push(`*Location: ${location.name}*`);
        parts.push(location.description);

        if (location.objects.length > 0) {
            parts.push('\n*Objects:*');
            location.objects.forEach(obj => {
                parts.push(`- ${obj.name}: ${obj.description}`);
                parts.push(`  Actions: ${objectActions.join(', ')}`);
            });
        }
        if (location.npcs.length > 0) {
            parts.push('\n*People:*');
            location.npcs.forEach(npc => {
                parts.push(`- ${npc.name} (${getOpinionDescription(npc.opinion)}): ${npc.description}`);
                parts.push(`  Actions: ${npcActions.join(', ')}`);
            });
        }
        if (location.exits.length > 0) {
            parts.push(`\n*Exits:* ${location.exits.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(', ')}`);
        }
        
        const fullText = parts.join('\n');
        navigator.clipboard.writeText(fullText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <div>
                <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-medieval text-2xl text-yellow-400">{location.name}</h3>
                     <button onClick={handleCopyForTexting} className="text-xs text-gray-400 hover:text-yellow-300 flex items-center gap-1">
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                        {isCopied ? 'Copied!' : 'Copy for Texting'}
                    </button>
                </div>
                <p className="text-sm bg-gray-900 bg-opacity-50 p-2 rounded">{location.description}</p>
            </div>

            {(location.objects.length > 0 || location.npcs.length > 0) &&
                <div className="border-t border-gray-700 pt-3 text-sm divide-y divide-gray-700">
                    {location.objects.length > 0 && (
                        <div>
                            <h4 className="font-bold text-yellow-300 pt-2 pb-1">Objects:</h4>
                            {location.objects.map(obj => <Interactable key={obj.name} data={obj} type="object" onInteract={onInteract} isLoading={isLoading} />)}
                        </div>
                    )}
                    {location.npcs.length > 0 && (
                        <div>
                            <h4 className="font-bold text-yellow-300 pt-2 pb-1">People:</h4>
                            {location.npcs.map(npc => <Interactable key={npc.name} data={npc} type="npc" onInteract={onInteract} isLoading={isLoading} />)}
                        </div>
                    )}
                </div>
            }

            <div className="border-t border-gray-700 pt-3">
                <h4 className="text-center font-bold text-yellow-300 mb-2">Travel</h4>
                <div className="grid grid-cols-3 grid-rows-3 gap-2 w-32 mx-auto">
                    {(['north', 'south', 'east', 'west'] as CardinalDirection[]).map(dir => (
                        <TravelButton 
                            key={dir} 
                            direction={dir} 
                            onTravel={onTravel}
                            disabled={isLoading}
                            available={location.exits.includes(dir)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};