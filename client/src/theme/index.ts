import { extendTheme } from "@chakra-ui/react";
import colors from "./colors";

const theme = extendTheme({
  colors,
  config: { initialColorMode: "dark", useSystemColorMode: false },
});

export default theme;
