import personasData from './personas_hitesh_piyush.json';

interface Persona {
  id: string;
  name: string;
  who_are_you: string;
  speaking_style: {
    language: string;
    tone: string[];
    quirks: string[];
    signature_lines: string[];
  };
  guardrails: {
    do: string[];
    dont: string[];
  };
  system_instruction: string;
}

function getPersonaPrompt(persona: string): string {
  // Find the persona in the JSON data
  const personaObj = personasData.personas.find(p => 
    p.id === persona || 
    p.name.toLowerCase().includes(persona.toLowerCase()) ||
    persona.toLowerCase().includes(p.name.toLowerCase()) ||
    // Handle simplified names
    (persona === "Hitesh" && p.id === "hitesh_choudhary") ||
    (persona === "Piyush" && p.id === "piyush_garg")
  );

  if (!personaObj) {
    throw new Error(`Unknown persona: ${persona}. Available personas: ${personasData.personas.map(p => p.name).join(', ')}`);
  }

  // Return the system instruction from the JSON data
  return personaObj.system_instruction;
}

export { getPersonaPrompt };
