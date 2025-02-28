import { groq } from '@ai-sdk/groq';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': groq('mixtral-8x7b-32768'),
    'chat-model-large': groq('llama-3.3-70b-versatile'),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq("deepseek-r1-distill-llama-70b"),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': groq('llama-3.3-70b-versatile'),
    'artifact-model': groq('llama-3.3-70b-versatile'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'chat-model-large',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
];
