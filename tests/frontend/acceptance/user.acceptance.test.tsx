import {describe, it, expect} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

describe("Acceptance: Complete User Journey", () => {
  it("user can sign up, login, set preferences, and get recommendations", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Navigate to sign up
    await user.click(screen.getByText(/sign up/i));

    // 2. Complete sign up form
    await user.type(screen.getByLabelText(/email/i), "newuser@test.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123!");
    await user.click(screen.getByRole("button", {name: /create account/i}));

    // 3. Should be redirected to preferences
    await waitFor(() => {
      expect(screen.getByText(/set your preferences/i)).toBeInTheDocument();
    });

    // 4. Set movie preferences
    await user.click(screen.getByLabelText(/action/i));
    await user.click(screen.getByLabelText(/thriller/i));
    await user.click(screen.getByRole("button", {name: /save preferences/i}));

    // 5. Should see recommendations
    await waitFor(
      () => {
        expect(screen.getByText(/recommended for you/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );

    // 6. Verify movies are displayed
    const movieCards = screen.getAllByTestId("movie-card");
    expect(movieCards.length).toBeGreaterThan(0);
  });
});
