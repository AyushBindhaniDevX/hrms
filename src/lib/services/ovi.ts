import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { getAIResponse } from './ai';

const ELEVEN_LABS_API_KEY = process.env.EXPO_PUBLIC_ELEVEN_LABS_API || 'sk_e732884ea861b14e693fd3e495a3d6bd26cfdc2e6d8126f5';
// Ovi's Voice ID (using a default professional voice if not specified)
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Rachel (or any good female voice)

export async function processOviInteraction(transcribedText: string): Promise<string> {
  const prompt = `You are Ovi, a highly professional, empathetic, and exceptionally brief AI HR Assistant for Oasis HRMS. 
Keep your responses to 1-3 sentences maximum. Be conversational and warm. 
The employee says: "${transcribedText}"`;

  const aiResponse = await getAIResponse(prompt);
  const textResponse = aiResponse.answer || "I'm sorry, I didn't quite catch that. Could you repeat?";

  await synthesizeVoice(textResponse);
  return textResponse;
}

export async function processOviAudio(audioBase64: string, employeeContext: string, mimeType: string = 'audio/mp4'): Promise<string> {
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("Gemini API key missing");

  const prompt = `You are Ovi, an empathetic and highly professional AI HR Assistant for Oasis HRMS.
You are talking to an employee over an audio call. Keep your responses under 3 sentences. Be extremely warm and concise.
Here is the employee's context:
${employeeContext}

Listen to the user's audio and respond appropriately as Ovi.`;

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
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that audio.";
    
    // Play the response
    await synthesizeVoice(textResponse);
    return textResponse;
  } catch (e) {
    console.error("Gemini Audio Error:", e);
    // Fallback if audio fails
    const fallback = "I'm having trouble hearing you right now. Could you try again?";
    await synthesizeVoice(fallback);
    return fallback;
  }
}

export async function synthesizeVoice(text: string): Promise<void> {
  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // turbo is faster
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          const uri = FileSystem.cacheDirectory + 'ovi_response.mp3';
          await FileSystem.writeAsStringAsync(uri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Play the audio
          const { sound } = await Audio.Sound.createAsync({ uri });
          await sound.playAsync();
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              resolve();
            }
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error('ElevenLabs Error:', error);
    throw error;
  }
}
