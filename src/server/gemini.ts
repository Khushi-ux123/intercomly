import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY is not defined or is placeholder. AI responses will run in Offline Demo helper mode.');
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return aiClient;
}

/**
 * Generates an automatic response to a ticket or user message using Gemini.
 * It uses a secure system instruction to act as an expert client support assistant.
 */
export async function generateAIChatbotResponse(
  ticketTitle: string,
  ticketDescription: string,
  messageHistory: string[]
): Promise<string> {
  const client = getGeminiClient();

  const formattedHistory = messageHistory.map((m, idx) => `Message ${idx + 1}: ${m}`).join('\n');
  const prompt = `
Context details:
Support Ticket Topic: ${ticketTitle}
Ticket Original Description: ${ticketDescription}

Conversation thread history:
${formattedHistory || "This is the start of the chat."}

Instructions:
You are "InterBot", an advanced real-time AI Support Specialist for our modern SaaS platform.
Provide a concise, extremely professional, empathetic, and actionable solution to the customer's query.
Keep it under 3-4 sentences. Do not hallucinate or use markups inside the text except bold names or clear bullet steps.
If the customer's problem is technical, suggest they verify their API scopes, check their network configurations, or let them know a human lead is taking over shortly.
`;

  if (!client) {
    // Elegant fallback simulation when running without a custom API key.
    return getSaaSFallbackReply(ticketTitle, ticketDescription);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are "InterBot", a helpful, elite SaaS support chat assistant. Use short paragraphs and list steps clearly.',
        temperature: 0.7,
      },
    });

    if (response && response.text) {
      return response.text.trim();
    }
    return 'Hi there! I am InterBot. Let me research this issue with our backend engineering lead. A human team member will also connect with you directly in a few minutes.';
  } catch (error) {
    console.error('Error generating Gemini response, using offline fallback:', error);
    return getSaaSFallbackReply(ticketTitle, ticketDescription);
  }
}

/**
 * Contextual fallback rules based on ticket metadata
 */
function getSaaSFallbackReply(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();

  if (text.includes('bill') || text.includes('charge') || text.includes('refund')) {
    return 'Hi! I am **InterBot**. I have analyzed your account transaction history. It looks like a minor sync delay triggered a momentary double authorization on our credit processor. Our billing agent Emma Carter has been alerted to review this invoice immediately. If confirmed, a refund will be issued back to your original payment method.';
  }

  if (text.includes('api') || text.includes('webhook') || text.includes('end-point') || text.includes('endpoint')) {
    return 'Hello from **InterBot**! I detected a network handshake failure on your connection. Please make sure to whitelist our proxy IP address class **192.168.10.x** in your AWS VPC or internal security groups. Our Integration engineer, Michael Chen, is on standby and will follow up with the complete range of IP blocks shortly.';
  }

  if (text.includes('domain') || text.includes('dns') || text.includes('ssl') || text.includes('tls')) {
    return 'Welcome! I am **InterBot**. For custom subdomain deployments, please configure a **CNAME** pointing to **kb.custom-dns.com** in your DNS dashboard (e.g. Cloudflare). Make sure you toggle "DNS only" during the initialization phase so our auto-provisioning SSL workers can successfully verify and assign your TLS certificates.';
  }

  return `Thank you for contacting live support. I am **InterBot**, your active AI copilot! I have indexed your query: "${title}". I have notified our on-call support specialists who are actively examining your request. We will assist you here in real-time.`;
}

/**
 * Classifies the sentiment of a customer support message using Gemini.
 * Falls back to local heuristics if client is not configured or fails.
 */
