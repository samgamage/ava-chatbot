import ExclamationTriangleIcon from "@heroicons/react/24/outline/ExclamationTriangleIcon";
import { Helmet } from "react-helmet";

export const ErrorPage = () => {
  return (
    <>
      <Helmet>
        <title>Error</title>
      </Helmet>
      <div className="flex flex-col h-full w-full text-lg text-gray-900 space-y-2 items-center justify-center">
        <ExclamationTriangleIcon
          height={90}
          className="dark:text-gray-200 text-gray-700"
        />
        <p className="dark:text-white text-black">
          Oops! Something went wrong.
        </p>
      </div>
    </>
  );
};
