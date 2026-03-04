import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { prisma } from "@/lib/db/prisma";
import { AiActionType } from "@prisma/client";

function getModel() {
  return new ChatOpenAI({ model: "gpt-4o", temperature: 0.3, openAIApiKey: process.env.OPENAI_API_KEY });
}

export interface TravelIntent {
  destination?: string;
  dates?: string;
  budget?: string;
  budgetInr?: number;
  groupSize?: number;
  travelStyle?: string;
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  confidence: number;
  summary: string;
}

export async function extractTravelIntent(message: string, agencyId: string): Promise<TravelIntent> {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Extract travel intent from customer messages. Return JSON: { destination, dates, budget, budgetInr (number INR), groupSize, travelStyle ("luxury"|"adventure"|"family"|"budget"|"honeymoon"|"business"|null), sentiment ("positive"|"neutral"|"negative"|"urgent"), confidence (0-1), summary }. ONLY JSON.`],
    ["human", "{message}"],
  ]);
  const raw = await prompt.pipe(getModel()).pipe(new StringOutputParser()).invoke({ message });
  const intent: TravelIntent = JSON.parse(raw);
  await log({ agencyId, type: AiActionType.INTENT_EXTRACTION, input: { message }, output: intent, confidence: intent.confidence, reasoning: intent.summary });
  return intent;
}

export async function generateAutoReply(params: {
  clientName?: string; intent: TravelIntent; agencyName: string;
  aiPersonaName: string; channel: string; agencyId: string;
}): Promise<{ reply: string; confidence: number }> {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${params.aiPersonaName}, AI travel specialist for ${params.agencyName}. Professional, warm, expert. ${params.channel === "WHATSAPP" ? "Max 120 words, conversational WhatsApp style." : "Professional, under 200 words."} Never reveal you are AI unless asked directly.`],
    ["human", `Customer: ${params.clientName || "there"}\nIntent: ${JSON.stringify(params.intent)}\nWrite a warm reply acknowledging their request with 1-2 clarifying questions if needed.`],
  ]);
  const reply = await prompt.pipe(getModel()).pipe(new StringOutputParser()).invoke({});
  const confidence = params.intent.confidence * 0.9;
  await log({ agencyId: params.agencyId, type: AiActionType.AUTO_REPLY, input: { intent: params.intent }, output: { reply }, confidence });
  return { reply, confidence };
}

