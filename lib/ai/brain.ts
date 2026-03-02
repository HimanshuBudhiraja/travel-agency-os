import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { prisma } from "@/lib/db/prisma";
import { AiActionType } from "@prisma/client";

export function getModel(agencyApiKey?: string) {
  return new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.3,
    openAIApiKey: agencyApiKey || process.env.OPENAI_API_KEY,
  });
}

// ─── Intent Extraction ───────────────────────────────────────────────────────

export interface TravelIntent {
  destination?: string;
  dates?: string;
  budget?: string;
  groupSize?: number;
  travelStyle?: string;
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  confidence: number;
  summary: string;
}

export async function extractTravelIntent(
  message: string,
  agencyId: string
): Promise<TravelIntent> {
  const model = getModel();
  const parser = new StringOutputParser();

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an AI assistant for a travel agency. Extract travel intent from customer messages.
Return a JSON object with these fields:
- destination: string or null
- dates: string or null (e.g. "March 15-22, 2026")
- budget: string or null (e.g. "$5000 for 2 people")
- groupSize: number or null
- travelStyle: "luxury" | "adventure" | "family" | "budget" | "business" | null
- sentiment: "positive" | "neutral" | "negative" | "urgent"
- confidence: number between 0 and 1
- summary: one sentence describing what the customer wants
Return ONLY valid JSON, no markdown.`,
    ],
    ["human", "{message}"],
  ]);

  const chain = prompt.pipe(model).pipe(parser);
  const raw = await chain.invoke({ message });

  const intent: TravelIntent = JSON.parse(raw);

  await logAiAction({
    agencyId,
    type: AiActionType.INTENT_EXTRACTION,
    input: { message },
    output: intent,
    confidence: intent.confidence,
    reasoning: intent.summary,
  });

  return intent;
}

// ─── Auto-Reply Generation ───────────────────────────────────────────────────

export async function generateAutoReply(params: {
  clientName?: string;
  intent: TravelIntent;
  agencyName: string;
  aiPersonaName: string;
  channel: string;
  agencyId: string;
}): Promise<{ reply: string; confidence: number }> {
  const model = getModel();
  const parser = new StringOutputParser();

  const { clientName, intent, agencyName, aiPersonaName, channel } = params;

  const isWhatsApp = channel === "WHATSAPP";
  const lengthInstruction = isWhatsApp
    ? "Keep it conversational and under 150 words. Use line breaks instead of paragraphs."
    : "Write a professional email response under 200 words.";

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are ${aiPersonaName}, an AI travel specialist for ${agencyName}.
Your tone is warm, professional, and helpful.
${lengthInstruction}
Acknowledge the customer's request, confirm any details you extracted, and ask 1-2 clarifying questions if needed.
Never fabricate prices or availability. Never mention that you are an AI unless asked.`,
    ],
    [
      "human",
      `Customer name: ${clientName || "there"}
Extracted intent: ${JSON.stringify(intent)}
Write a reply that acknowledges their request and keeps the conversation moving forward.`,
    ],
  ]);

  const chain = prompt.pipe(model).pipe(parser);
  const reply = await chain.invoke({});

  const confidence = intent.confidence * 0.9;

  await logAiAction({
    agencyId: params.agencyId,
    type: AiActionType.AUTO_REPLY,
    input: { intent, channel },
    output: { reply },
    confidence,
    reasoning: `Auto-reply for ${intent.destination || "unknown destination"} inquiry`,
  });

  return { reply, confidence };
}

// ─── Lead Scoring ────────────────────────────────────────────────────────────

export async function scoreLeadWithAI(params: {
  clientHistory: string;
  intent: TravelIntent;
  agencyId: string;
}): Promise<{ score: "HOT" | "WARM" | "COLD"; estimatedValue: number; conversionProb: number; reasoning: string }> {
  const model = getModel();
  const parser = new StringOutputParser();

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a travel agency sales AI. Score leads based on intent signals.
Return JSON with:
- score: "HOT" | "WARM" | "COLD"
- estimatedValue: number (USD, estimated booking value)
- conversionProb: number (0-1)
- reasoning: string (one sentence)
Return ONLY valid JSON.`,
    ],
    [
      "human",
      `Client history: ${params.clientHistory}
Current intent: ${JSON.stringify(params.intent)}`,
    ],
  ]);

  const chain = prompt.pipe(model).pipe(parser);
  const raw = await chain.invoke({});
  const result = JSON.parse(raw);

  await logAiAction({
    agencyId: params.agencyId,
    type: AiActionType.LEAD_SCORING,
    input: { intent: params.intent },
    output: result,
    confidence: result.conversionProb,
    reasoning: result.reasoning,
  });

  return result;
}

// ─── Itinerary Generation ────────────────────────────────────────────────────

export async function generateItinerary(params: {
  destination: string;
  departureDate: string;
  returnDate: string;
  paxCount: number;
  budget: number;
  travelStyle: string;
  preferences: string;
  agencyId: string;
}): Promise<{ itinerary: object; summary: string }> {
  const model = getModel();
  const parser = new StringOutputParser();

  const nights = Math.ceil(
    (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert travel planner. Generate a detailed day-by-day itinerary.
Return a JSON object with:
- title: string (trip title)
- summary: string (2-3 sentence overview)
- days: array of { dayNumber, date, title, description, activities: [{ time, activity, location, notes }], accommodation: { name, area, checkIn?, checkOut? } | null }
- included: string[] (what's included)
- excluded: string[] (what's not included)
- notes: string[] (important notes)
Return ONLY valid JSON.`,
    ],
    [
      "human",
      `Destination: ${params.destination}
Dates: ${params.departureDate} to ${params.returnDate} (${nights} nights)
Travelers: ${params.paxCount}
Budget: $${params.budget} total
Style: ${params.travelStyle}
Preferences: ${params.preferences}`,
    ],
  ]);

  const chain = prompt.pipe(model).pipe(parser);
  const raw = await chain.invoke({});
  const itinerary = JSON.parse(raw);

  await logAiAction({
    agencyId: params.agencyId,
    type: AiActionType.ITINERARY_GENERATION,
    input: params,
    output: { title: itinerary.title },
    confidence: 0.9,
    reasoning: `Generated ${nights}-night itinerary for ${params.destination}`,
  });

  return { itinerary, summary: itinerary.summary };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAiAction(params: {
  agencyId: string;
  type: AiActionType;
  entityType?: string;
  entityId?: string;
  input?: object;
  output?: object;
  confidence?: number;
  reasoning?: string;
}) {
  await prisma.aiAction.create({ data: params });
}
