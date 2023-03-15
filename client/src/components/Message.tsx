import { useAuth0 } from "@auth0/auth0-react";
import { Avatar } from "@chakra-ui/react";
import Markdown from "react-markdown";
import clsx from "clsx";
import React from "react";
import CheckIcon from "@heroicons/react/24/outline/CheckIcon";
import { ChatMessage as IMessage } from "../stores/chat";

interface MessageProps extends IMessage {}

const Message: React.FC<MessageProps> = (props) => {
  const { sender, text, type } = props;
  const { user } = useAuth0();

  if (!text) return null;

  return (
    <div
      className={clsx(
        "group w-full",
        type !== "error" && "text-gray-800 dark:text-gray-100",
        sender === "bot" && "bg-gray-100 dark:bg-gray-700",
        sender === "user" && "bg-transparent"
      )}
    >
      <div
        className={clsx(
          "text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl flex lg:px-0 m-auto",
          type === "search" && "items-center p-4",
          type !== "search" && "p-4 md:py-6"
        )}
      >
        {sender === "bot" && type === "search" ? (
          <div className="h-[32px] w-[32px] flex items-center justify-center">
            <CheckIcon className="text-green-500" height={20} width={20} />
          </div>
        ) : (
          <Avatar
            size="sm"
            rounded="sm"
            name={sender === "user" ? user?.name : "Ava"}
          />
        )}
        <div className="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)]">
          <div className="flex flex-grow flex-col">
            <div className="min-h-[20px] flex flex-col items-start whitespace-pre-wrap">
              {sender === "bot" ? (
                <Markdown
                  className={clsx(
                    "markdown prose w-full break-words dark:prose-invert dark",
                    type === "error" && "text-red-400"
                  )}
                >
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
