/* eslint-disable @typescript-eslint/no-explicit-any */
import {useState} from "react";
import {useLocation, useNavigate, Link} from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {FormField} from "@/components/FormField";
import {toast} from "sonner";

import {auth} from "@/lib/firebase";
import {signInWithEmailAndPassword} from "firebase/auth";
import type {FirebaseError} from "firebase/app";

import {signInSchema, SignInFormData} from "@/schemas/auth";
import {useAuth} from "@/context/AuthContext";
import {Film} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {setUserInContext} = useAuth();

  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<SignInFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof SignInFormData;
    const value = e.target.value;

    setFormData((prev) => ({...prev, [name]: value}));
    setErrors((prev) => ({...prev, [name]: undefined}));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = signInSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<SignInFormData> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path && issue.path[0]) {
          fieldErrors[issue.path[0] as keyof SignInFormData] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const {email, password} = result.data;

    try {
      setIsLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUserInContext(cred.user);

      toast.success("Welcome back!", {
        description: "You are now signed in to RecMovie.",
      });

      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, {replace: true});
    } catch (e) {
      const err = e as FirebaseError;
      toast.error("Login failed", {
        description:
          err.code === "auth/invalid-credential" ? (
            <p className="text-red-500">Invalid email or password.</p>
          ) : (
            err.message
          ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex justify-center mb-2">
            <div className="bg-linear-to-br from-purple-600 to-pink-600 rounded-full p-2">
              <Film className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to RecMovie
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Sign in to get personalized movie recommendations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-primary underline font-medium gradient-text"
              >
                Register here
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
