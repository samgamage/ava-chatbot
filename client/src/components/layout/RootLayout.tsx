import { ColorModeScript } from "@chakra-ui/react";
import * as React from "react";
import { Helmet } from "react-helmet";
import { Outlet } from "react-router-dom";
import theme from "../../theme";

export const RootLayout: React.FC = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Outlet />
    </>
  );
};
