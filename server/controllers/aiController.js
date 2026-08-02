import { buildUserFinancialContext } from '../utils/contextBuilder.js';
import { callGroqLLM } from '../services/aiService.js';

// Summary system instruction context
const SUMMARY_SYSTEM_PROMPT = `You are a helpful, senior financial analytics assistant. Use ONLY the user's provided financial data context to produce a concise summary.
Write exactly 3 to 5 sentences.
Focus on: account balances, spending trends, budget limits, upcoming obligations/EMIs, or anomalies in the provided data.
Rules:
1. Speak directly to the user in a professional tone.
2. Rely strictly on the numbers provided in the context. DO NOT invent, assume, or extrapolate any figures.
3. No generic boilerplate phrases.
4. Keep it concise.`;

// Chat assistant grounding system instructions
const getChatSystemPrompt = (financialContext) => `You are FinIntel AI, an autonomous financial intelligence reasoning agent.
You are grounding your answers strictly inside the user's micro-financial details.
Here is the user's current financial context data:
${JSON.stringify(financialContext, null, 2)}

Instructions:
1. Answer the user's questions truthfully and ONLY using the provided financial context data.
2. If the user asks about something outside the available data (such as categories that don't exist, items not logged, or generic non-grounded recommendations), state explicitly: "I do not have data on that to comment." DO NOT invent or fabricate any details.
3. If they ask about affordability queries (e.g. "Can I afford a car loan of ₹50,000 monthly?", "should I buy a new phone?", "can I buy a luxury watch?"), carefully evaluate:
   - Current net savings.
   - Available accounts balances.
   - Upcoming EMIs (debt commitments).
   - Category budget headroom.
   Formulate a logical financial decision grounding recommendations on key numbers.
4. Keep answers concise, clear, and action-oriented. Be direct. Speak to the user.`;

// @desc    Obtain dynamic AI summary of user financial database
// @route   GET /api/v1/ai/summary
// @access  Private
export const getAISummary = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const context = await buildUserFinancialContext(userId);

    // If API Key is missing, degrade gracefully
    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({
        success: true,
        source: 'rule-based',
        summary: 'AI summarization (Groq) is currently unavailable due to a missing GROQ_API_KEY in the environment. Displaying rule-based telemetry insights.',
        ruleInsights: context.ruleBasedInsights,
        context
      });
    }

    try {
      const messages = [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: `Summarize this user financial context: ${JSON.stringify(context)}` }
      ];

      const summary = await callGroqLLM(messages);

      return res.status(200).json({
        success: true,
        source: 'llm',
        summary,
        ruleInsights: context.ruleBasedInsights,
        context
      });
    } catch (llmError) {
      console.error('[AI Summary Error] Falling back to rule insights:', llmError.message);
      return res.status(200).json({
        success: true,
        source: 'rule-based',
        summary: `AI query hit a fallback state (Error: ${llmError.message}). Displaying rule-based telemetry insights.`,
        ruleInsights: context.ruleBasedInsights,
        context
      });
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Interact with grounded AI agent in a chat session
// @route   POST /api/v1/ai/chat
// @access  Private
export const postAIChat = async (req, res, next) => {
  const { question, conversationHistory = [] } = req.body;
  const userId = req.user.id;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: 'Question input is required'
    });
  }

  try {
    const context = await buildUserFinancialContext(userId);

    // If API Key is missing, degrade gracefully
    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({
        success: true,
        answer: 'Chat interface requires a GROQ_API_KEY to be configured on the server environment. Please configure this key to unlock real-time intelligence.',
        source: 'stub'
      });
    }

    // Grounding payload assembly
    const chatSystemPrompt = getChatSystemPrompt(context);

    // Format historical messages: ensure roles are strictly either 'system', 'user', or 'assistant'
    const formattedHistory = conversationHistory.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    }));

    const messages = [
      { role: 'system', content: chatSystemPrompt },
      ...formattedHistory,
      { role: 'user', content: question }
    ];

    try {
      const answer = await callGroqLLM(messages);

      return res.status(200).json({
        success: true,
        answer,
        source: 'llm'
      });
    } catch (llmError) {
      console.error('[AI Chat Error]:', llmError.message);
      return res.status(200).json({
        success: true,
        answer: `Sorry, there was an issue processing your query through the Groq AI service. Details: ${llmError.message}`,
        source: 'error'
      });
    }

  } catch (error) {
    next(error);
  }
};
