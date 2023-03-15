import * as React from "react";
import { Helmet } from "react-helmet";
import { Outlet } from "react-router-dom";
import { ChatSidebar } from "./ChatSidebar";

export const ChatLayout: React.FC = () => {
  return (
    <>
      <div className="overflow-hidden w-full h-full relative">
        <div className="flex h-full flex-1 flex-col md:pl-[260px]">
          <Outlet />
        </div>
        <ChatSidebar />
      </div>
    </>
  );
};
