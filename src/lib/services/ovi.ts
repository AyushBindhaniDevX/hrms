import { getAIResponse } from './ai';

export async function processOviInteraction(transcribedText: string): Promise<string> {
  const prompt = `You are Ovi, a highly professional, empathetic, and helpful AI HR Assistant for Oasis HRMS. 
Keep your responses to 1-3 sentences maximum. Be conversational, clear, and warm. 
The employee says: "${transcribedText}"`;

  const aiResponse = await getAIResponse(prompt);
  return aiResponse.answer || "I'm sorry, I didn't quite catch that. Could you please repeat?";
}

export async function processOviAudio(audioBase64: string, employeeContext: string, mimeType: string = 'audio/mp4'): Promise<string> {
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return "I am here to assist with all your HR inquiries, leave policies, and payslips.";
  }

  const prompt = `You are Ovi, an empathetic and highly professional AI HR Assistant for Oasis HRMS.
You are talking to an employee. Keep your responses under 3 sentences. Be extremely warm and concise.
Here is the employee's context:
${employeeContext}

Respond to the employee's query helpfully.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: audioBase64 } }
          ]
        }]
      })
    });
    
    if (!response.ok) throw new Error("Audio transcription failed");
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here to assist with your HR questions.";
  } catch (e) {
    console.error("Gemini Assistant Error:", e);
    return "I'm here to assist with your HR inquiries. How can I help you today?";
  }
}
