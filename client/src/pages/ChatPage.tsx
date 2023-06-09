import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import ScrollToBottom from "react-scroll-to-bottom";
import Composer from "../components/Composer";
import { shallow } from "zustand/shallow";
import { EmptyMessages } from "../components/EmptyMessages";
import FullScreenLoading from "../components/FullScreenLoading";
import Message from "../components/Message";
import { useWebsocket } from "../lib/hooks/useSocket";
import { ChatMessage, useChatStore } from "../stores/chat";

export const ChatPage = () => {
  const {
    messages,
    conversationId,
    addMessage,
    onBotTokenReceived,
    onSearchStart,
    startNewConversation,
  } = useChatStore(
    (state) => ({
      messages: state.messages,
      conversationId: state.conversationId,
      addMessage: state.addMessage,
      onBotTokenReceived: state.onBotTokenReceived,
      onSearchStart: state.onSearchStart,
      startNewConversation: state.startNewConversation,
    }),
    shallow
  );
  const { websocket, status } = useWebsocket();
  const [message, setMessage] = useState("");

  const onMessage = (message: ChatMessage) => {
    if (message.sender === "bot") {
      if (message.type === "start") {
        addMessage(message);
      } else if (message.type === "stream") {
        onBotTokenReceived(message.text);
      } else if (message.type === "search") {
        onSearchStart(message.text);
      } else if (message.type === "error") {
        addMessage(message);
      }
    }
  };

  useEffect(() => {
    if (websocket && status === "connected") {
      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data) as ChatMessage;
        onMessage(message);
      };
    }

    return () => {
      if (websocket) websocket.onmessage = null;
    };
  }, [websocket, status]);

  if (status === "loading") {
    return <FullScreenLoading />;
  }

  return (
    <>
      <Helmet>
        <title>Chat</title>
      </Helmet>
      <main className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1 dark:bg-gray-800 bg-white">
        <div className="flex-1 overflow-hidden">
          <ScrollToBottom className="flex flex-col items-center text-sm dark:bg-gray-800 h-full w-full">
            {status === "error" ? (
              <Message
                sender="bot"
                text="Something went wrong. Please try refreshing the page or try again later."
                type="error"
              />
            ) : !messages.length ? (
              <EmptyMessages
                onSelectPrompt={(prompt) => {
                  setMessage(prompt);
                  if (!conversationId) startNewConversation();
                }}
              />
            ) : (
              messages.map((message, index) => (
                <Message
                  key={index}
                  sender={message.sender}
                  text={message.text}
                  type={message.type}
                />
              ))
            )}
            <div className="w-full h-32 md:h-48 flex-shrink-0"></div>
          </ScrollToBottom>
        </div>
        <div className="absolute bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2 bg-gradient-to-t dark:from-gray-800 dark:via-gray-800 dark:to-transparent from-white via-white to-transparent ">
          <Composer message={message} setMessage={setMessage} />
          <div className="px-3 pt-2 pb-3 text-center prose-a:text-sky-600 prose-sm text-sm text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6">
            Project built by{" "}
            <a
              href="https://samgamage.dev"
              className="hover:underline"
              target="_blank"
            >
              Sam Gamage
            </a>{" "}
            using{" "}
            <a
              href="https://chat.openai.com/chat"
              className="hover:underline"
              target="_blank"
            >
              ChatGPT
            </a>{" "}
            and the{" "}
            <a
              href="https://openai.com"
              className="hover:underline"
              target="_blank"
            >
              OpenAI
            </a>{" "}
            API.
          </div>
        </div>
      </main>
    </>
  );
};
