import React, { useState, useEffect } from 'react';
import { Character, ClassName, Ability, Skill } from '../types';
import { CLASS_PROFICIENCIES, CLASS_BASE_STATS } from '../constants';

interface CharacterCreatorProps {
    onSave: (character: Character, index?: number) => void;
    onCancelEdit: () => void;
    characterToEdit: { character: Character; index: number; } | null;
}

// Helper to roll 4d6 and drop the lowest
const rollStat = (): number => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift(); // remove the lowest
    return rolls.reduce((sum, roll) => sum + roll, 0);
};

const generateInitialScores = (): Record<Ability, number> => ({
    [Ability.STR]: rollStat(),
    [Ability.DEX]: rollStat(),
    [Ability.CON]: rollStat(),
    [Ability.INT]: rollStat(),
    [Ability.WIS]: rollStat(),
    [Ability.CHA]: rollStat(),
});

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancelEdit, characterToEdit }) => {
    const [name, setName] = useState('');
    const [className, setClassName] = useState<ClassName>(ClassName.FIGHTER);
    const [scores, setScores] = useState<Record<Ability, number>>(generateInitialScores());
    const [personality, setPersonality] = useState('');
    const [isNpc, setIsNpc] = useState(false);
    
    useEffect(() => {
        if (characterToEdit) {
            setName(characterToEdit.character.name);
            setClassName(characterToEdit.character.className);
            setScores(characterToEdit.character.scores);
            setPersonality(characterToEdit.character.personality);
            setIsNpc(characterToEdit.character.isNpc);
        } else {
            // Reset form for a new character
            setName('');
            setClassName(ClassName.FIGHTER);
            setScores(generateInitialScores());
            setPersonality('');
            setIsNpc(false);
        }
    }, [characterToEdit]);

    const handleRollStats = () => {
        setScores(generateInitialScores());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Please enter a name for your character.");
            return;
        }

        const baseStats = CLASS_BASE_STATS[className];
        const getModifier = (score: number) => Math.floor((score - 10) / 2);
        const conModifier = getModifier(scores[Ability.CON]);
        const intModifier = getModifier(scores[Ability.INT]);

        const maxHp = baseStats.hp + conModifier;
        const maxMp = baseStats.mp + intModifier;
        const coins = Math.floor(Math.random() * 20) + 10; // 4d4+10 approx

        const characterData: Character = {
            name,
            className,
            level: 1,
            proficiencyBonus: 2,
            scores,
            proficiencies: CLASS_PROFICIENCIES[className],
            personality,
            isNpc,
            hp: characterToEdit?.character.hp ?? maxHp,
            maxHp: maxHp,
            mp: characterToEdit?.character.mp ?? maxMp,
            maxMp: maxMp,
            coins: characterToEdit?.character.coins ?? coins,
        };
        
        onSave(characterData, characterToEdit?.index);

        if (!characterToEdit) {
            setName('');
            setClassName(ClassName.FIGHTER);
            setPersonality('');
            setIsNpc(false);
            handleRollStats();
        }
    };

    return (
        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg">
            <h3 className="font-medieval text-2xl text-yellow-400 text-center mb-4">
                 {characterToEdit ? `Edit ${characterToEdit.character.name}` : 'Create a Hero'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-bold mb-1 text-gray-300">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="class" className="block text-sm font-bold mb-1 text-gray-300">Class</label>
                    <select
                        id="class"
                        value={className}
                        onChange={(e) => setClassName(e.target.value as ClassName)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                    >
                        {Object.values(ClassName).map(cn => <option key={cn} value={cn}>{cn}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="personality" className="block text-sm font-bold mb-1 text-gray-300">Personality Bio</label>
                    <textarea
                        id="personality"
                        value={personality}
                        onChange={(e) => setPersonality(e.target.value)}
                        placeholder="e.g., A gruff but kind warrior who secretly loves kittens."
                        className="w-full h-20 p-2 bg-gray-900 border border-gray-600 rounded focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    {Object.entries(scores).map(([ability, score]) => (
                        <div key={ability} className="bg-gray-700 p-2 rounded">
                            <div className="text-xs font-bold text-yellow-300">{ability.substring(0,3)}</div>
                            <div className="text-lg font-bold">{score}</div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleRollStats} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                    Roll Stats (4d6 drop lowest)
                </button>
                
                <div className="flex items-center justify-center p-2 bg-gray-900 rounded-md">
                    <input
                        type="checkbox"
                        id="isNpc"
                        checked={isNpc}
                        onChange={(e) => setIsNpc(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                    />
                    <label htmlFor="isNpc" className="ml-2 block text-sm text-gray-300">
                        Is this character an NPC? (AI-controlled)
                    </label>
                </div>

                 <div className="flex gap-2">
                    {characterToEdit && (
                        <button 
                            type="button" 
                            onClick={onCancelEdit} 
                            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    )}
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                        {characterToEdit ? 'Update Character' : 'Add to Party'}
                    </button>
                </div>
            </form>
        </div>
    );
};
