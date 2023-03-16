import { useAuth0 } from "@auth0/auth0-react";
import {
  createContext,
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useQuery } from "react-query";

export type WebsocketStatus =
  | "idle"
  | "loading"
  | "connected"
  | "closed"
  | "error";

export interface WebsocketState {
  websocket: WebSocket | null;
  connected: boolean;
  error: boolean;
  isLoading: boolean;
  status: WebsocketStatus;
}

export const WebsocketContext = createContext<WebsocketState>({
  websocket: null,
  connected: false,
  error: false,
  isLoading: false,
  status: "loading",
});

const WebsocketProvider: FunctionComponent<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { getAccessTokenSilently } = useAuth0();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<WebsocketStatus>("idle");
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const connectionQuery = useQuery(
    ["connection"],
    () => {
      setIsLoading(true);
      setStatus("loading");
      return new WebSocket(
        import.meta.env.VITE_API_URL || "ws://localhost:8080/chat"
      );
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      onSuccess: (websocket) => {
        setWebsocket(websocket);

        websocket.onopen = async (e) => {
          setConnected(true);
          setIsLoading(false);
          setStatus("connected");
          try {
            const token = await getAccessTokenSilently({
              authorizationParams: {
                audience: `api://ava-chat`,
                scope: "read:messages",
              },
            });
            websocket.send(
              JSON.stringify({
                type: "authenticate",
                token,
              })
            );
          } catch (e) {
            console.error(e);
            setStatus("error");
            setConnected(false);
            throw new Error("Could not authenticate");
          }
        };

        websocket.onclose = (e) => {
          setConnected(false);
          setIsLoading(false);
        };

        websocket.onerror = (e) => {
          console.error("Websocket error", e);
          setError(true);
          setIsLoading(false);
          setStatus("error");
        };
      },
    }
  );

  useEffect(() => {
    (async () => {
      if (!connected && status !== "error") {
        await connectionQuery.refetch();
      }
    })();
  }, [connected]);

  return (
    <WebsocketContext.Provider
      value={{
        websocket,
        connected,
        error,
        status,
        isLoading,
      }}
    >
      {children}
    </WebsocketContext.Provider>
  );
};

export const useWebsocket = (): WebsocketState => {
  const ctx = useContext(WebsocketContext);
  if (ctx === undefined) {
    throw new Error("useWebsocket can only be used inside WebsocketContext");
  }
  return ctx;
};

export default WebsocketProvider;
