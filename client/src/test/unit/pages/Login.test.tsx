// src/test/unit/pages/Login.test.tsx
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {describe, it, beforeEach, expect, vi} from "vitest";
import {App} from "@/App";
import {mockAuth} from "@/test/setup";

describe("Login Page", () => {
  beforeEach(() => {
    mockAuth._setUser(null);
    render(<App />);
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", {name: /login/i})).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    fireEvent.click(screen.getByRole("button", {name: /login/i}));

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    });
  });

  it("logs in successfully and redirects", async () => {
    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: {value: "test@example.com"},
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: {value: "password123"},
    });

    fireEvent.click(screen.getByRole("button", {name: /login/i}));

    await waitFor(() => {
      expect(
        screen.getByText(/Your Recommendation History/i)
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", {name: /logout/i}));
    });
  });

  it("shows toast on invalid login", async () => {
    fireEvent.change(screen.getByPlaceholderText(/your@email.com/i), {
      target: {value: "wrong@example.com"},
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: {value: "wrongpassword"},
    });

    fireEvent.click(screen.getByRole("button", {name: /login/i}));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid email or password/i)
      ).toBeInTheDocument();
    });
  });
});
