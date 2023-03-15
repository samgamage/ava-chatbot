import { create } from "zustand";
import {v4 as uuid} from "uuid"

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  type: "stream" | "search" | "info" | "error" | "start" | "end";
}

export interface ChatStore {
  conversationId: string | null;
  messages: ChatMessage[];
  startNewConversation(): void;
  onSearchStart(query: string): void;
  onBotTokenReceived(token: string): void;
  addMessage(message: ChatMessage): void;
  clearMessages(): void;
}

export const useChatStore = create<ChatStore>(
  (set) => ({
    conversationId: null,
    messages: [],
    startNewConversation() {
      return set((state) => {
        return {
            ...state,
            conversationId: uuid()
        }
      });
    },
    onSearchStart(query: string) {
      return set((state) => {
        const latestMessage = state.messages[state.messages.length - 1];
        return {
            ...state,
            messages: [...state.messages.splice(0, state.messages.length - 1), {
              sender: "bot",
              type: "search",
              text: `Searching for **${query}**`
            }, latestMessage]
        }
      });
    },
    onBotTokenReceived(token: string) {
      return set((state) => {
        const latestMessage = state.messages[state.messages.length - 1];
        if (latestMessage && latestMessage.sender === "bot") {
          latestMessage.text += token;
        }
        return {
            ...state,
            messages: [...state.messages.splice(0, state.messages.length - 1), latestMessage]
        }
      });
    },
    addMessage(message) {
      return set((state) => {
        return {
            ...state,
            messages: [...state.messages, message]
        }
      });
    },
    clearMessages() {
      return set((state) => {
        return {
            ...state,
            messages: []
        }
      });
    },
  })
);
