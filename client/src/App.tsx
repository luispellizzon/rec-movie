import {Route, Routes} from "react-router-dom";
import SignUp from "./pages/SignUp";
import {Toaster} from "@/components/ui/sonner";
import Login from "./pages/Login";
import {Preferences} from "./pages/Preferences";
import {ProtectedRoute} from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";
import {BrowserRouter} from "react-router-dom";
import {AuthProvider} from "./context/AuthContext.tsx";
const basename = import.meta.env.BASE_URL;
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Toaster />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questionnaire"
            element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
