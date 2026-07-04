import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title, author } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Provide a comprehensive yet concise book summary for "${title}" by ${author || 'Unknown'}. 
Please structure the response beautifully using markdown with the following sections:
- **Overview**: A brief paragraph summarizing the core premise of the book.
- **Key Themes**: A bulleted list of 3-4 main themes explored.
- **Key Takeaways**: A bulleted list of the most important lessons or plot points (without massive spoilers if it's fiction).
- **Why You Should Read It**: A brief recommendation of who the target audience is and why it's worth reading.

Make the tone engaging, insightful, and informative. Use bold text for emphasis where appropriate.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return NextResponse.json({ summary: response.text });
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return NextResponse.json({ error: "Failed to generate summary. Please try again later." }, { status: 500 });
  }
}
