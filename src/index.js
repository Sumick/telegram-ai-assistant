const { Telegraf } = require("telegraf");
const { Groq } = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome to your AI Assistant!"));

bot.on("message", async (ctx) => {
  const aiResponse = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: ctx.message.text,
      },
    ],
    model: "llama3-8b-8192",
  });

  const aiResponseText =
    aiResponse.choices[0]?.message?.content || "No response";

  ctx.reply(aiResponseText);
});

bot.launch();

console.log("Bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
