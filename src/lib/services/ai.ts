import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Profile, Employee } from '@/types';

// Replace with your API key securely injected via environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export function buildSystemPrompt(profile: Profile, employeeContext?: any) {
  let prompt = `You are Oasis AI, an intelligent, helpful, and professional HRMS assistant for the Oasis Platform.
Your goal is to assist the user with their HR, payroll, attendance, and company queries.
Always be polite, concise, and format your responses clearly.

Here is the context of the user you are talking to:
- Name: ${profile.full_name}
- Email: ${profile.email}
- Role: ${profile.role}
`;

  if (profile.role === 'admin' || profile.role === 'hr') {
    prompt += `
Since this user is an Admin/HR Manager, they might ask about company-wide analytics, pending leave requests, employee headcount, or payroll processing. 
Provide them with high-level summaries and actionable advice based on the data they provide or ask about.
`;
  } else {
    prompt += `
Since this user is an Employee, they might ask about their own attendance, leave balances, or payslips.
They can only see their own data. Be helpful in explaining HR policies or summarizing their personal records.
`;
  }

  if (employeeContext) {
    prompt += `\nAdditional specific data about this user:\n${JSON.stringify(employeeContext, null, 2)}`;
  }

  return prompt;
}

export async function createChatSession(profile: Profile, employeeContext?: any) {
  if (!API_KEY) {
    throw new Error('Gemini API Key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  const systemInstruction = buildSystemPrompt(profile, employeeContext);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.7-flash',
    systemInstruction 
  });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'System Initialization: Please act according to the system instructions provided.' }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am Oasis AI. How can I assist you today?' }],
      }
    ],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  return chat;
}

export async function getAIResponse(prompt: string): Promise<{ answer: string }> {
  if (!API_KEY) {
    return { answer: "AI service is currently not configured with an API key." };
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return { answer: response.text() };
  } catch (error) {
    console.error('getAIResponse error:', error);
    return { answer: "I'm having trouble processing your request right now." };
  }
}
