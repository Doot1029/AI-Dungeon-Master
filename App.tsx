
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Character, StoryPart, Choice, GameState, LocationData, WorldState, CardinalDirection, ActionType, Quest } from './types';
import { generateLocation, generateActionOutcome, generatePromptIdea, generateSimplePromptIdea } from './services/geminiService';
import { CharacterCreator } from './components/CharacterCreator';
import { CharacterSheet } from './components/CharacterSheet';
import { StoryPanel } from './components/StoryPanel';
import { ChoicesPanel } from './components/ChoicesPanel';
import { LocationPanel } from './components/LocationPanel';
import { QuestPanel } from './components/QuestPanel';
import { SettingsMenu } from './components/SettingsMenu';
import { initialCharacters } from './constants';
import { useAudio } from './hooks/useAudio';

type Tab = 'story' | 'location' | 'quests';
const SAVE_GAME_KEY = 'aiDungeonMasterSave';

interface SaveData {
    gameState: GameState;
    characters: Character[];
    activeCharacterIndex: number;
    storyHistory: StoryPart[];
    currentChoices: Choice[];
    prompt: string;
    isPgMode: boolean;
    worldState: WorldState;
    quests: Quest[];
    partyReputation: number;
}


const GearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> );

const getReputationDescription = (rep: number): string => {
    if (rep > 75) return 'Heroic';
    if (rep > 40) return 'Honorable';
    if (rep > 10) return 'Respected';
    if (rep > -10) return 'Neutral';
    if (rep > -40) return 'Unsavory';
    if (rep > -75) return 'Feared';
    return 'Villainous';
}

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.CHARACTER_SELECTION);
    const [characters, setCharacters] = useState<Character[]>(initialCharacters);
    const [activeCharacterIndex, setActiveCharacterIndex] = useState<number>(0);
    const [storyHistory, setStoryHistory] = useState<StoryPart[]>([]);
    const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isPgMode, setIsPgMode] = useState<boolean>(true);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [editingCharacterIndex, setEditingCharacterIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('story');
    
    // World State
    const [worldState, setWorldState] = useState<WorldState>({});
    const [quests, setQuests] = useState<Quest[]>([]);
    const [partyReputation, setPartyReputation] = useState<number>(0);
    const [hasSaveGame, setHasSaveGame] = useState(false);

    const storyEndRef = useRef<HTMLDivElement>(null);
    const activeCharacter = characters[activeCharacterIndex];
    const currentLocationId = activeCharacter?.locationId;
    const currentLocation = currentLocationId ? worldState[currentLocationId] : null;

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [storyHistory]);

    useEffect(() => {
        return () => { window.speechSynthesis.cancel(); }
    }, []);
    
    // NPC Turn Handler
    useEffect(() => {
        const currentCharacter = characters[activeCharacterIndex];
        if (gameState === GameState.IN_PROGRESS && currentCharacter?.isNpc && !isLoading) {
            const actionText = `It is now ${currentCharacter.name}'s turn. Based on their personality (${currentCharacter.personality || 'not defined'}) and the current situation, they decide to act.`;
            const timer = setTimeout(() => {
                handleAction({ text: actionText, actionType: 'auto' });
            }, 1500); // Small delay to make it feel like the NPC is "thinking"
            return () => clearTimeout(timer);
        }
    }, [activeCharacterIndex, gameState, isLoading, characters]);

    const saveGame = useCallback(() => {
        const saveData: SaveData = {
            gameState, characters, activeCharacterIndex, storyHistory,
            currentChoices, prompt, isPgMode, worldState, quests, partyReputation,
        };
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(saveData));
        setHasSaveGame(true);
    }, [
        gameState, characters, activeCharacterIndex, storyHistory,
        currentChoices, prompt, isPgMode, worldState, quests, partyReputation
    ]);

    const loadGame = () => {
        const savedDataString = localStorage.getItem(SAVE_GAME_KEY);
        if (savedDataString) {
            const savedData: SaveData = JSON.parse(savedDataString);
            setGameState(savedData.gameState);
            setCharacters(savedData.characters);
            setActiveCharacterIndex(savedData.activeCharacterIndex);
            setStoryHistory(savedData.storyHistory);
            setCurrentChoices(savedData.currentChoices);
            setPrompt(savedData.prompt);
            setIsPgMode(savedData.isPgMode);
            setWorldState(savedData.worldState);
            setQuests(savedData.quests);
            setPartyReputation(savedData.partyReputation);
        }
    };

    const deleteSave = () => {
        localStorage.removeItem(SAVE_GAME_KEY);
        setHasSaveGame(false);
    };
    
    // Check for save game on initial load
    useEffect(() => {
        const savedData = localStorage.getItem(SAVE_GAME_KEY);
        if (savedData) {
            setHasSaveGame(true);
        }
    }, []);

    // Auto-save
    useEffect(() => {
        if (gameState === GameState.IN_PROGRESS) {
            saveGame();
        }
    }, [storyHistory, characters, worldState, quests, partyReputation, activeCharacterIndex, gameState, saveGame]);


    const handleSpeakText = (text: string) => {
        if (typeof window.speechSynthesis === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onerror = (e) => console.error("Speech synthesis error", e);
        window.speechSynthesis.speak(utterance);
    };

    const handleCopyText = async (text: string): Promise<void> => {
        try { await navigator.clipboard.writeText(text); } 
        catch (err) { console.error('Failed to copy text: ', err); }
    };
    
    const handleSaveCharacter = (character: Character, index?: number) => {
        const newCharacters = [...characters];
        if (index !== undefined) {
            newCharacters[index] = character;
        } else {
            newCharacters.push(character);
            setActiveCharacterIndex(newCharacters.length - 1);
        }
        setCharacters(newCharacters);
        setEditingCharacterIndex(null);
    };

    const handleDeleteCharacter = (indexToDelete: number) => {
        if (characters.length <= 1) {
            alert("You can't delete the last character!");
            return;
        }
        if (window.confirm(`Delete ${characters[indexToDelete].name}?`)) {
            const newCharacters = characters.filter((_, index) => index !== indexToDelete);
            if (activeCharacterIndex >= indexToDelete) {
                setActiveCharacterIndex(Math.max(0, activeCharacterIndex - 1));
            }
            setCharacters(newCharacters);
            if (editingCharacterIndex === indexToDelete) setEditingCharacterIndex(null);
        }
    };

    const handleGeneratePrompt = async (isSimple: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            const newPrompt = isSimple ? await generateSimplePromptIdea(isPgMode) : await generatePromptIdea(isPgMode);
            setPrompt(newPrompt);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to generate a prompt idea. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const getPartyComposition = (forAI: boolean = true) => {
        if (!forAI) {
             return characters.map(c => c.name).join(', ');
        }
        const presentCharacters = characters.filter(c => c.locationId === currentLocationId);
        return presentCharacters.map(c => 
            `- ${c.name}: ${c.isNpc ? '[NPC]' : '[PLAYER]'}\n  HP: ${c.hp}/${c.maxHp}, MP: ${c.mp}/${c.maxMp}, Coins: ${c.coins}\n  Personality: ${c.personality || 'Not defined.'}\n  Proficiencies: ${c.proficiencies.join(', ')}`
        ).join('\n');
    };
    
    const advanceTurn = useCallback(() => {
        if (characters.length > 0) {
           setActiveCharacterIndex(prevIndex => (prevIndex + 1) % characters.length);
        }
    }, [characters.length]);
    
    const handleBeginSaga = () => {
        deleteSave();
        setGameState(GameState.AWAITING_PROMPT);
    }

    const handleStartAdventure = async () => {
        if (!prompt.trim()) {
            setError("Please enter a story prompt.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setGameState(GameState.IN_PROGRESS);
        setStoryHistory([]);
        setWorldState({});
        setQuests([]);
        setPartyReputation(0);
        setActiveCharacterIndex(0);

        try {
            const initialLocation = await generateLocation(`The adventure begins based on this prompt: ${prompt}`, isPgMode);
            const startId = "0,0";
            initialLocation.id = startId;
            
            const newWorldState: WorldState = { [startId]: initialLocation };
            setWorldState(newWorldState);
            
            // Set all characters to the starting location
            setCharacters(prev => prev.map(char => ({...char, locationId: startId })));

            const welcomeText = `Your party, consisting of ${getPartyComposition(false)}, finds themselves at the ${initialLocation.name}.`;
            const firstNarrative : StoryPart = { id: crypto.randomUUID(), type: 'narrative', text: `${welcomeText}\n\n${initialLocation.description}`, characterName: 'DM' };
            setStoryHistory([firstNarrative]);

            // Get initial choices
            await handleAction({text: "The adventurers look around, taking in the scene.", actionType: 'auto'}, [firstNarrative], true);

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to start adventure. Please try again.");
            setGameState(GameState.AWAITING_PROMPT);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAction = async (action: { text: string; actionType: 'do' | 'say' | 'auto' }, storyCtx?: StoryPart[], preventTurnAdvance: boolean = false) => {
        setIsLoading(true);
        setError(null);
        
        if (!activeCharacter.isNpc) {
           setCurrentChoices([]);
        }

        const newHistory: StoryPart[] = [
            ...(storyCtx || storyHistory),
            { id: crypto.randomUUID(), type: 'action', text: action.text, characterName: activeCharacter.name },
        ];
        setStoryHistory(newHistory);

        try {
            const context = newHistory.slice(-5).map(p => `${p.characterName}: ${p.text}`).join('\n\n');
            const getInventoryList = (char: Character) => {
                if (!char.inventory || char.inventory.length === 0) return 'Empty';
                return char.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ');
            }
            const getQuestList = () => {
                const activeQuests = quests.filter(q => q.status === 'active');
                if (activeQuests.length === 0) return 'None';
                return activeQuests.map(q => `- ${q.title}: ${q.description}`).join('\n');
            }

            const promptForAI = `
WORLD STATE:
Current Location: ${currentLocation?.name} (${currentLocation?.id})
- Description: ${currentLocation?.description}
- Objects: ${currentLocation?.objects.map(o => o.name).join(', ') || 'None'}
- NPCs: ${currentLocation?.npcs.map(n => `${n.name} (Opinion: ${n.opinion})`).join(', ') || 'None'}

PARTY STATE (Turn Order):
Party Reputation: ${partyReputation} (${getReputationDescription(partyReputation)})
Party members present at this location:
${getPartyComposition(true)}

ACTIVE CHARACTER INVENTORY (${activeCharacter.name}):
${getInventoryList(activeCharacter)}

ACTIVE QUESTS:
${getQuestList()}

RECENT EVENTS:
${context}

ACTION (Turn of ${activeCharacter.name}):
The active character, ${activeCharacter.name}, performs an action.
Action Type: ${'actionType' in action ? action.actionType : 'auto'}.
Action Description: "${action.text}"

Based on this, continue the story. Remember to provide choices for the next player character.`;

            const outcome = await generateActionOutcome(promptForAI, isPgMode);
            
            // Process outcome
            setStoryHistory(prev => [...prev, { id: crypto.randomUUID(), type: 'narrative', text: outcome.narrative, characterName: 'DM' }]);
            setCurrentChoices(outcome.choices);

            // Update Character
            if (outcome.characterUpdates) {
                const updates = outcome.characterUpdates;
                setCharacters(prevChars => prevChars.map((char, index) => {
                    if (index === activeCharacterIndex) {
                        const newChar = { ...char };
                        newChar.hp = Math.max(0, Math.min(newChar.maxHp, newChar.hp + (updates.hpChange || 0)));
                        newChar.mp = Math.max(0, Math.min(newChar.maxMp, newChar.mp + (updates.mpChange || 0)));
                        newChar.coins += updates.coinsChange || 0;
                        
                        let newInventory = [...newChar.inventory];
                        if (updates.inventoryRemove) {
                            updates.inventoryRemove.forEach(itemName => {
                                newInventory = newInventory.filter(i => i.name.toLowerCase() !== itemName.toLowerCase());
                            });
                        }
                        if (updates.inventoryAdd) {
                            updates.inventoryAdd.forEach(newItem => {
                                const existingItemIndex = newInventory.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                                if (existingItemIndex > -1) {
                                    newInventory[existingItemIndex].quantity += newItem.quantity;
                                } else {
                                    newInventory.push(newItem);
                                }
                            });
                        }
                        newChar.inventory = newInventory;

                        return newChar;
                    }
                    return char;
                }));
            }
            
            // Update Reputation & Opinions
            if(outcome.partyReputationChange) {
                setPartyReputation(prev => prev + outcome.partyReputationChange!);
            }
            if(outcome.npcOpinionChanges && currentLocationId) {
                setWorldState(prevWorld => {
                    const newWorld = {...prevWorld};
                    const loc = {...newWorld[currentLocationId]};
                    loc.npcs = [...loc.npcs];
                    outcome.npcOpinionChanges!.forEach(change => {
                        const npcIndex = loc.npcs.findIndex(n => n.name === change.npcName);
                        if(npcIndex > -1) {
                            loc.npcs[npcIndex] = {...loc.npcs[npcIndex], opinion: loc.npcs[npcIndex].opinion + change.opinionChange };
                        }
                    });
                    newWorld[currentLocationId] = loc;
                    return newWorld;
                });
            }

            // Update Quests
            if (outcome.questUpdates) {
                setQuests(prevQuests => {
                    const newQuests = [...prevQuests];
                    outcome.questUpdates!.forEach(qUpdate => {
                        const existingQuestIndex = newQuests.findIndex(q => q.title.toLowerCase() === qUpdate.title.toLowerCase());
                        if (existingQuestIndex > -1) {
                            newQuests[existingQuestIndex].status = qUpdate.status;
                        } else if (qUpdate.status === 'active' && qUpdate.description) {
                            newQuests.push({
                                id: crypto.randomUUID(),
                                title: qUpdate.title,
                                description: qUpdate.description,
                                status: 'active',
                            });
                        }
                    });
                    return newQuests;
                });
            }
            
            // Update World
            if (outcome.locationUpdates && currentLocationId) {
                const updates = outcome.locationUpdates;
                setWorldState(prevWorld => {
                    const newWorld = {...prevWorld};
                    const loc = {...newWorld[currentLocationId]};
                    if (updates.objectsToRemove) loc.objects = loc.objects.filter(o => !updates.objectsToRemove?.includes(o.name));
                    if (updates.objectsToAdd) loc.objects.push(...updates.objectsToAdd);
                    if (updates.npcsToRemove) loc.npcs = loc.npcs.filter(n => !updates.npcsToRemove?.includes(n.name));
                    if (updates.npcsToAdd) loc.npcs.push(...updates.npcsToAdd);
                    newWorld[currentLocationId] = loc;
                    return newWorld;
                });
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || "The AI is confused by that action. Try something else.");
        } finally {
            setIsLoading(false);
            if (!preventTurnAdvance) {
                advanceTurn();
            }
        }
    };

    const handleTravel = async (direction: CardinalDirection) => {
        if (!currentLocationId) return;
        setIsLoading(true);
        setError(null);
        setCurrentChoices([]);
        
        const [x, y] = currentLocationId.split(',').map(Number);
        let newX = x, newY = y;
        if (direction === 'north') newY++;
        if (direction === 'south') newY--;
        if (direction === 'east') newX++;
        if (direction === 'west') newX--;
        const newLocationId = `${newX},${newY}`;

        const travelMessage: StoryPart = {id: crypto.randomUUID(), type: 'travel', text: `${activeCharacter.name} travels ${direction}...`, characterName: 'System'};
        
        setStoryHistory(prev => [...prev, travelMessage]);

        try {
            let nextLocation : LocationData;

            if (worldState[newLocationId]) {
                nextLocation = worldState[newLocationId];
                const narrative: StoryPart = { id: crypto.randomUUID(), type: 'narrative', text: `${activeCharacter.name} arrives at ${nextLocation.name}.\n\n${nextLocation.description}`, characterName: 'DM' };
                setStoryHistory(prev => [...prev, narrative]);
            } else {
                const prompt = `The character travels ${direction} from "${currentLocation?.name}". Describe the new, distinct location they discover. It should not be the same as the previous one. Previous location description: ${currentLocation?.description}`;
                nextLocation = await generateLocation(prompt, isPgMode);
                nextLocation.id = newLocationId;
                
                setWorldState(prev => ({...prev, [newLocationId]: nextLocation}));
                
                const narrative: StoryPart = { id: crypto.randomUUID(), type: 'narrative', text: `${activeCharacter.name} discovers ${nextLocation.name}.\n\n${nextLocation.description}`, characterName: 'DM' };
                setStoryHistory(prev => [...prev, narrative]);
            }
            
            // Update character's location
            setCharacters(prev => prev.map((char, index) => index === activeCharacterIndex ? {...char, locationId: newLocationId} : char));

            // Generate choices for the new location *after* the character has moved.
            await handleAction({text: "Look around the new area.", actionType: 'auto'}, storyHistory, true);

        } catch(e: any) {
             console.error(e);
             setError(e.message || "The path ahead is unclear. The AI stumbled. Try again.");
             setStoryHistory(prev => prev.slice(0, -1)); // remove travel message
        } finally {
            setIsLoading(false);
            advanceTurn(); // Traveling costs a turn
        }
    }
    
    const handleExportStory = () => {
        const storyText = storyHistory.map(p => `${p.characterName}:\n${p.text}`).join('\n\n---\n\n');
        const blob = new Blob([storyText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-dungeon-story.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportGame = () => {
        const saveData: SaveData = {
            gameState, characters, activeCharacterIndex, storyHistory,
            currentChoices, prompt, isPgMode, worldState, quests, partyReputation,
        };
        const jsonString = JSON.stringify(saveData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-dungeon-save-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportGame = (jsonString: string) => {
        if (!window.confirm("Are you sure you want to import a save file? This will overwrite your current progress.")) {
            return;
        }
        try {
            const saveData: SaveData = JSON.parse(jsonString);
            if (!saveData.gameState || !saveData.characters || saveData.activeCharacterIndex === undefined) {
                throw new Error("Invalid save file format.");
            }
            setGameState(saveData.gameState);
            setCharacters(saveData.characters);
            setActiveCharacterIndex(saveData.activeCharacterIndex);
            setStoryHistory(saveData.storyHistory);
            setCurrentChoices(saveData.currentChoices);
            setPrompt(saveData.prompt);
            setIsPgMode(saveData.isPgMode);
            setWorldState(saveData.worldState);
            setQuests(saveData.quests);
            setPartyReputation(saveData.partyReputation);
            
            localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(saveData));
            setHasSaveGame(true);
            setShowSettings(false);
            alert("Game imported successfully!");
        } catch (e: any) {
            console.error("Failed to import game:", e);
            alert(`Failed to import save file: ${e.message}`);
        }
    };


    const restartGame = () => {
        if (window.confirm("Are you sure you want to start a new game? This will delete your saved progress.")) {
            setGameState(GameState.CHARACTER_SELECTION);
            setStoryHistory([]);
            setCurrentChoices([]);
            setPrompt('');
            setError(null);
            setWorldState({});
            setQuests([]);
            setCharacters(initialCharacters);
            setActiveCharacterIndex(0);
            deleteSave();
            window.speechSynthesis.cancel();
        }
    }

    const latestNarration = storyHistory.slice().reverse().find(part => part.type === 'narrative');
    const characterToEditData = editingCharacterIndex !== null ? { character: characters[editingCharacterIndex], index: editingCharacterIndex } : null;

    const TabButton: React.FC<{tabName: Tab, label: string}> = ({tabName, label}) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
                activeTab === tabName 
                ? 'bg-gray-800 text-yellow-300 border-b-2 border-yellow-400' 
                : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-cover bg-center bg-fixed" style={{backgroundImage: "url('https://picsum.photos/seed/fantasyworld/1920/1080')"}}>
            {showSettings && <SettingsMenu isPgMode={isPgMode} onPgModeChange={setIsPgMode} onClose={() => setShowSettings(false)} onExportStory={handleExportStory} onSaveGame={saveGame} onExportGame={handleExportGame} onImportGame={handleImportGame} />}
            <div className="min-h-screen bg-gray-900 bg-opacity-80 backdrop-blur-sm flex flex-col items-center p-4 sm:p-6 md:p-8 relative">
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-yellow-300 transition-colors p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-80" aria-label="Open settings"><GearIcon /></button>
                </div>
                <header className="w-full max-w-7xl text-center mb-6">
                    <h1 className="font-medieval text-5xl sm:text-6xl md:text-7xl text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">AI Dungeon Master</h1>
                </header>

                <main className="w-full max-w-7xl flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Party & Character */}
                    <aside className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg">
                           <div className="flex justify-between items-center mb-4">
                             <h3 className="font-medieval text-2xl text-yellow-400 text-center">The Party</h3>
                             <div className="text-right text-sm">
                                <p className="font-bold text-gray-300">Reputation</p>
                                <p className="text-yellow-300">{getReputationDescription(partyReputation)} ({partyReputation})</p>
                             </div>
                           </div>
                           <div className="space-y-2 mb-4">
                                {characters.map((char, index) => (
                                    <div key={index} className={`flex items-center justify-between gap-2 p-2 rounded-md transition-all duration-300 ${activeCharacterIndex === index ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : 'bg-gray-900/50'}`}>
                                        <div className="flex-grow text-left text-sm">
                                            <p className={`font-bold ${activeCharacterIndex === index ? 'text-yellow-300' : ''}`}>{char.name}</p>
                                            <p className="text-xs opacity-80">{char.isNpc && <span className="text-cyan-300 italic">[NPC]</span>}</p>
                                            {gameState === GameState.IN_PROGRESS && char.locationId !== currentLocationId && (
                                                <p className="text-xs text-purple-300 italic">@ {worldState[char.locationId]?.name || 'Unknown'}</p>
                                            )}
                                        </div>
                                         {gameState === GameState.CHARACTER_SELECTION ? (
                                            <div className="flex items-center">
                                                <button onClick={() => setEditingCharacterIndex(index)} className="p-1 text-gray-400 hover:text-yellow-300" aria-label={`Edit ${char.name}`}><EditIcon /></button>
                                                <button onClick={() => handleDeleteCharacter(index)} className="p-1 text-gray-400 hover:text-red-400" aria-label={`Delete ${char.name}`}><TrashIcon /></button>
                                            </div>
                                        ) : (
                                            activeCharacterIndex === index && <div className="text-xs font-bold text-yellow-400 animate-pulse pr-2">TURN</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                           {activeCharacter && <CharacterSheet character={activeCharacter} />}
                        </div>
                        {gameState === GameState.CHARACTER_SELECTION && <CharacterCreator onSave={handleSaveCharacter} characterToEdit={characterToEditData} onCancelEdit={() => setEditingCharacterIndex(null)} isPgMode={isPgMode}/>}
                    </aside>

                    {/* Right Panels: Story, Location, etc. */}
                    <div className="lg:col-span-2 flex flex-col">
                         {gameState !== GameState.IN_PROGRESS ? (
                            <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-600 shadow-lg flex flex-col flex-grow items-center justify-center">
                                {gameState === GameState.CHARACTER_SELECTION && ( <>
                                    <h2 className="font-medieval text-4xl text-yellow-400 mb-4 text-center">Welcome, Adventurer!</h2>
                                    {characters.length > 0 ? ( <>
                                        <p className="mb-6 max-w-md mx-auto text-center">Your party assembles. When you are ready, the tale can begin.</p>
                                        <div className="flex flex-col items-center gap-4">
                                            <button onClick={handleBeginSaga} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 self-center">Start New Saga</button>
                                            {hasSaveGame && (
                                                <button onClick={loadGame} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 self-center">Continue Adventure</button>
                                            )}
                                        </div>
                                    </> ) : ( <p className="mb-6 max-w-md mx-auto text-center">Your party is empty. Use the 'Create a Hero' panel to begin.</p> )}
                                </>)}
                                
                                {gameState === GameState.AWAITING_PROMPT && ( <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <h2 className="font-medieval text-3xl text-yellow-400 mb-4 text-center">Set the Scene</h2>
                                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'A group of adventurers seeks a lost artifact in a jungle temple...'" className="w-full max-w-lg h-40 p-3 bg-gray-900 border border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                                    <div className="flex justify-center items-center gap-4 flex-wrap">
                                        <button onClick={() => handleGeneratePrompt(false)} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-600">{isLoading ? '...' : 'Generate Idea'}</button>
                                        <button onClick={() => handleGeneratePrompt(true)} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-600">{isLoading ? '...' : 'Simple Idea'}</button>
                                        <button onClick={handleStartAdventure} disabled={isLoading || characters.length === 0} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? 'Conjuring...' : 'Start Adventure'}</button>
                                    </div>
                                </div>)}
                                {error && <div className="text-center p-4 text-red-400 mt-4">{error}</div>}
                            </div>
                        ) : (
                            <>
                            <div className="flex border-b border-gray-600">
                                <TabButton tabName="story" label="Story & Actions" />
                                <TabButton tabName="location" label="Location" />
                                <TabButton tabName="quests" label="Quests" />
                            </div>
                            <div className="bg-gray-800 bg-opacity-70 p-4 rounded-b-lg border border-t-0 border-gray-600 shadow-lg flex-grow flex flex-col">
                                {error && <div className="text-center p-4 text-red-400 -mb-4 -mt-4 rounded-t-lg bg-red-900/50">{error}</div>}
                                
                                {activeTab === 'story' && (
                                    <div className="flex flex-col h-[80vh] max-h-[80vh] flex-grow">
                                        <StoryPanel storyHistory={storyHistory} storyEndRef={storyEndRef} onSpeak={handleSpeakText} onCopy={handleCopyText}/>
                                        <div className="border-t border-gray-700 pt-4 mt-auto">
                                            {isLoading && <div className="text-center p-4 italic text-yellow-300">The DM is pondering...</div>}
                                            
                                            {!isLoading && !activeCharacter.isNpc && currentChoices.length > 0 && (
                                                 <ChoicesPanel choices={currentChoices} onAction={handleAction} character={activeCharacter} isLoading={isLoading} latestNarration={latestNarration} />
                                            )}

                                            {!isLoading && activeCharacter.isNpc && (
                                                <div className="text-center p-4 italic text-cyan-300">{activeCharacter.name} is thinking...</div>
                                            )}

                                            {!isLoading && currentChoices.length === 0 && storyHistory.length > 0 && (
                                                <div className="text-center p-4">
                                                    <p className="font-medieval text-2xl text-yellow-400 mb-4">The Tale Concludes...</p>
                                                    <button onClick={restartGame} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg">Start a New Adventure</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'location' && (
                                    <LocationPanel 
                                        location={currentLocation} 
                                        onTravel={handleTravel} 
                                        isLoading={isLoading || activeCharacter.isNpc} 
                                        onInteract={(text) => handleAction({ text, actionType: 'do' })}
                                    />
                                )}
                                {activeTab === 'quests' && (
                                    <QuestPanel quests={quests} />
                                )}
                            </div>
                            </>
                        )}
                     </div>
                </main>
            </div>
        </div>
    );
};

export default App;