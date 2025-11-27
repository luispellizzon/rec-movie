import {LoadingBox} from "./LoadingBox";
export const Loading: React.FC<{message?: string}> = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 via-pink-500 to-red-500">
      <LoadingBox message="Finding Perfect Movies for You" />
    </div>
  );
};
