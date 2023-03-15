import { Button, useColorMode } from "@chakra-ui/react";
import * as React from "react";
import PlusIcon from "@heroicons/react/24/outline/PlusIcon";
import SunIcon from "@heroicons/react/24/outline/SunIcon";
import ArrowRightOnRectangleIcon from "@heroicons/react/24/outline/ArrowRightOnRectangleIcon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import { useAuth0 } from "@auth0/auth0-react";
import { useChatStore } from "../../stores/chat";

export const ChatSidebar: React.FC = () => {
  const { clearMessages } = useChatStore();
  const { colorMode, toggleColorMode } = useColorMode();
  const { logout } = useAuth0();

  return (
    <div className="dark:bg-gray-900 bg-black/20 hidden md:fixed md:inset-y-0 md:flex md:w-[260px] md:flex-col">
      <div className="flex h-full min-h-0 flex-col">
        <nav className="flex h-full flex-1 flex-col space-y-2 p-2">
          <Button
            variant="outline"
            leftIcon={<PlusIcon height={19} />}
            onClick={clearMessages}
          >
            New chat
          </Button>
          <div className="flex-col flex-1 overflow-y-auto border-b dark:border-white/20 border-black/20"></div>
          <Button
            variant="ghost"
            leftIcon={
              colorMode === "dark" ? (
                <SunIcon height={19} />
              ) : (
                <MoonIcon height={19} />
              )
            }
            onClick={toggleColorMode}
          >
            {colorMode === "light" ? "Dark mode" : "Light mode"}
          </Button>
          <Button
            variant="ghost"
            leftIcon={<ArrowRightOnRectangleIcon height={19} />}
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Log out
          </Button>
        </nav>
      </div>
    </div>
  );
};
