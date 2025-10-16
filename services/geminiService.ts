import { LanguageLevel } from "../types";

export async function simplifyText(text: string, level: LanguageLevel): Promise<string> {
  try {
    const response = await fetch('/api/simplify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, level }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.simplifiedText;
    
  } catch (error) {
    console.error("Error simplifying text:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to connect to the server. ${error.message}`);
    }
    throw new Error("An unknown network error occurred.");
  }
}
