import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {Movie} from "@/schemas/movie";
import {languageNames} from "@/utils";

interface MovieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie: Movie | null;
}

const MovieDialog = ({open, onOpenChange, movie}: MovieDialogProps) => {
  if (!movie) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {movie.title} ({movie.year})
          </DialogTitle>
          <DialogDescription>
            Directed by {movie.director || "Unknown"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-48 h-72 object-cover rounded-lg shadow-md"
          />

          <div className="flex-1 space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {movie.description}
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px]"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Runtime:</strong> {movie.duration} min
              </p>

              <p>
                <strong>Rating:</strong> {movie.rating}/10 ⭐
              </p>

              <p>
                <strong>Language:</strong>{" "}
                {languageNames[movie.language] ?? movie.language}
              </p>

              <div className="flex flex-wrap gap-2 items-center">
                <strong>Countries:</strong>
                {movie.countries.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovieDialog;
