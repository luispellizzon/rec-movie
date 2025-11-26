import {useNavigate, useLocation} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {Film, History} from "lucide-react";
import {toast} from "sonner";

const Navbar = () => {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been logout!", {
        description:
          "You were successfully logged out and redirect to main page.",
      });

      navigate("/login");
    } catch (error) {
      const err = error as Error;
      toast.error("Login failed", {
        description: err?.message,
      });
      console.error("Error during logout:", error);
    }
  };

  const isOnDashboard = location.pathname === "/dashboard";

  return (
    <nav className="w-full border-b bg-white/70 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left side - Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="bg-linear-to-br from-purple-600 to-pink-600 rounded-full p-2">
            <Film className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-lg text-slate-900">RecMovie</span>
        </div>

        {/* Right side - User info, History button and Logout */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600 hidden sm:inline">
            Hello,{" "}
            <span className="font-medium text-slate-900">
              {user?.displayName || user?.email || "Movie Lover"}
            </span>
          </span>

          {!isOnDashboard && (
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
          )}

          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