export async function scoreLeadWithAI(params: {
  clientHistory: string; intent: TravelIntent; agencyId: string;
}): Promise<{ score: "HOT" | "WARM" | "COLD"; estimatedValue: number; conversionProb: number; reasoning: string }> {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Lead scorer for premium Indian travel agency. Typical packages: ₹50,000–₹10,00,000 per person. Return JSON: { score ("HOT"|"WARM"|"COLD"), estimatedValue (INR total), conversionProb (0-1), reasoning }. ONLY JSON.`],
    ["human", `History: ${params.clientHistory}\nIntent: ${JSON.stringify(params.intent)}`],
  ]);
  const raw = await prompt.pipe(getModel()).pipe(new StringOutputParser()).invoke({});
  const result = JSON.parse(raw);
  await log({ agencyId: params.agencyId, type: AiActionType.LEAD_SCORING, input: params.intent, output: result, confidence: result.conversionProb, reasoning: result.reasoning });
  return result;
}

export interface QuoteTier {
  tier: "budget" | "recommended" | "premium";
  title: string;
  summary: string;
  netCostInr: number;
  grossPriceInr: number;
  marginPct: number;
  days: Array<{
    dayNumber: number; date: string; title: string; description: string;
    activities: Array<{ time: string; activity: string; location?: string }>;
    accommodation: { name: string; area: string; stars: number } | null;
  }>;
  included: string[];
  excluded: string[];
  hotels: Array<{ name: string; stars: number; area: string; pricePerNightInr: number }>;
  flights: string;
  highlights: string[];
}

export async function generateThreeTierItinerary(params: {
  destination: string; departureDate: string; returnDate: string;
  paxCount: number; budgetInr: number; travelStyle: string;
  preferences: string; agencyId: string; defaultMarginPct?: number;
}): Promise<{ budget: QuoteTier; recommended: QuoteTier; premium: QuoteTier }> {
  const nights = Math.max(1, Math.ceil((new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / 86400000));
  const margin = params.defaultMarginPct ?? 0.18;
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Expert travel planner for premium Indian agency. Build 3 package tiers for the same trip.
Return JSON keys: budget, recommended, premium. Each: { tier, title, summary, netCostInr (total all pax, INR), grossPriceInr (net * ${(1+margin).toFixed(2)}), marginPct: ${margin}, days [{dayNumber,date,title,description,activities:[{time,activity,location}],accommodation:{name,area,stars}|null}], included:[], excluded:[], hotels:[{name,stars,area,pricePerNightInr}], flights (string desc), highlights:[] }
Budget=3-star+shared transfers, Recommended=4-star+private+breakfast, Premium=5-star+all meals+experiences. ONLY JSON.`],
    ["human", `Destination: ${params.destination}\nDates: ${params.departureDate} to ${params.returnDate} (${nights} nights)\nPax: ${params.paxCount}\nBudget: ₹${params.budgetInr.toLocaleString("en-IN")}\nStyle: ${params.travelStyle}\nPreferences: ${params.preferences}`],
  ]);
  const raw = await prompt.pipe(getModel()).pipe(new StringOutputParser()).invoke({});
  const tiers = JSON.parse(raw);
  await log({ agencyId: params.agencyId, type: AiActionType.ITINERARY_GENERATION, input: params, output: { tiers: Object.keys(tiers) }, confidence: 0.9, reasoning: `3-tier: ${params.destination}` });
  return tiers;
}

export async function generateFollowUp(params: {
  clientName: string; destination: string; quoteTitle: string;
  daysSinceSent: number; previousFollowUps: number;
  agencyName: string; aiPersonaName: string; agencyId: string;
}): Promise<string> {
  const tone = params.daysSinceSent <= 1 ? "warm, excited about the quote" : params.daysSinceSent <= 3 ? "friendly check-in" : params.daysSinceSent <= 7 ? "gentle nudge with added value" : "mild urgency — availability/price may change";
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${params.aiPersonaName} from ${params.agencyName}. Write a WhatsApp follow-up for an unanswered travel quote. Tone: ${tone}. Max 80 words. Follow-up #${params.previousFollowUps + 1} — must be completely unique, never repeat previous wording.`],
    ["human", `Customer: ${params.clientName}\nQuote: ${params.quoteTitle} (${params.destination})\nDays since sent: ${params.daysSinceSent}`],
  ]);
  const message = await prompt.pipe(getModel()).pipe(new StringOutputParser()).invoke({});
  await log({ agencyId: params.agencyId, type: AiActionType.FOLLOW_UP_SEND, input: params, output: { message }, confidence: 0.95 });
  return message;
}

export async function generateDraftReply(params: {
  message: string; clientName: string; conversationHistory: string;
  agencyName: string; aiPersonaName: string; agencyId: string;
}): Promise<string> {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${params.aiPersonaName} from ${params.agencyName}. Draft a WhatsApp reply for agent review. Max 100 words. Professional and warm.`],
    ["human", `Customer: ${params.clientName}\nHistory: ${params.conversationHistory}\nMessage: ${params.message}`],
  ]);
  return prompt.pipe(getModel()).pipe(new StringOutputParser()).invoke({});
}

async function log(p: { agencyId: string; type: AiActionType; input?: object; output?: object; confidence?: number; reasoning?: string }) {
  try { await prisma.aiAction.create({ data: p }); } catch { /* non-blocking */ }
}
