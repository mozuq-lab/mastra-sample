import { mathAgent } from "../mastra/agents/math-agent";

async function main() {
  try {
    const response = await mathAgent.generate(
      [
        {
          role: "user",
          content:
            "タクシー運転手が1時間あたり9461円で12時間働いた場合、総収入はいくらですか？",
        },
      ],
      {
        maxSteps: 5,
      }
    );
    console.log(response.text);
  } catch (error) {
    console.error("Error generating response:", error);
  }
}

main();
