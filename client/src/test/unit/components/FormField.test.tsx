import {describe, it, expect, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {FormField} from "@/components/FormField";
import "@testing-library/jest-dom";

describe("FormField Component", () => {
  it("renders input field with label", () => {
    render(
      <FormField
        label="Email"
        type="email"
        name="email"
        value=""
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(
      <FormField
        label="Email"
        type="email"
        name="email"
        error="Invalid email"
        value=""
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("applies correct input type", () => {
    render(
      <FormField
        label="Password"
        type="password"
        name="password"
        value=""
        onChange={vi.fn()}
      />
    );
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
  });
});