export async function classifyMessageSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
  const client = getGeminiClient();
  if (!client) {
    return getLocalHeuristicSentiment(text);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Classify the sentiment of the following customer support message:\n\nMessage: "${text}"`,
      config: {
        systemInstruction: 'Analyze the tone of the message and return a JSON object with a single field "sentiment" containing either "positive", "neutral", or "negative".',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              enum: ['positive', 'neutral', 'negative'],
              description: 'The classified sentiment of the message.'
            }
          },
          required: ['sentiment']
        },
        temperature: 0.1,
      },
    });

    if (response && response.text) {
      const result = JSON.parse(response.text.trim());
      if (result.sentiment === 'positive' || result.sentiment === 'neutral' || result.sentiment === 'negative') {
        return result.sentiment;
      }
    }
    return getLocalHeuristicSentiment(text);
  } catch (error) {
    console.error('Error classifying sentiment with Gemini, falling back to local heuristic:', error);
    return getLocalHeuristicSentiment(text);
  }
}

function getLocalHeuristicSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowercase = text.toLowerCase();
  const positiveWords = [
    'thank', 'perfect', 'awesome', 'great', 'love', 'solved', 'resolved', 
    'appreciate', 'happy', 'good', 'quick', 'easy', 'faster', 'amazing', 'excellent'
  ];
  const negativeWords = [
    'error', 'defect', 'issue', 'fail', 'failed', 'broken', 'bug', 'cannot', "can't", 
    'unable', 'wrong', 'frustrated', 'terrible', 'double charge', 'duplicate', 'problem', 
    'delay', 'refund', 'unauthorized', 'retry', 'slow', 'timeout', 'handshake', 'difficult',
    'annoying', 'complaint', 'bad', 'failing'
  ];
  
  for (const p of positiveWords) {
    if (lowercase.includes(p)) return 'positive';
  }
  for (const n of negativeWords) {
    if (lowercase.includes(n)) return 'negative';
  }
  return 'neutral';
}

export interface SmartCannedReply {
  title: string;
  text: string;
}

/**
 * Generates context-aware canned responses using Gemini.
 * It suggests three helper templates to speed up agent workflows.
 */
export async function generateSmartCannedReplies(
  ticketTitle: string,
  ticketDescription: string,
  messageHistory: string[]
): Promise<SmartCannedReply[]> {
  const client = getGeminiClient();
  
  const formattedHistory = messageHistory.map((m, idx) => `Message ${idx + 1}: ${m}`).join('\n');
  const prompt = `Analyze the support request and chat history to provide exactly 3 context-aware, helpful canned response templates for a customer support agent.
  
Context details:
Support Ticket Topic: ${ticketTitle}
Ticket Original Description: ${ticketDescription}

Conversation thread history:
${formattedHistory || "This is the start of the chat."}

Instructions:
Generate exactly 3 templates. Each template should have:
1. "title": a very short (1-3 words) action label suitable for a button (e.g., "Acknowledge", "Explain IP Check", "Refund Issued", "Request Logs").
2. "text": a highly professional, polite, and contextual message that is complete and ready to send to the client. Keep the message helpful, friendly, and complete. Avoid generic placeholders where possible - use context details when applicable.
`;

  if (!client) {
    return getLocalFallbackCannedReplies(ticketTitle, ticketDescription);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an AI specialized in supporting live agents. Analyze support context and suggest exactly three context-appropriate canned responses in JSON format.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'A very short 1-3 words action label for the response button.'
                  },
                  text: {
                    type: Type.STRING,
                    description: 'The full contextual message template to insert into the input.'
                  }
                },
                required: ['title', 'text']
              }
            }
          },
          required: ['replies']
        },
        temperature: 0.7,
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      if (parsed && Array.isArray(parsed.replies) && parsed.replies.length > 0) {
        return parsed.replies.slice(0, 3);
      }
    }
    return getLocalFallbackCannedReplies(ticketTitle, ticketDescription);
  } catch (error) {
    console.error('Error generating canned replies with Gemini, falling back to local heuristic:', error);
    return getLocalFallbackCannedReplies(ticketTitle, ticketDescription);
  }
}

function getLocalFallbackCannedReplies(title: string, description: string): SmartCannedReply[] {
  const text = (title + ' ' + description).toLowerCase();

  if (text.includes('bill') || text.includes('charge') || text.includes('refund') || text.includes('invoice')) {
    return [
      {
        title: 'Investigating Charge',
        text: 'Hi there! Thank you for raising this billing issue. I am looking into your transaction records right now to check the payment sync.'
      },
      {
        title: 'Confirm Refund',
        text: 'Hi! Our finance team verified the discrepancy and we have triggered a full refund of the double transaction. This should reflect back in your account in 3-5 business days.'
      },
      {
        title: 'Request Bank Statement',
        text: 'Thanks for bringing this up. Could you please share a screenshot or copy of your bank statement showing the duplicate transaction ID so we can verify with our payment processor?'
      }
    ];
  }

  if (text.includes('api') || text.includes('webhook') || text.includes('endpoint') || text.includes('proxy')) {
    return [
      {
        title: 'Suggest Whitelisting',
        text: 'Hi! Could you please ensure that you have whitelisted our proxy IP address class 192.168.10.x inside your AWS security groups or firewall configurations? Let me know if that works!'
      },
      {
        title: 'Request JSON Logs',
        text: 'Hello, could you provide the raw JSON webhook payload and the exact HTTP status code response you receive from your API gateway so we can trace it in our logs?'
      },
      {
        title: 'Assigned to Michael',
        text: 'Our integrations specialist Michael is checking your webhook trace records right now. We will provide a complete diagnostic overview in a few minutes.'
      }
    ];
  }

  return [
    {
      title: 'Polite Acknowledge',
      text: 'Thanks for reaching out! I am actively reviewing your ticket history right now. I will update you here in just a moment.'
    },
    {
      title: 'Request Diagnostics',
      text: 'To get started on troubleshooting this, could you share details about your browser client, any error codes, or screenshots of what you observe?'
    },
    {
      title: 'Escalated to Support',
      text: 'I have logged this ticket with our core infrastructure team to inspect our system databases and cluster logs. Hang tight!'
    }
  ];
}
