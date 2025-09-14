import React, { useState } from 'react';
import { Character, Ability, Skill } from '../types';
import { SKILL_ABILITY_MAP } from '../constants';

interface CharacterSheetProps {
    character: Character;
}

const getModifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (modifier: number) => (modifier >= 0 ? `+${modifier}` : modifier);

const StatPill: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const modifier = getModifier(score);
    return (
        <div className="flex flex-col items-center bg-gray-700 rounded-lg p-2 shadow-inner">
            <span className="text-xs font-bold text-yellow-300">{label}</span>
            <span className="text-lg font-bold">{score}</span>
            <span className="text-sm font-bold bg-gray-900 rounded-full px-2">{formatModifier(modifier)}</span>
        </div>
    );
};

const VitalsBar: React.FC<{ current: number; max: number; label: string; color: string; }> = ({ current, max, label, color }) => (
    <div className="w-full">
        <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm font-bold">{label}</span>
            <span className="text-xs font-mono">{current} / {max}</span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-2.5">
            <div className={color} style={{ width: `${max > 0 ? (current / max) * 100 : 0}%`, height: '100%', borderRadius: '9999px' }}></div>
        </div>
    </div>
);


export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
    const [inventoryOpen, setInventoryOpen] = useState(false);

    return (
        <div>
            <div className="text-center mb-4">
                <h2 className="font-medieval text-3xl text-yellow-400">{character.name}</h2>
                <p className="text-lg text-gray-300">Level {character.level} {character.className}</p>
                {character.isNpc && <p className="text-sm text-cyan-400 italic">[NPC Companion]</p>}
            </div>

            <div className="space-y-3 mb-4 p-3 bg-gray-900 bg-opacity-40 rounded-lg">
                <VitalsBar current={character.hp} max={character.maxHp} label="HP" color="bg-red-600" />
                <VitalsBar current={character.mp} max={character.maxMp} label="MP" color="bg-blue-600" />
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-yellow-400 font-bold">Coins:</span>
                    <span className="font-mono text-lg">{character.coins}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(character.scores).map(([ability, score]) => (
                    <StatPill key={ability} label={ability.substring(0,3)} score={score} />
                ))}
            </div>
            
            <h3 className="font-medieval text-xl text-yellow-400 mt-4 mb-2">Personality</h3>
            <p className="text-sm bg-gray-900 bg-opacity-50 p-2 rounded whitespace-pre-wrap h-24 overflow-y-auto">
                {character.personality || 'Not defined.'}
            </p>

            <div className="mt-4">
                 <button onClick={() => setInventoryOpen(!inventoryOpen)} className="w-full flex justify-between items-center text-left font-medieval text-xl text-yellow-400 mb-2 focus:outline-none">
                    <span>Inventory</span>
                    <span className={`transform transition-transform ${inventoryOpen ? 'rotate-180' : ''}`}>▼</span>
                 </button>
                 {inventoryOpen && (
                    <div className="bg-gray-900 bg-opacity-50 p-2 rounded max-h-32 overflow-y-auto">
                        {character.inventory && character.inventory.length > 0 ? (
                            <ul className="space-y-1 text-sm">
                                {character.inventory.map(item => (
                                    <li key={item.name} className="flex justify-between">
                                        <span>{item.name}</span>
                                        <span className="font-mono text-gray-400">x{item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm italic text-gray-500">Empty</p>
                        )}
                    </div>
                 )}
            </div>

            <h3 className="font-medieval text-xl text-yellow-400 mt-4 mb-2">Skills</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.values(Skill).map(skill => {
                    const ability = SKILL_ABILITY_MAP[skill];
                    const modifier = getModifier(character.scores[ability]);
                    const isProficient = character.proficiencies.includes(skill);
                    const totalBonus = isProficient ? modifier + character.proficiencyBonus : modifier;

                    return (
                        <div key={skill} className="flex justify-between items-center py-1 border-b border-gray-700">
                            <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${isProficient ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                                <span>{skill}</span>
                            </div>
                            <span className="font-bold">{formatModifier(totalBonus)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};