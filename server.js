// ============================================================
// BOOMINUM SERVER - VERSÃO FINAL 2025 (CORRIGIDA)
// GROQ + Supabase + Limite diário + Compatível com script.js
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
const Groq = require("groq-sdk");

// ------------------------------------------------------------
// EXPRESS
// ------------------------------------------------------------
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// SUPABASE
// ------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ ERRO: SUPABASE_URL ou SUPABASE_ANON_KEY ausentes no .env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Limite diário gratuito
const FREE_LIMIT = parseInt(process.env.FREE_LIMIT || "5", 10);

// ------------------------------------------------------------
// GROQ
// ------------------------------------------------------------
const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.error("❌ ERRO: GROQ_API_KEY não definida no .env");
}

const groq = new Groq({ apiKey: groqApiKey });

// ------------------------------------------------------------
// MODELOS REAIS SUPORTADOS PELO FRONT + GROQ
// ------------------------------------------------------------
const AVAILABLE_MODELS = [
  "llama-3.2-70b-text",
  "llama-3.2-11b-text",
  "mixtral-8x7b-32768"
];

// Modelo padrão do sistema
const DEFAULT_MODEL = "llama-3.2-70b-text";

// ------------------------------------------------------------
// ROTA PRINCIPAL /api/generate
// ------------------------------------------------------------
app.post("/api/generate", async (req, res) => {
  const { prompt, model, userId } = req.body;

  console.log("\n📩 Recebido do front:", req.body);

  try {
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "Prompt obrigatório." });
    }

    // --------------------------------------------------------
    // 1. Limite diário por usuário
    // --------------------------------------------------------
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const { count, error: countError } = await supabase
        .from("scripts")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());

      if (countError) throw countError;

      if (count >= FREE_LIMIT) {
        return res.status(403).json({
          error: "Limite de geração atingido.",
          details: `Você já gerou ${FREE_LIMIT} roteiros hoje.`
        });
      }
    }

    // --------------------------------------------------------
    // 2. Validar modelo enviado pelo script.js
    // --------------------------------------------------------
    const selectedModel =
      AVAILABLE_MODELS.includes(model) ? model : DEFAULT_MODEL;

    console.log(`🤖 Usando modelo: ${selectedModel}`);

    // --------------------------------------------------------
    // 3. CHAMAR GROQ
    // --------------------------------------------------------
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content:
            "Você gera roteiros profissionais, curtos, criativos e virais para vídeos curtos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 900
    });

    const generatedText =
      completion?.choices?.[0]?.message?.content ||
      "Erro: resposta vazia da IA.";

    console.log("✅ Roteiro gerado.");

    // --------------------------------------------------------
    // 4. SALVAR NO SUPABASE
    // --------------------------------------------------------
    if (userId) {
      await supabase.from("scripts").insert([
        {
          user_id: userId,
          prompt,
          roteiro_final: generatedText,
          model_usado: selectedModel
        }
      ]);
    }

    // --------------------------------------------------------
    // 5. RETORNAR RESPOSTA AO FRONT
    // --------------------------------------------------------
    return res.json({
      success: true,
      model: selectedModel,
      result: generatedText
    });

  } catch (err) {
    console.log("❌ ERRO NO /api/generate:", err);

    return res.status(500).json({
      error: "Erro interno ao gerar roteiro.",
      details: err.message || String(err)
    });
  }
});

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🔥 Servidor BOOMINUM rodando na porta ${PORT} (GROQ ATIVO!)`);
});
