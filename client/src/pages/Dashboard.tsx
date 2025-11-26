import {useEffect, useState} from "react";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useNavigate} from "react-router-dom";
import Navbar from "@/components/NavBar";
import {db} from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import {toast} from "sonner";
import {Trash2, Clock, Star, Calendar} from "lucide-react";
import {Loading} from "@/components/Loading";
import {languageNames} from "@/utils";
import MovieDialog from "@/components/MovieModal";

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

interface Recommendation {
  id: string;
  userId: string;
  preferences: {
    mood: string;
    freeTime: string;
    language: string;
    country: string;
    era: string;
    popularity: string;
    genres: string[];
    movieCount: string;
  };
  movies: Movie[];
  createdAt: Timestamp;
}

const capitalize = (word: string) => {
  if (!word) return "";
  return word[0].toUpperCase() + word.slice(1);
};

const Dashboard = () => {
  const {user} = useAuth();
  console.log(user);
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openMovieModal = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for recommendations
    const recommendationsRef = collection(
      db,
      "users",
      user.uid,
      "recommendations"
    );
    const q = query(recommendationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recs: Recommendation[] = [];
        snapshot.forEach((doc) => {
          recs.push({
            id: doc.id,
            ...doc.data(),
          } as Recommendation);
        });
        setRecommendations(recs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching recommendations:", error);
        toast.error("Failed to load history", {
          description: "Unable to fetch your recommendation history.",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleQuestionnaire = () => {
    navigate("/questionnaire");
  };

  const handleDeleteRecommendation = async (recId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "recommendations", recId));
      toast.success("Deleted", {
        description: "Recommendation deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting recommendation:", error);
      toast.error("Failed to delete", {
        description: "Unable to delete recommendation.",
      });
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate();
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return <Loading message="Loading your history..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-slate-50">
      <Navbar />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Your Recommendation History
            </h1>
            <p className="text-sm text-slate-500">
              View all your saved movie recommendations
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
            onClick={handleQuestionnaire}
          >
            ← Back to Questionnaire
          </Button>
        </div>

        {/* Recommendations List */}
        {recommendations.length === 0 ? (
          <Card className="bg-white/80 shadow-sm border-none">
            <CardHeader className="pb-2 ">
              <CardTitle className="sr-only">Saved Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-6">
              <p className="text-sm text-slate-500">
                You haven&apos;t saved any recommendations yet.
              </p>
              <Button
                className="w-full max-w-xl bg-slate-900 hover:bg-slate-800 text-white py-5 text-sm font-medium rounded-md"
                onClick={handleQuestionnaire}
              >
                Get Your First Recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 ">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="bg-white shadow-md hover:shadow-lg transition-shadow bg-gray-50"
              >
                <CardHeader className="border-b bg-gray-50 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Recommendations from {formatDate(rec.createdAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                          Mood: {rec.preferences.mood}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {rec.preferences.freeTime} minutes
                        </span>
                        {rec.preferences.language == "any" ? (
                          <span></span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                            {languageNames[rec.preferences.language]}
                          </span>
                        )}

                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                          Era: {capitalize(rec.preferences.era)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteRecommendation(rec.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rec.movies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer hover:bg-gray-200"
                        onClick={() => openMovieModal(movie)}
                      >
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-24 h-36 object-cover rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {movie.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {movie.year} • {movie.director} •{" "}
                            {languageNames[movie.language]}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {movie.genres.map((genre) => (
                              <span
                                key={genre}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px]"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="font-semibold">
                                {movie.rating}/10
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{movie.duration} min</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <div className="flex flex-wrap gap-2 mb-4 items-center">
                              {movie.countries?.map((country) => (
                                <span
                                  key={country}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                                >
                                  {country}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <MovieDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        movie={selectedMovie}
      />
    </div>
  );
};

export default Dashboard;
