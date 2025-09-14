
import React, { useState } from 'react';

interface SettingsMenuProps {
    isPgMode: boolean;
    onPgModeChange: (enabled: boolean) => void;
    onClose: () => void;
    onExportStory: () => void;
    onSaveGame: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isPgMode, onPgModeChange, onClose, onExportStory, onSaveGame }) => {
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        onSaveGame();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-2xl z-50 w-80"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-medieval text-2xl text-yellow-400">Settings</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-2xl leading-none" aria-label="Close settings">&times;</button>
                </div>
                
                <div className="space-y-6">
                     <div className="p-3 bg-gray-700 rounded-lg">
                        <h4 className="font-bold text-gray-200 mb-2">Save Game</h4>
                        <p className="text-xs text-gray-400 mb-3">
                            Save your current progress. The game also auto-saves.
                        </p>
                        <button 
                            onClick={handleSave}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        >
                            {isSaved ? 'Saved!' : 'Save Progress'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div>
                            <label htmlFor="pg-toggle" className="font-bold text-gray-200">PG Mode</label>
                            <p className="text-xs text-gray-400">Ensures a family-friendly story.</p>
                        </div>
                        <label htmlFor="pg-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="pg-toggle" 
                                className="sr-only peer" 
                                checked={isPgMode}
                                onChange={(e) => onPgModeChange(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                        </label>
                    </div>

                    <div className="p-3 bg-gray-700 rounded-lg">
                        <h4 className="font-bold text-gray-200 mb-2">Export Story</h4>
                        <p className="text-xs text-gray-400 mb-3">
                            Save your adventure as a text file. Direct MP3 export is not available.
                        </p>
                        <button 
                            onClick={onExportStory}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        >
                            Export as .txt
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
