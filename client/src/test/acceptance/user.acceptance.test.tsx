import {describe, it, expect, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {App} from "@/App";
beforeAll(() => {
  globalThis.fetch = vi.fn(async () => {
    return {
      ok: true,
      json: async () => ({
        "recommended_movies": [
          {
            "content":
              "Title: Jurassic Park III. Overview: In need of funds for research, Dr. Alan Grant accepts a large sum of money to accompany Paul and Amanda Kirby on an aerial tour of the infamous Isla Sorna. It isn't long before all hell breaks loose and the stranded wayfarers must fight for survival as a host of new -- and even more deadly -- dinosaurs try to make snacks of them. Genres: Adventure, Action, Thriller, Science Fiction. Year: 2001. Runtime: 92.0 min. Director: Joe Johnston. Countries: United States of America. Language: en. Popularity: 0.42. Rating: 6.00. ID: 274. Poster: https://image.tmdb.org/t/p/w500/oQXj4NUfS3r3gHXtDOzcJgj1lLc.jpg",
            "id": 274,
          },
          {
            "content":
              "Title: Cyberjack. Overview: In the near future Nassim, terrorist leader, storms computer company headquarters. His aim is deadly computer virus that could bring him world domination. Nick, company janitor and ex-cop, will get in his way. Genres: Science Fiction. Year: 1995. Runtime: 99.0 min. Director: Robert Lee. Countries: Canada. Language: en. Popularity: 0.41. Rating: 4.20. ID: 1415. Poster: https://image.tmdb.org/t/p/w500/d14QqTD97uXYXt1jIVCzYykIDYw.jpg",
            "id": 1415,
          },
          {
            "content":
              "Title: Guitar Men: The Darkest Secret of Rock 'n Roll. Overview: Tough contract killers and secret organizations operating worldwide in a murderous battle for a relic that hides much more than just a simple instrument. The merciless hunt for the guitar of the \"King of Rock'n Roll\" leaves a trail of violence and death in its wake. Genres: Comedy, Fantasy, Thriller, Action. Year: 2007. Runtime: 70.0 min. Director: Thomas Wind. Countries: Germany. Language: de. Popularity: 0.15. Rating: 5.60. ID: 1424. Poster: https://image.tmdb.org/t/p/w500/dt2J1bKY6s0hxp7q8GSPbz1xMUI.jpg",
            "id": 1424,
          },
          {
            "content":
              "Title: A Trip to Mars. Overview: The navy captain Avanti Planetaros is inspired by his astronomer-father to travel through outer space to reach other worlds. He becomes an aviator and, along with the young scientist Dr. Krafft, the driving force behind the construction of a space-ship. Despite oppostion from the mocking Professor Dubius, Planetaros gathers a crew of fearless men and takes off. During the long voyage, the crew becomes restless; a mutiny is narrowly avoided. Finally, they reach Mars and discover that the planet is inhabited by people who have reached a higher stage of development, free of diseases, sorrow, violence, sexual urges, and the fear of death. Avanti falls in love with Marya, daughter of the Prince of Wisdom, the head of the Martians. Marya shares his feelings and decides to return with him in order to bring the wisdom of the Martians to the backward Earthlings. (stumfilm.dk) Genres: Science Fiction, Adventure, Fantasy. Year: 1918. Runtime: 81.0 min. Director: Holger-Madsen. Countries: Denmark. Language: da. Popularity: 0.31. Rating: 6.40. ID: 1927. Poster: https://image.tmdb.org/t/p/w500/41OY4EAtbxzTAWe13lzJSUlfi2U.jpg",
            "id": 1927,
          },
        ],
      }),
    } as Response;
  });
});

describe("Acceptance: Complete User Journey", () => {
  it("user can sign up, login, fill up preferences form, get recommendations and logout", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Navigate to sign up
    await user.click(screen.getByText(/Register here/i));

    // 2. Complete sign up form
    await user.type(screen.getByLabelText(/Full Name/i), "User XY");
    await user.type(screen.getByLabelText(/Email/i), "newuser2ZX@test.com");
    await user.type(screen.getByLabelText(/^Password$/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/Confirm Password/i),
      "SecurePass123!"
    );
    await user.click(screen.getByRole("button", {name: /Sign Up/i}));

    // 3. Should be redirected to preferences
    await waitFor(() => {
      expect(
        screen.getByText(/Your Recommendation History/i)
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {name: /Get Your First Recommendations/i})
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Tell Us What You're Looking For/i)
      ).toBeInTheDocument();
    });

    // 4. Fill Preferences Form

    // Select mood
    await user.selectOptions(
      screen.getByLabelText(/How are you feeling right now/i),
      "Happy"
    );

    // Select free time
    await user.selectOptions(
      screen.getByLabelText(/How much free time do you have/i),
      "90"
    );

    // Select language
    await user.selectOptions(
      screen.getByLabelText(/Language Preference/i),
      "en"
    );

    // Select country
    await user.selectOptions(
      screen.getByLabelText(/Country of Production/i),
      "United States of America"
    );

    // Select movie era
    await user.selectOptions(screen.getByLabelText(/Movie Era/i), "new");

    // Select popularity
    await user.selectOptions(
      screen.getByLabelText(/Movie Popularity/i),
      "mainstream"
    );

    // Select genres (action + thriller)
    await user.click(screen.getByText("Action"));
    await user.click(screen.getByText("Thriller"));

    // Enter number of movies
    await user.clear(screen.getByLabelText(/How many movies/i));
    await user.type(screen.getByLabelText(/How many movies/i), "5");

    // Submit preferences
    await user.click(
      screen.getByRole("button", {name: /Get Recommendations/i})
    );

    // 5. Should see recommendations
    await waitFor(() => {
      expect(
        screen.getByText(/Your Personalized Recommendations/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Jurassic Park III/i)).toBeInTheDocument();
    expect(screen.getByText(/Cyberjack/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Guitar Men: The Darkest Secret of Rock 'n Roll/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/A Trip to Mars/i)).toBeInTheDocument();

    // 6. Should logout
    await user.click(screen.getByRole("button", {name: /Logout/i}));

    await waitFor(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });
  });
});
