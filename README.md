# F1 Survivor - Survive the Grid

<p align="center">
  <!-- Consider adding a custom logo for your game here -->
  <img src="./assets/images/F1-Logo.png" alt="F1 Survivor Game" width="150"> 
</p>

Welcome to **F1 Survivor**, a web-based game where your Formula 1 knowledge and a bit of luck will determine if you can outlast the competition and survive the entire F1 season!

## How to Play

The rules are designed to be simple yet challenging:

1.  **Pick a Driver:** Before each Grand Prix, choose one driver from the official grid.
2.  **No Repeats:** You cannot pick the same driver more than once throughout the season. Strategic planning is key!
3.  **Top 10 Finish:** If your chosen driver finishes in the top 10 in that Grand Prix, you survive and advance to the next race.
4.  **Forgot to Pick?** If you forget to make a selection for a Grand Prix, the system will automatically assign you the driver who qualified in 15th place (P15) for that race.
5.  **Elimination:** If your chosen (or auto-assigned P15) driver finishes outside the top 10 (or does not finish - DNF), you're out of the game!
6.  **Last One Standing:** The goal is to be the last player surviving in the league.

## Features

*   **Interactive Gameplay:** Engaging user interface for making your driver picks.
*   **Dynamic Animations:** Smooth and thematic animations powered by [Anime.js](https://animejs.com/) to enhance the F1 experience, including:
    *   F1 starting lights sequence.
    *   Animated text and UI elements.
    *   Visual representation of a race track and car movement.
*   **Single League System:** (Planned/In Development) A persistent league where your progress is tracked across multiple Grands Prix.
*   **F1 Data Integration:** (Planned/In Development) Leverages an external F1 data API (like OpenF1) to fetch race schedules, driver information, qualifying results (for the 4th rule), and final race classifications.

## Running the Game

Currently, the game is a frontend application:

1.  Ensure you have a modern web browser.
2.  Open the `index.html` file in your browser to start playing.

*(As the project develops, if a build step or local server becomes necessary, instructions will be updated here.)*

## Technologies Used

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript
*   **Animations:**
    *   [Anime.js](https://animejs.com/) (included via CDN)
*   **F1 Data Source (Planned):**
    *   [OpenF1 API](https://openf1.org/) (or a similar public F1 data API) - for fetching real-time and historical F1 data.

## Development Notes

This project is built as a client-side web application. The core game logic is managed in `app.js`, styling in `styles.css`, and the main structure in `index.html`.

### Fetching F1 Data

The game will rely on an external API like OpenF1 to provide up-to-date information for race events, driver lineups, qualifying positions (specifically P15), and final race results. This involves:
1.  Identifying the correct API endpoints from the chosen F1 data provider.
2.  Using the JavaScript `fetch` API in `app.js` to make asynchronous requests to these endpoints.
3.  Receiving and parsing the JSON data returned by the API.
4.  Integrating this data into the game logic to automate updates for player survival, P15 auto-picks, etc.

Potential challenges include handling API rate limits, data availability timings (e.g., when official classifications are published), and ensuring robust error handling for API requests.

## Future Ideas & Enhancements

*   **User Authentication & Profiles:** Allow users to sign up and have their progress saved.
*   **Multiple Leagues:** Ability for users to create or join private leagues with friends.
*   **Global Leaderboards:** See how you stack up against all F1 Survivor players.
*   **Detailed Driver/Team Stats:** Display more F1 statistics within the game.
*   **Automated Race Event Creation:** Pull upcoming race calendars automatically.
*   **Notification System:** Reminders for players to make their picks before a race weekend.

## Disclaimer

F1 Survivor is an unofficial project and is not affiliated with Formula 1 companies. All F1-related trademarks are owned by Formula One Licensing B.V.