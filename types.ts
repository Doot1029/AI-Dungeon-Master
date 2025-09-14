export enum Ability {
    STR = 'Strength',
    DEX = 'Dexterity',
    CON = 'Constitution',
    INT = 'Intelligence',
    WIS = 'Wisdom',
    CHA = 'Charisma',
}

export enum Skill {
    ACROBATICS = 'Acrobatics',
    ANIMAL_HANDLING = 'Animal Handling',
    ARCANA = 'Arcana',
    ATHLETICS = 'Athletics',
    DECEPTION = 'Deception',
    HISTORY = 'History',
    INSIGHT = 'Insight',
    INTIMIDATION = 'Intimidation',
    INVESTIGATION = 'Investigation',
    MEDICINE = 'Medicine',
    NATURE = 'Nature',
    PERCEPTION = 'Perception',
    PERFORMANCE = 'Performance',
    PERSUASION = 'Persuasion',
    RELIGION = 'Religion',
    SLEIGHT_OF_HAND = 'Sleight of Hand',
    STEALTH = 'Stealth',
    SURVIVAL = 'Survival'
}

export enum ClassName {
    FIGHTER = 'Fighter',
    ROGUE = 'Rogue',
    WIZARD = 'Wizard',
    BARD = 'Bard',
}

export interface Character {
    name: string;
    className: ClassName;
    level: number;
    proficiencyBonus: number;
    scores: Record<Ability, number>;
    proficiencies: Skill[];
    personality: string;
    isNpc: boolean;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    coins: number;
}

export interface StoryPart {
    id: string;
    type: 'narrative' | 'action' | 'travel';
    text: string;
    characterName: string;
}

export type ActionType = 'do' | 'say';

export interface Choice {
    text: string;
    skill: Skill;
    dc: number;
    actionType: ActionType;
}

export enum GameState {
    CHARACTER_SELECTION = 'CHARACTER_SELECTION',
    AWAITING_PROMPT = 'AWAITING_PROMPT',
    IN_PROGRESS = 'IN_PROGRESS',
}

// World State Types
export interface WorldObject {
    name: string;
    description: string;
}

export interface WorldNpc {
    name: string;
    description: string;
    isHostile?: boolean;
}

export type CardinalDirection = 'north' | 'south' | 'east' | 'west';

export interface LocationData {
    id: string; // e.g., "0,0"
    name: string;
    description: string;
    objects: WorldObject[];
    npcs: WorldNpc[];
    exits: CardinalDirection[];
}

export type WorldState = Record<string, LocationData>;

// Gemini Service Types
export interface CharacterUpdate {
    hpChange?: number;
    mpChange?: number;
    coinsChange?: number;
}

export interface LocationUpdate {
    objectsToAdd?: WorldObject[];
    objectsToRemove?: string[];
    npcsToAdd?: WorldNpc[];
    npcsToRemove?: string[];
}

export interface ActionOutcome {
    narrative: string;
    choices: Choice[];
    characterUpdates?: CharacterUpdate;
    locationUpdates?: LocationUpdate;
}
