import { useAuth0 } from "@auth0/auth0-react";
import { Avatar } from "@chakra-ui/react";
import Markdown from "react-markdown";
import clsx from "clsx";
import React from "react";
import { ChatMessage as IMessage } from "../stores/chat";

interface MessageProps extends IMessage {}

const Message: React.FC<MessageProps> = (props) => {
  const { sender, text } = props;
  const { user } = useAuth0();

  return (
    <div
      className={clsx(
        "group w-full text-gray-800 dark:text-gray-100",
        sender === "bot" && "bg-gray-100 dark:bg-gray-700",
        sender === "user" && "bg-transparent"
      )}
    >
      <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex lg:px-0 m-auto">
        <Avatar
          size="sm"
          rounded="sm"
          name={sender === "user" ? user?.name : "Ava"}
        />
        <div className="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)]">
          <div className="flex flex-grow flex-col gap-3">
            <div className="min-h-[20px] flex flex-col items-start whitespace-pre-wrap">
              {sender === "bot" ? (
                <Markdown className="markdown prose w-full break-words dark:prose-invert dark">
                  {text}
                </Markdown>
              ) : (
                text
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
