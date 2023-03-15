import React from "react";
import { Spinner } from "@chakra-ui/react";

interface FullScreenLoadingProps {}

const FullScreenLoading: React.FC<FullScreenLoadingProps> = () => {
  return (
    <div
      aria-label="Loading spinner"
      className="w-full h-full flex items-center justify-center flex-col bg-white dark:bg-gray-800"
    >
      <Spinner size="lg" />
    </div>
  );
};

export default FullScreenLoading;
