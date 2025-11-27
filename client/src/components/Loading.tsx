import {Film} from "lucide-react";
import {LoadingBox} from "./LoadingBox";
export const Loading: React.FC<{message?: string}> = ({
  message = "Finding Perfect Movies for You",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 via-pink-500 to-red-500">
      <LoadingBox />
    </div>
  );
};
