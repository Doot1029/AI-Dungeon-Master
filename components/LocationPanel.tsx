import React, { useState } from 'react';
import { LocationData, CardinalDirection } from '../types';

interface LocationPanelProps {
    location: LocationData | null;
    onTravel: (direction: CardinalDirection) => void;
    isLoading: boolean;
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

export const LocationPanel: React.FC<LocationPanelProps> = ({ location, onTravel, isLoading }) => {
    const [isCopied, setIsCopied] = useState(false);

    if (!location) {
        return (
            <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg text-center">
                <p className="italic text-gray-400">Loading location...</p>
            </div>
        );
    }
    
    const handleCopy = () => {
        navigator.clipboard.writeText(location.description).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg flex flex-col gap-4">
            <div>
                <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-medieval text-2xl text-yellow-400">{location.name}</h3>
                     <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-yellow-300 flex items-center gap-1">
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                        {isCopied ? 'Copied!' : 'Copy Desc.'}
                    </button>
                </div>
                <p className="text-sm bg-gray-900 bg-opacity-50 p-2 rounded max-h-24 overflow-y-auto">{location.description}</p>
            </div>

            {(location.objects.length > 0 || location.npcs.length > 0) &&
                <div className="border-t border-gray-700 pt-3 space-y-3 text-sm">
                    {location.objects.length > 0 && (
                        <div>
                            <h4 className="font-bold text-yellow-300 mb-1">Objects:</h4>
                            <ul className="list-disc list-inside text-gray-300">
                                {location.objects.map(obj => <li key={obj.name}>{obj.name}</li>)}
                            </ul>
                        </div>
                    )}
                    {location.npcs.length > 0 && (
                        <div>
                            <h4 className="font-bold text-yellow-300 mb-1">People:</h4>
                            <ul className="list-disc list-inside text-gray-300">
                                {location.npcs.map(npc => <li key={npc.name}>{npc.name}</li>)}
                            </ul>
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
