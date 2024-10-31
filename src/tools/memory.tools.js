const openai = new OpenAI();

const saveMemory = (memory) => {
  // 1. Embed the memory to vectorize it
  // 2. Save the memory to the vector database

  console.log("Memory saved:", memory);
};

const retrieveMemory = (query) => {
  // 1. Vectorize query
  // 2. Use vector to perform similar search in vector database
  // 3. Transform vectors to text

  console.log("Memory retrieved");
};
