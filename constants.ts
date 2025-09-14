
import { Ability, Skill, Character } from './types';

export const SKILL_ABILITY_MAP: Record<Skill, Ability> = {
    [Skill.ACROBATICS]: Ability.DEX,
    [Skill.ANIMAL_HANDLING]: Ability.WIS,
    [Skill.ARCANA]: Ability.INT,
    [Skill.ATHLETICS]: Ability.STR,
    [Skill.DECEPTION]: Ability.CHA,
    [Skill.HISTORY]: Ability.INT,
    [Skill.INSIGHT]: Ability.WIS,
    [Skill.INTIMIDATION]: Ability.CHA,
    [Skill.INVESTIGATION]: Ability.INT,
    [Skill.MEDICINE]: Ability.WIS,
    [Skill.NATURE]: Ability.INT,
    [Skill.PERCEPTION]: Ability.WIS,
    [Skill.PERFORMANCE]: Ability.CHA,
    [Skill.PERSUASION]: Ability.CHA,
    [Skill.RELIGION]: Ability.INT,
    [Skill.SLEIGHT_OF_HAND]: Ability.DEX,
    [Skill.STEALTH]: Ability.DEX,
    [Skill.SURVIVAL]: Ability.WIS,
};

export const DIFFICULTY_MAP: Record<number, string> = {
    5: 'Very Easy',
    10: 'Easy',
    15: 'Medium',
    20: 'Hard',
    25: 'Very Hard'
};

export const initialCharacters: Character[] = [];
