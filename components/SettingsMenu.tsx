import React, { useState } from 'react';

interface SettingsMenuProps {
    isPgMode: boolean;
    onPgModeChange: (enabled: boolean) => void;
    onClose: () => void;
    onExportStory: () => void;
    onSaveGame: () => void;
    onExportGame: () => string; // Now returns the string directly
    onImportGame: (jsonString: string) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const ImportExportModal: React.FC<{
    mode: 'import' | 'export';
    onClose: () => void;
    onImport: (data: string) => void;
    exportData: string;
}> = ({ mode, onClose, onImport, exportData }) => {
    const [importText, setImportText] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(exportData).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medieval text-2xl text-yellow-400">{mode === 'import' ? 'Import Game' : 'Export Game'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-2xl leading-none">&times;</button>
                </div>
                {mode === 'export' ? (
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Copy this text and save it in a file to import later.</p>
                        <textarea
                            readOnly
                            value={exportData}
                            className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-2 text-xs font-mono focus:ring-yellow-500 focus:outline-none"
                        />
                        <button onClick={handleCopy} className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
                            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Paste your previously exported game data below.</p>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-2 text-xs font-mono focus:ring-yellow-500 focus:outline-none"
                            placeholder="Paste your save data here..."
                        />
                        <button 
                            onClick={() => onImport(importText)} 
                            disabled={!importText.trim()}
                            className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            Load Game
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isPgMode, onPgModeChange, onClose, onExportStory, onSaveGame, onExportGame, onImportGame, showConfirmation }) => {
    const [modalMode, setModalMode] = useState<'import' | 'export' | null>(null);
    const [exportData, setExportData] = useState('');

    const handleExportClick = () => {
        const data = onExportGame();
        setExportData(data);
        setModalMode('export');
    };

    const handleImportClick = () => {
        setModalMode('import');
    };

    const handleImportConfirm = (data: string) => {
        showConfirmation(
            "Are you sure you want to import this save? This will overwrite your current progress.",
            () => {
                onImportGame(data);
                setModalMode(null);
            }
        );
    };

    return (
        <>
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
                                Save your current progress to this browser. The game also auto-saves.
                            </p>
                            <button 
                                onClick={onSaveGame}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                            >
                                Save Progress
                            </button>
                        </div>

                        <div className="p-3 bg-gray-700 rounded-lg">
                            <h4 className="font-bold text-gray-200 mb-2">Import / Export Data</h4>
                            <p className="text-xs text-gray-400 mb-3">
                                Save your game to text, or load a previous adventure.
                            </p>
                            <div className="flex gap-2">
                                 <button
                                    onClick={handleExportClick}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
                                >
                                    Export
                                </button>
                                <button
                                    onClick={handleImportClick}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded"
                                >
                                    Import
                                </button>
                            </div>
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
                                Save your adventure's narrative as a text file.
                            </p>
                            <button 
                                onClick={onExportStory}
                                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                            >
                                Export as .txt
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            {modalMode && (
                <ImportExportModal 
                    mode={modalMode} 
                    onClose={() => setModalMode(null)} 
                    onImport={handleImportConfirm}
                    exportData={exportData}
                />
            )}
        </>
    );
};