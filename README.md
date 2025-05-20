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

🔄 **In Progress:**
  - Backend integration
  - User authentication
  - League management
  - Race result processing

## Technologies Used

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript
*   **Animations:**
    *   [Anime.js](https://animejs.com/) (included via CDN)
*   **F1 Data Source (Planned):**
    *   [OpenF1 API](https://openf1.org/) (or a similar public F1 data API) - for fetching real-time and historical F1 data.

## Development Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for detailed development plans and upcoming features.

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