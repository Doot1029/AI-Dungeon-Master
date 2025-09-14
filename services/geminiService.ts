
import { GoogleGenAI, Type } from "@google/genai";
import { LocationData, ActionOutcome, Skill, ActionType, CardinalDirection, ClassName } from "../types";

// --- IMPORTANT ---
// PASTE YOUR GEMINI API KEY HERE.
// This key will be visible in your code if you deploy this to a public repository.
// It is strongly recommended to use this method for local development or private sites only.
const API_KEY = "AIzaSyDA3t3eeSYvuzszy2-0l6wkNxGcCyyLjA8";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) return ai;
    if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("API key is missing. Please paste your Gemini API key into services/geminiService.ts");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return ai;
};


const allSkills = Object.values(Skill);
const allActionTypes: ActionType[] = ['do', 'say'];
const allDirections: CardinalDirection[] = ['north', 'south', 'east', 'west'];

const locationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "A creative and descriptive name for this location (e.g., 'The Whispering Glade', 'Grumblebelly's Tavern')."
    },
    description: {
      type: Type.STRING,
      description: "A 2-3 paragraph, vivid description of the location, including sights, sounds, and smells."
    },
    objects: {
      type: Type.ARRAY,
      description: "A list of 2-4 interesting, interactive objects in the location.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "A brief description of the object." }
        },
        required: ["name", "description"]
      }
    },
    npcs: {
      type: Type.ARRAY,
      description: "A list of 0-2 non-player characters present in the location.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "A brief description of the NPC, including their appearance and current demeanor." },
          isHostile: { type: Type.BOOLEAN, description: "Whether this NPC is immediately hostile to the party." },
          opinion: { type: Type.INTEGER, description: "The NPC's initial opinion of the party, from -100 (hostile) to 100 (friendly). Defaults to 0 for neutral." }
        },
        required: ["name", "description", "opinion"]
      }
    },
    exits: {
      type: Type.ARRAY,
      description: "A list of 2-4 cardinal directions the players can travel to from here.",
      items: {
        type: Type.STRING,
        enum: allDirections,
      }
    }
  },
  required: ["name", "description", "objects", "npcs", "exits"],
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        quantity: { type: Type.INTEGER }
    },
    required: ["name", "description", "quantity"]
};

const actionOutcomeResponseSchema = {
    type: Type.OBJECT,
    properties: {
        narrative: {
            type: Type.STRING,
            description: "A 1-3 paragraph story narrative describing the outcome of the character's action. This should be engaging and reflect the success or failure of the action based on the character's stats. If NPCs are present, describe their reactions or actions based on their opinions."
        },
        choices: {
            type: Type.ARRAY,
            description: "An array of 2 to 4 distinct choices for the NEXT player character to make. These should be a mix of 'do' and 'say' actions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    skill: { type: Type.STRING, enum: allSkills },
                    dc: { type: Type.INTEGER, description: "Difficulty Class (5, 10, 15, 20, 25)." },
                    actionType: { type: Type.STRING, enum: allActionTypes, description: "Whether this is a physical action ('do') or a dialogue option ('say')." }
                },
                required: ["text", "skill", "dc", "actionType"],
            },
        },
        characterUpdates: {
            type: Type.OBJECT,
            description: "Updates to the active character's stats as a result of the action. Omit if no change.",
            properties: {
                hpChange: { type: Type.INTEGER, description: "Change in HP (e.g., -5 for damage, 10 for healing)." },
                mpChange: { type: Type.INTEGER, description: "Change in MP (e.g., -3 for casting a spell)." },
                coinsChange: { type: Type.INTEGER, description: "Change in coins (e.g., 50 for a reward, -10 for a purchase)." },
                inventoryAdd: { type: Type.ARRAY, items: itemSchema, description: "List of items to add to the character's inventory." },
                inventoryRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of item names to remove from inventory." }
            }
        },
        locationUpdates: {
            type: Type.OBJECT,
            description: "Updates to the current location's state. Omit if no change.",
            properties: {
                objectsToAdd: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } },
                objectsToRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of object names to remove." },
                npcsToAdd: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, opinion: { type: Type.INTEGER } } } },
                npcsToRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of NPC names to remove." },
            }
        },
        questUpdates: {
            type: Type.ARRAY,
            description: "Updates to the player's quests. Use this to add new quests or update the status of existing ones.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The unique title of the quest." },
                    description: { type: Type.STRING, description: "A description for a new quest. Omit when only changing status." },
                    status: { type: Type.STRING, enum: ['active', 'completed', 'failed'], description: "The new status of the quest." }
                },
                required: ["title", "status"]
            }
        },
        partyReputationChange: {
            type: Type.INTEGER,
            description: "Change in the party's overall reputation (e.g., +5 for a good deed, -10 for a crime). Omit if no change."
        },
        npcOpinionChanges: {
            type: Type.ARRAY,
            description: "Changes to specific NPCs' opinions of the party. Only include NPCs in the current location.",
            items: {
                type: Type.OBJECT,
                properties: {
                    npcName: { type: Type.STRING },
                    opinionChange: { type: Type.INTEGER }
                },
                required: ["npcName", "opinionChange"]
            }
        }
    },
    required: ["narrative", "choices"],
};

