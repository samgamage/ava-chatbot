import { create } from "zustand";

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  type: "stream" | "search" | "info" | "error" | "start" | "end";
}

export interface ChatStore {
  messages: ChatMessage[];
  onBotTokenReceived(token: string): void;
  addMessage(message: ChatMessage): void;
  clearMessages(): void;
}

export const useChatStore = create<ChatStore>(
  (set) => ({
    messages: [],
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
