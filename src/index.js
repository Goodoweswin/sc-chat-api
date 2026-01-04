/**
 * sc-chat-api: Single Cell Chat API on Cloudflare Workers
 * Features: AI Chat (Gemini), Basic Auth, Rate Limiting, Knowledge Base Search
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Change to your domain in production
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle OPTIONS (Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: POST /api/chat
      if (path === "/api/chat" && request.method === "POST") {
        return await handleChat(request, env, corsHeaders);
      }

      // Route: GET /api/search
      if (path === "/api/search" && request.method === "GET") {
        return await handleSearch(request, env, corsHeaders);
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};

/**
 * Handle AI Chat Request
 * Flow: Auth -> Rate Limit -> Knowledge Retrieval -> Gemini -> Response
 */
async function handleChat(request, env, corsHeaders) {
  // 1. Authentication
  if (!checkPassword(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // 2. Rate Limiting
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const isAllowed = await checkRateLimit(ip, env);
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded (100 requests/day)" }), { 
      status: 429, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // 3. Parse Request
  const body = await request.json();
  const userQuestion = body.question || "";
  if (!userQuestion) {
    return new Response(JSON.stringify({ error: "Question is required" }), { status: 400, headers: corsHeaders });
  }

  // 4. Retrieve Knowledge Context
  const context = await fetchKnowledgeContext(userQuestion, env);

  // 5. Build Prompt
  const prompt = buildSingleCellPrompt(userQuestion, context);

  // 6. Call Gemini API
  const aiResponse = await callGemini(prompt, env);

  // 7. Return Result
  return new Response(JSON.stringify({
    answer: aiResponse,
    references: context.map(c => c.title),
    quota: { used: "tracked_internally", total: 100 }
  }), { 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}

/**
 * Handle Full-text Search (Public API)
 */
async function handleSearch(request, env, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Simple search implementation (In production, use a real search index or filter KV keys)
  // For now, we'll just return a placeholder or scan keys if list is small
  // This is a simplified version.
  const results = []; 
  // Logic to search KNOWLEDGE_INDEX would go here. 
  // Since KV listing is slow, we usually rely on a separate index or just return empty for now.
  
  return new Response(JSON.stringify(results), { 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}

/**
 * Check HTTP Basic Auth
 */
function checkPassword(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = atob(base64Credentials); // user:password
  const [username, password] = credentials.split(":");

  // Compare with environment variable
  return password === env.ACCESS_PASSWORD;
}

/**
 * Check Rate Limit using KV
 * Limit: 100 requests per IP per day
 */
async function checkRateLimit(ip, env) {
  const key = `rate_limit:${ip}:${new Date().toISOString().split('T')[0]}`; // Key: rate_limit:1.2.3.4:2025-01-03
  const count = await env.RATE_LIMIT.get(key);
  
  if (count && parseInt(count) >= 100) {
    return false;
  }

  // Increment count
  const newCount = count ? parseInt(count) + 1 : 1;
  await env.RATE_LIMIT.put(key, newCount.toString(), { expirationTtl: 86400 }); // Expire in 24h
  return true;
}

/**
 * Fetch relevant context from Knowledge Base KV
 * (Simplified keyword matching)
 */
async function fetchKnowledgeContext(question, env) {
  // In a real app, you might use Vector Search (Vectorize).
  // Here we simulate retrieving relevant docs.
  // We assume KNOWLEDGE_INDEX contains JSON values: { title, content, keywords }
  
  // For demo purposes, returning empty or static context if KV is empty
  // You would populate KV with: await env.KNOWLEDGE_INDEX.put("doc1", JSON.stringify({...}))
  
  return []; 
}

/**
 * Build System Prompt for Single Cell Domain
 */
function buildSingleCellPrompt(question, context) {
  const contextText = context.map(c => `Title: ${c.title}\nContent: ${c.content}`).join("\n\n");
  
  return `
    You are an expert in Single-Cell Omics and Bioinformatics.
    Use the following context to answer the user's question.
    If the answer is not in the context, use your general knowledge but mention that it's general info.
    
    Context:
    ${contextText}
    
    User Question: ${question}
    
    Answer in a professional, academic tone. Use Markdown.
  `;
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, env) {
  const apiKey = env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
