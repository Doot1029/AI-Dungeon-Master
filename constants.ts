
import { Ability, Skill, ClassName, Character } from './types';

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

export const CLASS_PROFICIENCIES: Record<ClassName, Skill[]> = {
    [ClassName.FIGHTER]: [Skill.ATHLETICS, Skill.INTIMIDATION],
    [ClassName.ROGUE]: [Skill.STEALTH, Skill.SLEIGHT_OF_HAND, Skill.ACROBATICS, Skill.DECEPTION],
    [ClassName.WIZARD]: [Skill.ARCANA, Skill.INVESTIGATION],
    [ClassName.BARD]: [Skill.PERFORMANCE, Skill.PERSUASION, Skill.DECEPTION],
};

export const CLASS_BASE_STATS: Record<ClassName, { hp: number; mp: number; }> = {
    [ClassName.FIGHTER]: { hp: 10, mp: 0 },
    [ClassName.ROGUE]: { hp: 8, mp: 4 },
    [ClassName.WIZARD]: { hp: 6, mp: 10 },
    [ClassName.BARD]: { hp: 8, mp: 8 },
};


export const DIFFICULTY_MAP: Record<number, string> = {
    5: 'Very Easy',
    10: 'Easy',
    15: 'Medium',
    20: 'Hard',
    25: 'Very Hard'
};

export const initialCharacters: Character[] = [];