// index.js
// Backend minimal com Groq (CommonJS). Coloque sua GROQ_API_KEY no .env
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));

// PORT e configuração
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "llama-3.1-8b-instant"; // altere no .env se necessário

// valida chave
if (!GROQ_API_KEY) {
  console.warn("⚠️ Aviso: GROQ_API_KEY não configurada. Defina no arquivo .env para usar o Groq.");
}

// inicializa cliente Groq (se tiver chave)
let groq = null;
if (GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: GROQ_API_KEY });
  } catch (err) {
    console.error("Erro inicializando groq-sdk:", err.message || err);
    groq = null;
  }
}

// rota raiz (verificação)
app.get("/", (req, res) => {
  return res.send("Servidor rodando com sucesso! GROQ " + (groq ? "conectado." : "não conectado (sem chave)."));
});

// rota GET test (query)
app.get("/generate", async (req, res) => {
  try {
    const q = req.query.prompt;
    const model = req.query.model || DEFAULT_MODEL;
    if (!q) return res.status(400).json({ sucesso: false, erro: "O prompt é obrigatório (query)." });

    if (!groq) return res.status(500).json({ sucesso: false, erro: "Groq não inicializado. Configure GROQ_API_KEY no .env." });

    console.log("🔵 Prompt recebido (GET):", q);

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Você é um gerador de roteiros criativo e direto." },
        { role: "user", content: q }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const resposta = completion.choices?.[0]?.message?.content ?? "Erro ao gerar resposta.";
    console.log("🟢 Roteiro gerado com sucesso (GET)!");
    return res.json({ sucesso: true, roteiro: resposta });

  } catch (error) {
    console.error("🔴 Erro no GET /generate:", error);
    // propaga mensagem útil quando disponível
    const msg = error?.message || JSON.stringify(error);
    return res.status(500).json({ sucesso: false, erro: "Falha ao gerar roteiro: " + msg });
  }
});

// rota POST /gerar (recomendada pelo frontend)
app.post("/gerar", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const useModel = model || DEFAULT_MODEL;

    if (!prompt) return res.status(400).json({ sucesso: false, erro: "O prompt é obrigatório (body)." });
    if (!groq) return res.status(500).json({ sucesso: false, erro: "Groq não inicializado. Configure GROQ_API_KEY no .env." });

    console.log("🔵 Prompt recebido (POST):", typeof prompt === "string" ? prompt.slice(0,200) : prompt);

    const completion = await groq.chat.completions.create({
      model: useModel,
      messages: [
        { role: "system", content: "Você é um gerador de roteiros criativo e direto." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const resposta = completion.choices?.[0]?.message?.content ?? "Erro ao gerar resposta.";
    console.log("🟢 Roteiro gerado com sucesso (POST)!");
    return res.json({ sucesso: true, roteiro: resposta });

  } catch (error) {
    console.error("🔴 Erro no POST /gerar:", error);
    // devolve mensagem detalhada quando disponível (útil para debugar API key / model)
    let details = error?.message || JSON.stringify(error);
    // se o SDK retornou object com status e error, tente extrair
    if (error?.status && error?.error) {
      details = `${error.status} ${JSON.stringify(error.error)}`;
    }
    return res.status(500).json({ sucesso: false, erro: "Falha ao gerar roteiro", details });
  }
});

// start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});