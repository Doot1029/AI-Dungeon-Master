import React from 'react';
import { Quest } from '../types';

interface QuestPanelProps {
    quests: Quest[];
}

export const QuestPanel: React.FC<QuestPanelProps> = ({ quests }) => {
    const activeQuests = quests.filter(q => q.status === 'active');
    const completedQuests = quests.filter(q => q.status !== 'active');

    return (
        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg">
            <h3 className="font-medieval text-2xl text-yellow-400 mb-3 text-center">Quests</h3>
            
            {quests.length === 0 ? (
                <p className="text-sm italic text-gray-500 text-center">No quests yet.</p>
            ) : (
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    {activeQuests.length > 0 && (
                        <div>
                            <h4 className="font-bold text-yellow-300 border-b border-gray-600 pb-1 mb-2">Active</h4>
                            <ul className="space-y-2">
                                {activeQuests.map(quest => (
                                    <li key={quest.id}>
                                        <p className="font-bold text-gray-200">{quest.title}</p>
                                        <p className="text-sm text-gray-400 pl-2">{quest.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {completedQuests.length > 0 && (
                         <div>
                            <h4 className="font-bold text-gray-500 border-b border-gray-600 pb-1 mb-2">Completed</h4>
                            <ul className="space-y-1">
                                {completedQuests.map(quest => (
                                    <li key={quest.id} className="text-gray-500 line-through">
                                       {quest.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};