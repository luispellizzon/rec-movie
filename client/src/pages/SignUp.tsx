import {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {FormField} from "@/components/FormField";
import {auth, db} from "@/lib/firebase";
import {signUpSchema, SignUpFormData} from "@/schemas/auth";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";

import {createUserWithEmailAndPassword, updateProfile} from "firebase/auth";
import {doc, serverTimestamp, setDoc} from "firebase/firestore";
import type {FirebaseError} from "firebase/app";
import {useAuth} from "@/context/AuthContext";

const SignUp = () => {
  const navigate = useNavigate();
  const {setUserInContext} = useAuth();
  const [formData, setFormData] = useState<SignUpFormData>({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<SignUpFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof SignUpFormData;
    const value = e.target.value;
    setFormData((prev: SignUpFormData) => ({...prev, [name]: value}));
    setErrors((prev: Partial<SignUpFormData>) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<SignUpFormData> = {};
      result.error.issues.forEach((err) => {
        if (err.path && err.path[0]) {
          fieldErrors[err.path[0] as keyof SignUpFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const {displayName, email, password} = result.data;

    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(cred.user, {displayName});

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
      });

      setUserInContext(cred.user);

      toast.success("Welcome to RecMovie!", {
        description: "Your account has been created successfully.",
      });
      navigate("/dashboard");
    } catch (e) {
      const err = e as FirebaseError;
      toast.warning("Registration failed", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-md">
            Join RecMovie to discover your perfect films
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Full Name"
              name="displayName"
              type="text"
              placeholder="Your Name"
              value={formData.displayName}
              onChange={handleChange}
              error={errors.displayName}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
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
            <FormField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Sign Up"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary underline font-medium gradient-text"
              >
                Sign in here
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
