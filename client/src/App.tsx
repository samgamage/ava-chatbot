import { Suspense, useMemo } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
} from "react-query";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter as Router } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import FullScreenLoading from "./components/FullScreenLoading";
import { ErrorPage } from "./pages/ErrorPage";
import RootRouter from "./routes/AppRouter";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";

function App() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            useErrorBoundary: (err: any) =>
              err && err.status >= 401 && err.status !== 422,
            retry(failureCount, err: any) {
              return err.status >= 500 && failureCount < 3;
            },
          },
          mutations: {
            useErrorBoundary: (err: any) =>
              err && err.status >= 401 && err.status !== 422,
            retry: false,
          },
        },
        queryCache: new QueryCache(),
      }),
    []
  );

  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary FallbackComponent={ErrorPage} onReset={reset}>
              <Suspense fallback={<FullScreenLoading />}>
                <Auth0Provider
                  domain="dev-okpm815z.us.auth0.com"
                  clientId="33IUpYYmOAYKwR3zEx7kP7TI5stRFb5G"
                  authorizationParams={{
                    redirect_uri: window.location.origin,
                  }}
                >
                  <Router>
                    <RootRouter />
                  </Router>
                </Auth0Provider>
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
