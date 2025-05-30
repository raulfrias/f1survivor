# F1 Survivor - Survive the Grid

<p align="center">
  <!-- Consider adding a custom logo for your game here -->
  <img src="./assets/images/F1-Logo.png" alt="F1 Survivor Game" width="150"> 
</p>

Welcome to **F1 Survivor**, a web-based game where your Formula 1 knowledge and a bit of luck will determine if you can outlast the competition and survive the entire F1 season!

## How to Play

The rules are designed to be simple yet challenging:

1.  **Pick a Driver:** Before each GP, choose one driver from the official grid.
2.  **No Repeats:** You cannot pick the same driver more than once throughout the season. Strategic planning is key!
3.  **Top 10 Finish:** If your chosen driver finishes in the top 10 in that GP, you survive and advance to the next race.
4.  **Forgot to Pick?** If you forget to make a selection for a GP, the system will automatically assign you the driver who qualified in 15th place (P15) for that race.
5.  **Elimination:** If your chosen (or auto-assigned P15) driver finishes outside the top 10 (or does not finish - DNF), you're out of the game!
6.  **Last One Standing:** The goal is to be the last player surviving in the league.

## Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/f1survivor.git
   cd f1survivor
   ```

2. **Install Dependencies:**
   - No dependencies to install for the frontend prototype
   - Backend dependencies will be added in future phases

3. **Download Driver Images:**
   ```bash
   chmod +x download_driver_images.sh
   ./download_driver_images.sh
   ```

4. **Run the Application:**
   - Open `index.html` in your browser
   - For development, use a local server:
     ```bash
     python -m http.server 8000
     # or
     npx serve
     ```

## Project Structure

```
f1survivor/
├── assets/
│   └── images/
│       ├── drivers/    # Driver profile images
│       └── F1-Logo.png
├── docs/              # Project documentation
│   ├── ROADMAP.md     # Development roadmap
│   └── ...           # Additional documentation
├── app.js            # Core game logic
├── index.html        # Main HTML structure
├── styles.css        # Styling
└── README.md
```

## Current Features

✅ **Interactive UI:**
  - Modern, F1-themed design
  - Dynamic animations and transitions
  - Responsive grid layout
  - Team-colored driver cards

✅ **Driver Selection:**
  - Complete driver grid with team grouping
  - Visual feedback for selection states
  - Loading states and error handling
  - Pick validation logic
  - Prevention of selecting previously picked drivers
  - Fixed tooltip positioning for "already picked" drivers
  - Pick change functionality until 1 hour before race
  - User-friendly deadline display in local timezone

✅ **Race Countdown Timer:**
  - Real-time countdown to next F1 race
  - Complete 2025 F1 calendar integration (24 races)
  - Automatic next race detection
  - Pick deadline warnings
  - Caching system for performance
  - Deadline enforcement with UI locking
  - Dynamic race state display ("Next Race" vs "Race in Progress")
  - Accurate race status indicators with countdown zeros during live race
  - Clear status messages for different race states

✅ **P15 Auto-pick System:**
  - Automatic assignment of the P15 qualifier from the latest *completed* F1 qualifying session for users who miss the pick deadline.
  - Intelligent fallback (P16-P20, then P14-P1) if the P15 driver (or subsequent fallbacks) has been previously picked by the user in *any* race, adhering to the "no repeat picks" rule.
  - Clear user notifications and UI indicators for auto-picked drivers.
  - Robust fetching and caching of qualifying results, with a fallback for API issues.

✅ **Player Dashboard:**
  - Comprehensive player status display with survival indicators
  - Season progress tracking with races completed and remaining drivers
  - Pick history visualization with race results and survival status
  - Elimination Zone component showing league competition dynamics
  - Responsive design optimized for all device sizes
  - Real-time survival calculations and status updates
  - Navigation between Pick and Dashboard pages

🔄 **In Progress:**
  - League management prototype
  - Local storage for user picks

## Development Roadmap

Our development is organized into manageable phases:

1. **User Flow Foundation** (Current Focus)
   - Refining driver selection process
   - Implementing race countdown and auto-pick
   - Creating user dashboard prototype
   - Building league system foundation

2. **Backend Foundation**
   - Setting up Node.js/Express backend
   - Implementing Google Authentication
   - Creating core data models
   - Building API endpoints

3. **Core Game Logic**
   - League management functionality
   - Driver pick system integration
   - F1 data integration (OpenF1 API)
   - Race results processing

4. **User Experience Enhancements**
   - Email notifications
   - Dashboard improvements
   - Mobile optimization
   - Social features

See [ROADMAP.md](docs/ROADMAP.md) for detailed development plans.

## Technologies Used

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript
*   **Animations:**
    *   [Anime.js](https://animejs.com/) (included via CDN)
*   **F1 Data Source (Planned):**
    *   [OpenF1 API](https://openf1.org/) (or a similar public F1 data API)
*   **Backend (Planned):**
    *   Node.js/Express
    *   Google OAuth
    *   PostgreSQL

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

F1 Survivor is an unofficial project and is not affiliated with Formula 1 companies. All F1-related trademarks are owned by Formula One Licensing B.V.