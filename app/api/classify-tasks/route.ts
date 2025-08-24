import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import type { NextRequest } from "next/server"
import { env } from "process"
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return new Response("Text is required", { status: 400 })
    }

    const result = streamText({
      model: google("gemini-1.5-flash", {
        apiKey: env.GEMINI_API_KEY,
      }),
      prompt: `Analyze the following brain dump text and extract individual tasks. For each task, provide:
1. Task title (clear and actionable)
2. Category (Universidad, Aprender a Manejar, Cocinar, Programación, Personal, Trabajo, or create a new relevant category)
3. Priority (alta, media, baja)
4. Estimated effort (1-5 scale where 1=very easy, 5=very complex)
5. Any relevant notes or context

Text to analyze: "${text}"

Please respond in JSON format as an array of tasks, and ensure the JSON is properly formatted and in the languaje of the message.:
[
  {
    "title": "Task title",
    "category": "category",
    "priority": "alta|media|baja",
    "effort": 1-5,
    "notes": "Any relevant context or steps"
  }
]`,
      system:
        "You are an expert task organizer and productivity coach. Your job is to help people break down their scattered thoughts into organized, actionable tasks. Be practical and specific in your suggestions.",
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error classifying tasks:", error)
    return new Response("Failed to classify tasks", { status: 500 })
  }
}