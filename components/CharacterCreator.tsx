
import React, { useState, useEffect } from 'react';
import { Character, Ability, Skill } from '../types';
import { generatePersonality } from '../services/geminiService';

interface CharacterCreatorProps {
    onSave: (character: Character, index?: number) => void;
    onCancelEdit: () => void;
    characterToEdit: { character: Character; index: number; } | null;
    isPgMode: boolean;
}

const MAX_SKILLS = 3;

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

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancelEdit, characterToEdit, isPgMode }) => {
    const [name, setName] = useState('');
    const [scores, setScores] = useState<Record<Ability, number>>(generateInitialScores());
    const [personality, setPersonality] = useState('');
    const [isNpc, setIsNpc] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    
    useEffect(() => {
        if (characterToEdit) {
            setName(characterToEdit.character.name);
            setScores(characterToEdit.character.scores);
            setPersonality(characterToEdit.character.personality);
            setIsNpc(characterToEdit.character.isNpc);
            setSelectedSkills(characterToEdit.character.proficiencies);
        } else {
            // Reset form for a new character
            setName('');
            setScores(generateInitialScores());
            setPersonality('');
            setIsNpc(false);
            setSelectedSkills([]);
        }
    }, [characterToEdit]);

    const handleRollStats = () => {
        setScores(generateInitialScores());
    };

    const handleGenerateBio = async () => {
        if (!name.trim()) {
            alert("Please enter a name before generating a bio.");
            return;
        }
        setIsGeneratingBio(true);
        try {
            const newBio = await generatePersonality(name, isPgMode);
            setPersonality(newBio);
        } catch (error) {
            console.error(error);
            alert("Failed to generate a personality bio. Please try again.");
        } finally {
            setIsGeneratingBio(false);
        }
    };

    const handleSkillToggle = (skill: Skill) => {
        setSelectedSkills(prev => {
            if (prev.includes(skill)) {
                return prev.filter(s => s !== skill);
            }
            if (prev.length < MAX_SKILLS) {
                return [...prev, skill];
            }
            return prev;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Please enter a name for your character.");
            return;
        }

        const baseHp = 8;
        const baseMp = 4;
        const getModifier = (score: number) => Math.floor((score - 10) / 2);
        const conModifier = getModifier(scores[Ability.CON]);
        const intModifier = getModifier(scores[Ability.INT]);

        const maxHp = baseHp + conModifier;
        const maxMp = baseMp + intModifier;
        const coins = Math.floor(Math.random() * 20) + 10; // 4d4+10 approx

        const characterData: Character = {
            name,
            level: 1,
            proficiencyBonus: 2,
            scores,
            proficiencies: selectedSkills,
            personality,
            isNpc,
            hp: characterToEdit?.character.hp ?? maxHp,
            maxHp: maxHp,
            mp: characterToEdit?.character.mp ?? maxMp,
            maxMp: maxMp,
            coins: characterToEdit?.character.coins ?? coins,
            inventory: characterToEdit?.character.inventory ?? [],
            locationId: characterToEdit?.character.locationId ?? '',
        };
        
        onSave(characterData, characterToEdit?.index);

        if (!characterToEdit) {
            setName('');
            setPersonality('');
            setIsNpc(false);
            setSelectedSkills([]);
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
                    <label className="block text-sm font-bold mb-1 text-gray-300">Skills ({selectedSkills.length}/{MAX_SKILLS})</label>
                    <div className="bg-gray-900 border border-gray-600 rounded p-2 grid grid-cols-2 gap-x-2 gap-y-1 max-h-32 overflow-y-auto">
                        {Object.values(Skill).map(skill => (
                             <label key={skill} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-700 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    disabled={!selectedSkills.includes(skill) && selectedSkills.length >= MAX_SKILLS}
                                    className="h-4 w-4 rounded border-gray-500 text-yellow-500 focus:ring-yellow-500 bg-gray-800 disabled:opacity-50"
                                />
                                <span>{skill}</span>
                            </label>
                        ))}
                    </div>
                </div>

                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="personality" className="block text-sm font-bold text-gray-300">Personality Bio</label>
                        <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-2 rounded disabled:bg-gray-600">
                           {isGeneratingBio ? '...' : 'Generate'}
                        </button>
                    </div>
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
