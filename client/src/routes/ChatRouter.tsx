import { Navigate, Route, Routes } from "react-router-dom";
import { ChatLayout } from "../components/layout/ChatLayout";
import WebsocketProvider from "../lib/hooks/useSocket";
import { ChatPage } from "../pages/ChatPage";

const ChatRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ChatLayout />}>
        <Route
          index
          element={
            <WebsocketProvider>
              <ChatPage />
            </WebsocketProvider>
          }
        />
        <Route path="*" element={<Navigate to="/404" />} />
      </Route>
    </Routes>
  );
};

export default ChatRouter;
