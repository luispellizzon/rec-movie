import {describe, it, expect, beforeEach} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {App} from "@/App";
import {mockAuth} from "../setup";

describe("Login Integration Tests", () => {
  beforeEach(() => {
    mockAuth._setUser(null);
    render(<App />);
  });

  it("displays error message on failed login", async () => {
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", {name: /login/i}));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid email or password/i)
      ).toBeInTheDocument();
    });
  });

  it("completes full login flow", async () => {
    const user = userEvent.setup();

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Submit form
    await user.click(screen.getByRole("button", {name: /login/i}));

    // Check for success message or navigation
    await waitFor(() => {
      expect(
        screen.getByText(/Your Recommendation History/i)
      ).toBeInTheDocument();
    });
  });
});
