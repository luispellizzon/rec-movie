import {useEffect, useState} from "react";
import {Film} from "lucide-react";

export const LoadingBox: React.FC<{message?: string}> = ({
  message = "Generating new recommendations for you!",
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;

    interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;

        // Random increments (feel more "AI-like")
        const increment = Math.floor(Math.random() * 10) + 1; // 1–10%
        return Math.min(prev + increment, 90);
      });
    }, 800); // every 0.5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full mx-4">
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-linear-to-br from-purple-600 to-pink-600 rounded-full p-4">
          <Film className="w-16 h-16 text-white" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {message}
        </h2>
        <div className="relative w-full">
          {" "}
          <div className="animate-spin rounded-full h-16 w-16 border-6 border-purple-50 border-t-purple-600 border-b-purple-600 border-r-purple-600 mx-auto"></div>{" "}
        </div>

        <p className="text-gray-600 text-center">
          Our AI is analyzing your preferences and regenerating the best
          movies...
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-linear-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-500"
            style={{width: `${progress}%`}}
          />
        </div>

        <p className="text-sm text-gray-500">{progress}%</p>
      </div>
    </div>
  );
};
