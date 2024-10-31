import { Telegraf } from "telegraf";
import Groq from "groq-sdk";

dotenv.config();

import { assistantSystemPrompt } from "./prompt/assistant-system.prompt.js";
import { message } from "telegraf/filters";
import { queryData, upsertInput } from "./vector-db.js";
import dotenv from "dotenv";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome to your AI Assistant!"));

bot.on(message("text"), async (ctx) => {
  const userMessage = ctx.message.text;

  // Retrieve similar memories
  const memories = await queryData(userMessage);

  // Prepare context for the assistant prompt
  const memoryContext = memories
    .map(
      (memory, index) =>
        `Memory ${index + 1}: User said "${memory.userMessage}" and Assistant replied "${memory.botResponse}".`,
    )
    .join("\n");

  console.log("Memory context:", memoryContext);

  // Combine memory context with assistant prompt
  const assistantPrompt = `${assistantSystemPrompt}\n\n${memoryContext}\n\n`;

  const aiResponse = await groq.chat.completions.create({
    messages: [
      { role: "system", content: assistantPrompt },
      { role: "user", content: userMessage },
    ],
    model: "llama-3.2-90b-vision-preview",
  });

  const aiResponseText =
    aiResponse.choices[0]?.message?.content || "No response";

  ctx.reply(aiResponseText);

  // Store the new interaction in vector DB
  await upsertInput(userMessage, aiResponseText);
});

bot.on(message("photo"), async (ctx) => {
  const imageCaption = ctx.message.caption || "No caption provided";
  const image = ctx.message.photo[ctx.message.photo.length - 1];

  const imageBaseUrl = await ctx.telegram.getFileLink(image.file_id);
  const imageHref = imageBaseUrl.href;

  const imageBase64 = await fetch(imageHref)
    .then((res) => res.arrayBuffer())
    .then((buffer) => Buffer.from(buffer).toString("base64"));

  const userMessageContent = [
    {
      type: "text",
      text: imageCaption,
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`,
      },
    },
  ];

  const aiResponse = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: userMessageContent,
      },
    ],
    model: "llama-3.2-90b-vision-preview",
  });
  //
  const aiResponseText =
    aiResponse.choices[0]?.message?.content || "No response";

  ctx.reply(aiResponseText);
});

bot.launch();

console.log("Bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
