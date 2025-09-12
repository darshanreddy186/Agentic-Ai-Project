import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export const analyzeMood = async (diaryContent: string): Promise<{ score: number; analysis: string }> => {
  try {
    const prompt = `
      Analyze this diary entry from a young person and provide:
      1. A mood score from 1-10 (1 = very negative, 10 = very positive)
      2. A brief, empathetic analysis in a friendly, non-clinical tone
      
      Diary entry: "${diaryContent}"
      
      Respond in JSON format: {"score": number, "analysis": "string"}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return { score: 5, analysis: "Thanks for sharing your thoughts today! Keep expressing yourself - it's a great way to process your feelings." };
  }
};

export const chatWithAI = async (
  message: string, 
  diaryEntries: string[], 
  previousConversations: string[] = []
): Promise<string> => {
  try {
    const context = diaryEntries.length > 0 
      ? `User's recent diary entries: ${diaryEntries.join('\n---\n')}` 
      : '';
    
    const conversationHistory = previousConversations.length > 0 
      ? `Previous conversations: ${previousConversations.join('\n---\n')}` 
      : '';

    const prompt = `
      You are a caring AI companion for a young person's mental wellness app. 
      Be empathetic, supportive, and age-appropriate. Never provide medical advice.
      
      ${context}
      ${conversationHistory}
      
      User's message: "${message}"
      
      Provide a helpful, encouraging response that considers their diary history and past conversations.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in AI chat:', error);
    return "I'm here to listen and support you! Feel free to share what's on your mind.";
  }
};

export const generateWeeklyInsight = async (entries: string[]): Promise<string> => {
  try {
    const prompt = `
      Based on these diary entries from a young person over the past week, 
      provide encouraging insights and gentle suggestions for wellness.
      Be supportive and focus on positive patterns and growth opportunities.
      
      Entries: ${entries.join('\n---\n')}
      
      Keep the response friendly and motivational, not clinical.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating weekly insight:', error);
    return "You've been doing great at expressing yourself this week! Keep up the amazing work with your journal. 🌟";
  }
};