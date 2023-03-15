import { Transition } from "@headlessui/react";
import clsx from "clsx";
import React, { createRef, useEffect, useState } from "react";
import PaperAirplaneIcon from "@heroicons/react/20/solid/PaperAirplaneIcon";
import { useWebsocket } from "../lib/hooks/useSocket";

interface ComposerProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}

const Composer: React.FC<ComposerProps> = (props) => {
  const { websocket } = useWebsocket();
  const { onSubmit, className, message, setMessage } = props;
  const [isFocused, setFocused] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(false);
  const inputRef = createRef<HTMLTextAreaElement>();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "0px";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
    }
  }, []);

  const handleOnChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.target.value.length <= 250) {
      setMessage((e.target as HTMLTextAreaElement).value || "");
    }
  };

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (onSubmit) onSubmit(e);
      setMessage("");
      if (websocket) websocket.send(message);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (event.key === "Enter") {
      event.stopPropagation();
      handleOnSubmit(event as any);
    }
  };

  const handleFocus: React.FocusEventHandler<HTMLTextAreaElement> = (event) => {
    setFocused(true);
  };

  const handleBlur: React.FocusEventHandler<HTMLTextAreaElement> = (event) => {
    setFocused(false);
  };

  return (
    <div
      className={clsx(
        "stretch mx-2 flex flex-row gap-3 mt-4 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-3xl",
        className
      )}
    >
      <Transition
        show={!isDisabled}
        className="relative flex h-full flex-1 md:flex-col"
        enter="transform transition-all duration-100"
        enterFrom="opacity-0 translate-y-6"
        enterTo="opacity-100 translate-y-0"
        leave="transform transition-all duration-75"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-6"
      >
        <form
          onSubmit={handleOnSubmit}
          className="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]"
        >
          <textarea
            ref={inputRef}
            id="message"
            className="m-0 w-full resize-none border-0 bg-transparent p-0 pl-2 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:pl-0"
            name="message"
            value={message}
            disabled={isDisabled}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            className="absolute p-1 rounded-md text-gray-500 bottom-1.5 right-1 md:bottom-2.5 md:right-2 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            type="submit"
            disabled={isDisabled || message.length === 0}
          >
            <PaperAirplaneIcon height={18} />
          </button>
        </form>
      </Transition>
    </div>
  );
};

export default Composer;
