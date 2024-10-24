const { Telegraf } = require("telegraf");
const { Groq } = require("groq-sdk");
const { assistantSystemPrompt } = require("./prompt/assistant-system.prompt");
const { message } = require("telegraf/filters");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome to your AI Assistant!"));

bot.on("text", async (ctx) => {
  const aiResponse = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: assistantSystemPrompt,
      },
      {
        role: "user",
        content: ctx.message.text,
      },
    ],
    model: "llama-3.2-90b-vision-preview",
  });

  const aiResponseText =
    aiResponse.choices[0]?.message?.content || "No response";

  ctx.reply(aiResponseText);
});

bot.on(message("photo"), async (ctx) => {
  // Check and log the entire message object for debugging

  // Attempt to get the image caption
  const imageCaption = ctx.message.caption || "No caption provided";

  // Get the image object (largest available photo)
  const image = ctx.message.photo[ctx.message.photo.length - 1];

  const imageBaseUrl = await ctx.telegram.getFileLink(image.file_id);
  const imageHref = imageBaseUrl.href;

  const imageBase64 = await fetch(imageHref)
    .then((res) => res.arrayBuffer())
    .then((buffer) => Buffer.from(buffer).toString("base64"));

  // Create the user message with an array of content parts
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

  const aiResponseText =
    aiResponse.choices[0]?.message?.content || "No response";

  ctx.reply(aiResponseText);
});

bot.launch();

console.log("Bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
