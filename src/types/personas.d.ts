declare module "*/personas_hitesh_piyush.json" {
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
    few_shot_examples: Array<{
      id: string;
      user: string;
      assistant: {
        step: string;
        content: string;
      };
    }>;
    multi_step_demos: Array<{
      user: string;
      assistant_steps: Array<{
        step: string;
        content: string;
      }>;
    }>;
  }

  interface PersonasData {
    meta: {
      version: string;
      generated_at: string;
      output_schema: {
        type: string;
        properties: {
          step: { type: string };
          content: { type: string };
        };
      };
      protocol_steps: string[];
    };
    personas: Persona[];
  }

  const value: PersonasData;
  export default value;
} 