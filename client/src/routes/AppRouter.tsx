import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Route, Routes } from "react-router-dom";
import FullScreenLoading from "../components/FullScreenLoading";
import { RootLayout } from "../components/layout/RootLayout";
import { NotFoundPage } from "../pages/NotFoundPage";
import ChatRouter from "./ChatRouter";

const RootRouter = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return <FullScreenLoading />;
  }

  if (!isAuthenticated) {
    loginWithRedirect();

    return <FullScreenLoading />;
  }

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<ChatRouter />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Route>
    </Routes>
  );
};

export default RootRouter;