const getBaseSystemInstruction = (isPgMode: boolean) => {
    let instruction = `You are a master Dungeon Master for a Dungeons & Dragons style RPG. Your goal is to create an engaging, explorable world. You must respond ONLY with a JSON object that adheres to the provided schema.`;
    if (isPgMode) {
        instruction += ` IMPORTANT: All content must be strictly PG-rated and family-friendly. Avoid violence, gore, suggestive themes, and any mature content. Keep the tone lighthearted and suitable for all ages.`;
    }
    return instruction;
};

const callApi = async <T>(prompt: string, systemInstruction: string, schema: object): Promise<T> => {
     const client = getAiClient();
     try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.75,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;

    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        throw new Error("Failed to communicate with the AI Dungeon Master. Have you set your API key in services/geminiService.ts?");
    }
}

export const generateLocation = async (prompt: string, isPgMode: boolean): Promise<LocationData> => {
    const systemInstruction = `${getBaseSystemInstruction(isPgMode)} Your role is to generate a single, detailed location in the game world based on the user's prompt.`;
    return callApi<LocationData>(prompt, systemInstruction, locationResponseSchema);
};

export const generateActionOutcome = async (prompt: string, isPgMode: boolean): Promise<ActionOutcome> => {
    const systemInstruction = `${getBaseSystemInstruction(isPgMode)} Your role is to determine the outcome of a player's action. The game is turn-based. You will be given the full context: the world, the party, their locations and reputation, the active character's location, and their action. Based on the active character's stats and skills, decide if their action succeeds or fails and by how much. Narrate this outcome compellingly. Then, provide relevant state changes (HP, items, reputation, etc.) and new choices for the NEXT player character to take on their turn. Have any NPCs in the scene react or act realistically based on their personality, their opinion of the party, and the situation. Party members can be in different locations.`;
    return callApi<ActionOutcome>(prompt, systemInstruction, actionOutcomeResponseSchema);
}


export const generatePromptIdea = async (isPgMode: boolean): Promise<string> => {
    const client = getAiClient();
    try {
        let content = `Generate a creative and intriguing D&D story prompt for a party of adventurers. The prompt should be about 2-3 sentences long and set a clear scene and potential objective. Do not surround the response with quotes or any other formatting, just return the plain text of the prompt. Example: Three adventurers walk into a tavern in the misty port city of Neverwinter. A cloaked figure in the corner beckons them over...`;
        if (isPgMode) {
            content += ` The prompt must be strictly PG-rated and family-friendly.`
        }

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: content,
            config: {
                temperature: 0.9,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating prompt idea with Gemini:", error);
        throw new Error("Failed to communicate with the AI for a prompt idea.");
    }
};

export const generateSimplePromptIdea = async (isPgMode: boolean): Promise<string> => {
    const client = getAiClient();
    try {
        let content = `Generate a simple, one or two-sentence D&D story prompt suitable for a quick game or for a younger audience. The prompt should present a clear, immediate situation. Do not surround the response with quotes or any other formatting, just return the plain text of the prompt. Example: You find a mysterious, glowing key in an ancient forest.`;
        if (isPgMode) {
            content += ` The prompt must be strictly PG-rated and family-friendly.`
        }

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: content,
            config: {
                temperature: 0.85,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating simple prompt idea with Gemini:", error);
        throw new Error("Failed to communicate with the AI for a simple prompt idea.");
    }
};

export const generatePersonality = async (name: string, className: ClassName, isPgMode: boolean): Promise<string> => {
    const client = getAiClient();
    try {
        // Combine system instruction and user prompt into a single prompt to avoid header encoding issues.
        let fullPrompt = `As a creative writer specializing in fantasy characters, generate a short, 1-2 sentence personality bio for a D&D character.
Character Name: ${name}
Character Class: ${className}
Bio constraints: Make it intriguing and give them a unique quirk. The response should be concise, delivered as plain text only, with no quotes or other formatting.`;

        if (isPgMode) {
            fullPrompt += `\nIMPORTANT: The bio must be strictly PG-rated and family-friendly.`;
        }

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                // systemInstruction is removed and merged into contents.
                temperature: 0.8,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating personality with Gemini:", error);
        throw new Error("Failed to communicate with the AI for a personality bio.");
    }
};
