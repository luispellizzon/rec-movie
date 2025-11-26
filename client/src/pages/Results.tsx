import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import Navbar from "@/components/NavBar";
import {Button} from "@/components/ui/button";
import {
  LayoutGrid,
  Table as TableIcon,
  Save,
  RefreshCw,
  Star,
  Clock,
} from "lucide-react";
import {useAuth} from "@/context/AuthContext";
import {db} from "@/lib/firebase";
import {collection, addDoc, serverTimestamp} from "firebase/firestore";
import {toast} from "sonner";
import {languageNames, parseMovie} from "@/utils";
import {LoadingBox} from "@/components/LoadingBox";

type ViewMode = "cards" | "table";

interface Movie {
  id: number;
  title: string;
  year: number;
  director: string;
  genres: string[];
  countries: string[];
  rating: number;
  duration: number;
  language: string;
  country: string;
  description: string;
  poster: string;
}

type MovieResponse = {
  content: string;
  id: number;
};
const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {user} = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prev_ids, setPrevIds] = useState<number[]>([]);
  const [movies, setMovies] = useState<Movie[]>(() =>
    (location.state?.movies || []).map((m: MovieResponse) =>
      parseMovie(m.content, m.id)
    )
  );

  useEffect(() => {
    if (!location.state?.movies) return;

    setPrevIds((prev) => [
      ...prev,
      ...location.state.movies.map((m: MovieResponse) => m.id),
    ]);
  }, [location.state?.movies]);

  // Get preferences from location state
  const preferences = location.state.preferences;

  // In production, fetch movies based on preferences

  const handleSaveToHistory = async () => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please log in to save recommendations.",
      });
      return;
    }

    if (!preferences) {
      toast.error("No preferences found", {
        description: "Unable to save recommendations without preferences.",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Create a reference to the user's recommendations collection
      const recommendationsRef = collection(
        db,
        "users",
        user.uid,
        "recommendations"
      );

      // Prepare the data to save
      const recommendationData = {
        userId: user.uid,
        preferences: {
          mood: preferences.selectedMood || preferences.customMood,
          freeTime: preferences.freeTime || "",
          language: preferences.language || "",
          country: preferences.country || "",
          era: preferences.era || "",
          popularity: preferences.popularity || "",
          genres: preferences.genres || [],
          movieCount: preferences.movieCount || "",
        },
        movies: movies.map((movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          director: movie.director,
          genres: movie.genres,
          rating: movie.rating,
          duration: movie.duration,
          language: movie.language,
          countries: movie.countries,
          description: movie.description,
          poster: movie.poster,
        })),
        createdAt: serverTimestamp(),
      };

      console.log(recommendationData);

      // Save to Firestore
      await addDoc(recommendationsRef, recommendationData);

      toast.success("Saved to history!", {
        description: "Your recommendations have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving to history:", error);
      toast.error("Failed to save", {
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while saving recommendations.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // const handleGetNewRecommendations = () => {
  //   navigate("/questionnaire");
  // };

  const handleGetNewRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mood: preferences.selectedMood?.toLowerCase(),
          preferred_length: Number(preferences.freeTime),
          language:
            preferences.language === "any" ? null : preferences.language,
          country: preferences.country === "any" ? null : preferences.country,
          era: preferences.era === "any" ? null : preferences.era,
          popularity:
            preferences.popularity === "mainstream"
              ? true
              : preferences.popularity === "indie"
              ? false
              : null,
          selected_genres: preferences.genres,
          number_recommended: Number(preferences.movieCount),
          previous_ids: prev_ids,
        }),
      });

      console.log(prev_ids);

      const result = await response.json();

      if (result.recommended_movies.length == 0) {
        setIsLoading(false);
        toast.error(
          "Unable to retrieve movies according to your preferences 😞",
          {
            description: (
              <p className="text-red-400">
                Unfortunately your preferences does not match any movies in our
                database 😢
              </p>
            ),
          }
        );
      } else {
        setIsLoading(false);
        // Pass API results to Results page
        const newMovies = result.recommended_movies.map((m: MovieResponse) =>
          parseMovie(m.content, m.id)
        );
        setMovies((prev) => [...newMovies, ...prev]);

        setPrevIds((prev) => [
          ...prev,
          ...result.recommended_movies.map((m: MovieResponse) => m.id),
        ]);
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Personalized Recommendations
          </h1>
          {preferences && (
            <p className="text-gray-600">
              Based on your mood:{" "}
              <span className="font-semibold text-purple-600">
                {preferences.selectedMood || preferences.customMood}
              </span>{" "}
              • Up to {preferences.freeTime} minutes
            </p>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              onClick={handleSaveToHistory}
              disabled={isSaving}
              className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save to History"}
            </Button>
            <Button
              onClick={handleGetNewRecommendations}
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
              disabled={isSaving}
            >
              <RefreshCw className="w-4 h-4" />
              Get New Recommendations
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border">
            <Button
              onClick={() => setViewMode("cards")}
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className={
                viewMode === "cards"
                  ? "bg-slate-900 text-white cursor-pointer"
                  : "text-gray-600 hover:text-gray-900 cursor-pointer"
              }
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Cards
            </Button>
            <Button
              onClick={() => setViewMode("table")}
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className={
                viewMode === "table"
                  ? "bg-slate-900 text-white cursor-pointer"
                  : "text-gray-600 hover:text-gray-900 cursor-pointer"
              }
            >
              <TableIcon className="w-4 h-4 mr-2" />
              Table
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {/* Underlying content */}
          <div className={isLoading ? "opacity-80 pointer-events-none" : ""}>
            {viewMode === "cards" ? (
              <CardsView movies={movies} country={preferences?.country} />
            ) : (
              <TableView movies={movies} country={preferences?.country} />
            )}
          </div>

          {/* Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-50">
              <LoadingBox />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Cards View Component
const CardsView = ({movies}: {movies: Movie[]; country: string}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {movies.map((movie) => (
        <div
          key={movie.id}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="relative h-64 overflow-hidden">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {movie.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {movie.year} • {movie.director}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{movie.rating}/10</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{movie.duration} min</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {movie.description}
            </p>

            <div className="text-xs text-gray-500">
              <span className="flex flex-wrap gap-2 mb-4 items-center">
                {languageNames[movie.language] ?? movie.language} •{" "}
                {movie.countries.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table View Component
const TableView = ({movies}: {movies: Movie[]; country: string}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Title
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Year
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Director
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Genre
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Rating
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Language
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movies.map((movie) => (
              <tr
                key={movie.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{movie.title}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{movie.year}</td>
                <td className="px-6 py-4 text-gray-600">{movie.director}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{movie.rating}/10</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {movie.duration} min
                </td>
                <td className="px-6 py-4 text-gray-600">{movie.language}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Results;
