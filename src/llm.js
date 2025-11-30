import { openai } from "./ai.js";
// import { zodFunction } from "openai/helpers/zod.js";

export const runLLM = async ({ messages, tools }) => {
  const formattedTools = tools.map((tool) => tool);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages,
    tools: formattedTools,
    tool_choice: "auto",
    parallel_tool_calls: false
  });

  return response.choices[0].message;
};
