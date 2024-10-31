import { Pinecone } from "@pinecone-database/pinecone";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index("nb-assistant");

export const upsertInput = async (input, response, type = "conversation") => {
  if (typeof input !== "string" || typeof response !== "string") {
    throw new Error("Input and response must be strings");
  }

  const model = "multilingual-e5-large";

  const embeddings = await pc.inference.embed(model, [input], {
    inputType: "passage",
    truncate: "END",
  });

  const vectors = embeddings[0].values;
  const uuid = crypto.randomUUID();

  const data = {
    id: uuid.toString(),
    values: vectors,
    metadata: {
      type,
      userMessage: input,
      botResponse: response,
      timestamp: new Date().toISOString(),
      tags: [], // optional: add relevant tags like "greeting" or "faq"
    },
  };

  try {
    await index.namespace("ns1").upsert([data]);
  } catch (error) {
    console.error("Error upserting data:", error);
  }
};

export const queryData = async (query, typeFilter = "conversation") => {
  const model = "multilingual-e5-large";

  const queryEmbedding = await pc.inference.embed(model, [query], {
    inputType: "query",
  });

  const vectors = queryEmbedding[0].values;

  const queryResponse = await index.namespace("ns1").query({
    topK: 5,
    vector: vectors,
    includeValues: true,
    includeMetadata: true,
  });

  // Filter memories by type if needed (optional)
  const filteredResults = queryResponse.matches.filter(
    (match) => match.metadata.type === typeFilter,
  );

  // Retrieve and print user messages and bot responses
  const memories = filteredResults.map((match) => ({
    userMessage: match.metadata.userMessage,
    botResponse: match.metadata.botResponse,
    score: match.score,
  }));

  return memories;
};
