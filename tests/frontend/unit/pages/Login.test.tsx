// src/test/unit/pages/Login.test.tsx
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {describe, it, vi, beforeEach} from "vitest";
import Login from "@/pages/Login";
import {BrowserRouter} from "react-router-dom";
import * as authModule from "firebase/auth";
import {toast} from "sonner";
import {AuthContext} from "@/context/AuthContext";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Partial mock of firebase/auth
vi.mock("firebase/auth", async () => {
  const original: any = await vi.importActual("firebase/auth");
  return {
    ...original,
    getAuth: vi.fn(() => ({})),
    signInWithEmailAndPassword: vi.fn(),
    setPersistence: vi.fn().mockResolvedValue(undefined),
    browserLocalPersistence: {},
  };
});

describe("Login Page", () => {
  const setUserInContext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () =>
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{setUserInContext} as any}>
          <Login />
        </AuthContext.Provider>
      </BrowserRouter>
    );

  it("renders form fields", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", {name: /login/i})).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", {name: /login/i}));
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it("calls signInWithEmailAndPassword on valid submit", async () => {
    const mockUserCredential = {
      user: {
        uid: "123",
        email: "test@test.com",
        displayName: null,
        emailVerified: false,
        isAnonymous: false,
        metadata: {} as any,
        phoneNumber: null,
        photoURL: null,
        providerData: [],
        refreshToken: "",
        tenantId: null,
        delete: vi.fn(),
        reload: vi.fn(),
        getIdToken: vi.fn(),
        getIdTokenResult: vi.fn(),
        toJSON: vi.fn(),
        updateEmail: vi.fn(),
        updatePassword: vi.fn(),
        updatePhoneNumber: vi.fn(),
        updateProfile: vi.fn(),
        linkWithCredential: vi.fn(),
        unlink: vi.fn(),
      },
      providerId: null,
      operationType: null,
    };

    (authModule.signInWithEmailAndPassword as any).mockResolvedValue(
      mockUserCredential
    );

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: {value: "test@test.com"},
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: {value: "password123"},
    });

    fireEvent.click(screen.getByRole("button", {name: /login/i}));

    await waitFor(() => {
      expect(authModule.signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "test@test.com",
        "password123"
      );
      expect(setUserInContext).toHaveBeenCalledWith(mockUserCredential.user);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("shows error toast on failed login", async () => {
    (authModule.signInWithEmailAndPassword as any).mockRejectedValue({
      code: "auth/invalid-credential",
      message: "Invalid credentials",
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: {value: "test@test.com"},
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: {value: "wrongpassword"},
    });

    fireEvent.click(screen.getByRole("button", {name: /login/i}));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Login failed", {
        description: "Invalid email or password.",
      });
    });
  });
});
