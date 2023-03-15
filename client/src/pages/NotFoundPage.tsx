import { Button } from "@chakra-ui/react";
import ExclamationTriangleIcon from "@heroicons/react/24/outline/ExclamationTriangleIcon";
import { Helmet } from "react-helmet";
import { NavLink } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Not Found</title>
      </Helmet>
      <div className="flex flex-col h-full w-full text-lg text-gray-900 space-y-8 items-center justify-center">
        <div className="space-y-5 flex flex-col items-center justify-center">
          <div className="flex flex-col space-y-1">
            <ExclamationTriangleIcon height={90} className="text-gray-700" />
            <p>That page doesn't exist.</p>w
          </div>
          <NavLink to="/">
            <Button>Go to home</Button>
          </NavLink>
        </div>
      </div>
    </>
  );
};
