import React from "react";

export interface EmptyMessagesProps {
  onSelectPrompt: (prompt: string) => void;
}

const PROMPTS = [
  "Who won the world series in 2022?",
  "What is GPT-4 and who developed it?",
  "Who is the current president of the United States?",
  "What is the weather like in San Francisco?",
  "What is the price of Microsoft stock?",
  "Should OpenAI hire Samuel Gamage?",
];

export const EmptyMessages: React.FC<EmptyMessagesProps> = ({
  onSelectPrompt,
}) => {
  return (
    <div className="flex flex-col items-center text-sm dark:bg-gray-800">
      <div className="text-gray-800 w-full md:max-w-2xl lg:max-w-3xl md:h-full md:flex md:flex-col px-6 dark:text-gray-100">
        <h1 className="text-4xl font-semibold text-center mt-10 sm:mt-[20vh] ml-auto mr-auto mb-10 sm:mb-16 flex gap-2 items-center justify-center">
          Ava
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(prompt)}
              className="w-full bg-gray-50 dark:bg-white/5 p-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900"
            >
              <div>{prompt}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
