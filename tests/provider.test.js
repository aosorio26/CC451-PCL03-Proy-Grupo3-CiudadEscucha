import { test } from "node:test";
import assert from "node:assert/strict";
import { CompatibleProvider } from "../server/assistant.js";
test("contrato LLM con transporte simulado explícito: JSON, contexto y rechazo de campos inválidos", async () => {
  const original = globalThis.fetch;
  let captured;
  try {
    globalThis.fetch = async (url, options) => {
      captured = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  reply: "¿En qué distrito ocurrió?",
                  category: "Semáforos",
                }),
              },
            },
          ],
        }),
      };
    };
    const p = new CompatibleProvider(
      "https://example.invalid",
      "test-model",
      "test-key",
    );
    const r = await p.suggest(
      "Semáforo apagado",
      { recent: [] },
      "Breve y directo",
    );
    assert.equal(r.category, "Semáforos");
    assert.match(
      captured.messages[0].content,
      /Nunca atribuyas atención municipal real/,
    );
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: '{"reply":"Hola","category":"inventada"}' } },
        ],
      }),
    });
    await assert.rejects(() => p.suggest("hola", {}, "Guiado/paciente"));
  } finally {
    globalThis.fetch = original;
  }
});
