# F1 Survivor: Race Features Implementation Plan

This document outlines the detailed implementation strategy for the next three critical features in the F1 Survivor application. These features are essential for the core game mechanics and will use the OpenF1 API to incorporate real F1 2025 season data.

## Feature Overview

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| Race Countdown Timer | High | Medium | OpenF1 API Sessions Endpoint |
| Pick Deadline Logic | Critical | High | Countdown Timer, Local Storage |
| P15 Auto-pick Fallback | Critical | High | OpenF1 API Qualifying Results |

## 1. Race Countdown Timer Component

### Purpose
Provide users with a dynamic, real-time countdown to the next race event, enhancing engagement and ensuring users are aware of approaching deadlines for making driver selections.

### Technical Approach

#### Data Source
- Use OpenF1 API's Sessions endpoint to fetch upcoming race information
- Example API call: `https://api.openf1.org/v1/sessions?year=2025&session_type=Race&date_start>=CURRENT_DATE`

#### Component Architecture
1. **RaceCountdown Class**:
   ```javascript
   class RaceCountdown {
     constructor(containerElement) {
       this.containerEl = containerElement;
       this.currentRaceData = null;
       this.countdownInterval = null;
     }
     
     async initialize() {
       await this.fetchNextRaceData();
       this.renderCountdown();
       this.startCountdown();
     }
     
     async fetchNextRaceData() {
       // Fetch from OpenF1 API
       // Store in this.currentRaceData
     }
     
     renderCountdown() {
       // Create DOM elements for countdown
     }
     
     startCountdown() {
       // Set interval to update countdown every second
     }
     
     calculateTimeRemaining() {
       // Logic to calculate time difference
     }
     
     updateDisplay(timeRemaining) {
       // Update DOM with new time values
     }
   }
   ```

2. **HTML Structure**:
   ```html
   <div class="race-countdown-container">
     <div class="race-info">
       <h3 class="race-name">Next Race: <span id="race-name"></span></h3>
       <p class="race-circuit" id="race-circuit"></p>
     </div>
     <div class="countdown-timer">
       <div class="time-unit">
         <span id="days-value">00</span>
         <label>Days</label>
       </div>
       <div class="time-unit">
         <span id="hours-value">00</span>
         <label>Hours</label>
       </div>
       <div class="time-unit">
         <span id="minutes-value">00</span>
         <label>Minutes</label>
       </div>
       <div class="time-unit">
         <span id="seconds-value">00</span>
         <label>Seconds</label>
       </div>
     </div>
     <div class="pick-status" id="pick-status">
       <!-- Will show if pick is made or deadline approaching -->
     </div>
   </div>
   ```

#### API Integration
1. **Fetch Next Race Data**:
   ```javascript
   async fetchNextRaceData() {
     try {
       const currentDate = new Date().toISOString().split('T')[0];
       const response = await fetch(`https://api.openf1.org/v1/sessions?year=2025&session_type=Race&date_start>=${currentDate}`);
       const races = await response.json();
       
       // Sort races by date to get the next upcoming one
       if (races.length > 0) {
         this.currentRaceData = races.sort((a, b) => 
           new Date(a.date_start) - new Date(b.date_start)
         )[0];
         
         // Store race details needed for countdown
         this.raceDate = new Date(this.currentRaceData.date_start);
         this.raceName = this.currentRaceData.meeting_name;
         this.raceCircuit = this.currentRaceData.circuit_short_name;
         
         // Store deadline (e.g., 1 hour before race)
         this.pickDeadline = new Date(this.raceDate);
         this.pickDeadline.setHours(this.pickDeadline.getHours() - 1);
         
         // Store in localStorage for other components
         localStorage.setItem('nextRaceData', JSON.stringify({
           raceId: this.currentRaceData.session_key,
           raceName: this.raceName,
           raceDate: this.raceDate.toISOString(),
           pickDeadline: this.pickDeadline.toISOString()
         }));
       }
     } catch (error) {
       console.error('Error fetching race data:', error);
       // Implement fallback with hardcoded next race if API fails
     }
   }
   ```

#### Error Handling
- Implement fallback race data if API is unavailable
- Display friendly error messages
- Set up automatic retry mechanism with exponential backoff

#### Cache Strategy
- Cache race data in localStorage with a timestamp
- Refresh cache if older than 1 hour or on page reload
- Minimize API calls by using cached data when appropriate

### Testing Strategy
1. **Unit Tests**:
   - Test time calculation logic
   - Test UI rendering with different time values
   - Test date formatting functions

2. **Mock Tests**:
   - Create mock API responses for testing
   - Test error handling with various API failure scenarios

3. **E2E Tests**:
   - Verify countdown updates in real-time
   - Test different race scenarios (race day, week before, etc.)

## 2. Pick Deadline Logic

### Purpose
Enforce the rule that driver selections must be made before a specific deadline (typically before qualifying or race start), adding strategic timing elements to the game.

### Technical Approach

#### Deadline Calculation
1. **Define Deadline Logic**:
   ```javascript
   class PickDeadlineManager {
     constructor() {
       this.raceData = null;
     }
     
     initialize() {
       this.loadRaceData();
       this.checkDeadlineStatus();
     }
     
     loadRaceData() {
       // Get data from localStorage or fetch if needed
       const storedData = localStorage.getItem('nextRaceData');
       if (storedData) {
         this.raceData = JSON.parse(storedData);
       } else {
         // Trigger fetch from countdown component
       }
     }
     
     isDeadlinePassed() {
       if (!this.raceData || !this.raceData.pickDeadline) return false;
       
       const now = new Date();
       const deadline = new Date(this.raceData.pickDeadline);
       return now >= deadline;
     }
     
     getTimeUntilDeadline() {
       if (!this.raceData || !this.raceData.pickDeadline) return null;
       
       const now = new Date();
       const deadline = new Date(this.raceData.pickDeadline);
       const diffMs = deadline - now;
       
       if (diffMs <= 0) return { passed: true };
       
       // Return time components
       return {
         passed: false,
         hours: Math.floor(diffMs / (1000 * 60 * 60)),
         minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
         seconds: Math.floor((diffMs % (1000 * 60)) / 1000)
       };
     }
     
     checkDeadlineStatus() {
       // To be called periodically to update UI and enforce locks
     }
   }
   ```

#### UI Integration
1. **Lock Selection UI**:
   ```javascript
   function updateDriverSelectionUI(isLocked) {
     const driverCards = document.querySelectorAll('.driver-card');
     const deadlineMessage = document.getElementById('deadline-message');
     
     if (isLocked) {
       // Apply locked state to all driver cards
       driverCards.forEach(card => {
         card.classList.add('locked');
         card.removeEventListener('click', selectDriverHandler);
       });
       
       // Show deadline passed message
       deadlineMessage.textContent = 'Selection locked: Deadline has passed';
       deadlineMessage.classList.add('deadline-passed');
       
       // Trigger P15 auto-pick if no selection made
       checkAndApplyAutoPick();
     } else {
       // Show time remaining
       const timeLeft = deadlineManager.getTimeUntilDeadline();
       if (timeLeft) {
         deadlineMessage.textContent = `Selection closes in: ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
         
         // Add warning class if less than 1 hour remains
         if (timeLeft.hours < 1) {
           deadlineMessage.classList.add('deadline-warning');
         }
       }
     }
   }
   ```

2. **Local Storage Integration**:
   ```javascript
   function saveDriverPick(driverId) {
     const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
     
     if (!raceData) return false;
     
     // Get or initialize user picks
     const userPicks = JSON.parse(localStorage.getItem('userPicks') || '{}');
     
     // Save pick for this race
     userPicks[raceData.raceId] = {
       driverId: driverId,
       timestamp: new Date().toISOString(),
       isAutoPick: false
     };
     
     localStorage.setItem('userPicks', JSON.stringify(userPicks));
     return true;
   }
   ```

#### Integration with Countdown
- Subscribe to countdown events to update deadline status
- Display prominent warning messages as deadline approaches
- Provide clear visual feedback when selection is locked

### Testing Strategy
1. **Unit Tests**:
   - Test deadline calculation logic
   - Test storage mechanisms
   - Test UI state transitions

2. **Time-based Tests**:
   - Test behavior with manipulated system time
   - Verify state when deadline is approaching vs. passed

3. **E2E Tests**:
   - Verify selection is blocked after deadline
   - Ensure warning notifications appear appropriately

## 3. P15 Auto-pick Fallback System

### Purpose
Ensure that players who forget to make a selection are automatically assigned the driver who qualified in P15, maintaining game continuity and enforcing the rules.

### Technical Approach

#### Qualifying Data Integration
1. **Fetch Qualifying Results**:
   ```javascript
   class QualifyingResultsManager {
     constructor() {
       this.qualifyingResults = null;
       this.raceData = null;
     }
     
     async initialize() {
       this.loadRaceData();
       await this.fetchQualifyingResults();
     }
     
     loadRaceData() {
       const storedData = localStorage.getItem('nextRaceData');
       if (storedData) {
         this.raceData = JSON.parse(storedData);
       }
     }
     
     async fetchQualifyingResults() {
       if (!this.raceData || !this.raceData.raceId) return null;
       
       try {
         // Get the meeting key from the race data
         const meetingKey = this.raceData.meetingKey;
         
         // Fetch qualifying session
         const response = await fetch(`https://api.openf1.org/v1/sessions?meeting_key=${meetingKey}&session_type=Qualifying`);
         const qualifyingSessions = await response.json();
         
         if (qualifyingSessions.length > 0) {
           const qualifyingSessionKey = qualifyingSessions[0].session_key;
           
           // Fetch qualifying positions
           const positionsResponse = await fetch(`https://api.openf1.org/v1/position?session_key=${qualifyingSessionKey}`);
           const positions = await positionsResponse.json();
           
           // Process and sort by position
           this.qualifyingResults = positions
             .filter(p => p.position_order) // Remove null positions
             .sort((a, b) => a.position_order - b.position_order);
             
           localStorage.setItem('qualifyingResults', JSON.stringify(this.qualifyingResults));
           return this.qualifyingResults;
         }
       } catch (error) {
         console.error('Error fetching qualifying results:', error);
         // Implement fallback strategy
       }
       
       return null;
     }
     
     getP15Driver() {
       if (!this.qualifyingResults || this.qualifyingResults.length < 15) {
         return this.getFallbackP15Driver();
       }
       
       // P15 is index 14 (zero-based)
       return this.qualifyingResults[14].driver_number;
     }
     
     getFallbackP15Driver() {
       // In case qualifying data is incomplete or unavailable
       // Return a driver based on historical data or pre-defined fallback
       
       // This would require maintaining a separate data source of default drivers
       // For now, just return a default driver as absolute fallback
       return 77; // Example: Valtteri Bottas's number
     }
   }
   ```

#### Auto-pick Implementation
1. **Auto-pick Logic**:
   ```javascript
   class AutoPickManager {
     constructor() {
       this.qualifyingManager = new QualifyingResultsManager();
       this.deadlineManager = new PickDeadlineManager();
       this.raceData = null;
     }
     
     async initialize() {
       await this.qualifyingManager.initialize();
       this.deadlineManager.initialize();
       this.loadRaceData();
     }
     
     loadRaceData() {
       const storedData = localStorage.getItem('nextRaceData');
       if (storedData) {
         this.raceData = JSON.parse(storedData);
       }
     }
     
     checkAndApplyAutoPick() {
       // Only proceed if deadline has passed
       if (!this.deadlineManager.isDeadlinePassed()) return;
       
       // Check if user already made a pick for this race
       const userPicks = JSON.parse(localStorage.getItem('userPicks') || '{}');
       const raceId = this.raceData?.raceId;
       
       if (!raceId || userPicks[raceId]) return;
       
       // No pick made, apply P15 driver
       const p15DriverId = this.qualifyingManager.getP15Driver();
       
       // Save as auto-pick
       userPicks[raceId] = {
         driverId: p15DriverId,
         timestamp: new Date().toISOString(),
         isAutoPick: true
       };
       
       localStorage.setItem('userPicks', JSON.stringify(userPicks));
       
       // Show notification to user
       this.showAutopickNotification(p15DriverId);
       
       return p15DriverId;
     }
     
     showAutopickNotification(driverId) {
       // Create and display notification to user
       const notification = document.createElement('div');
       notification.classList.add('autopick-notification');
       notification.innerHTML = `
         <h3>Auto-Pick Applied</h3>
         <p>You didn't select a driver before the deadline. The P15 qualifier (Driver #${driverId}) has been automatically selected for you.</p>
         <button id="dismiss-autopick">OK</button>
       `;
       
       document.body.appendChild(notification);
       
       // Add dismiss handler
       document.getElementById('dismiss-autopick').addEventListener('click', () => {
         notification.remove();
       });
     }
   }
   ```

2. **Integration with Driver Selection UI**:
   ```javascript
   function updateDriverSelectionAfterAutoPick(autoPick) {
     if (!autoPick) return;
     
     // Highlight the auto-picked driver card
     const driverCard = document.querySelector(`.driver-card[data-driver-id="${autoPick.driverId}"]`);
     if (driverCard) {
       driverCard.classList.add('auto-picked');
       
       // Add auto-pick indicator
       const indicator = document.createElement('div');
       indicator.classList.add('auto-pick-badge');
       indicator.textContent = 'AUTO';
       driverCard.appendChild(indicator);
     }
     
     // Update pick history/status display
     updatePickStatus(autoPick.driverId, true);
   }
   ```

#### Scheduled Verification
1. **Background Check Process**:
   ```javascript
   function setupAutopickBackgroundCheck() {
     // Check for deadline every minute
     setInterval(() => {
       const deadlineManager = new PickDeadlineManager();
       deadlineManager.initialize();
       
       if (deadlineManager.isDeadlinePassed()) {
         const autoPickManager = new AutoPickManager();
         autoPickManager.initialize().then(() => {
           autoPickManager.checkAndApplyAutoPick();
         });
       }
     }, 60000); // Check every minute
     
     // Also check on page load
     window.addEventListener('load', () => {
       const deadlineManager = new PickDeadlineManager();
       deadlineManager.initialize();
       
       if (deadlineManager.isDeadlinePassed()) {
         const autoPickManager = new AutoPickManager();
         autoPickManager.initialize().then(() => {
           autoPickManager.checkAndApplyAutoPick();
         });
       }
     });
   }
   ```

### Testing Strategy
1. **Unit Tests**:
   - Test P15 extraction logic
   - Test auto-pick application logic
   - Test notification system

2. **Integration Tests**:
   - Test with mock qualifying data
   - Verify auto-pick storage format
   - Test with various race scenarios

3. **Edge Cases**:
   - Test behavior when qualifying has fewer than 20 drivers
   - Test when qualifying data is unavailable
   - Test fallback mechanisms

## Integration Points

### Shared Data Structures
```javascript
// Race data structure
const raceData = {
  raceId: "9222", // OpenF1 session_key
  meetingKey: "1219", // OpenF1 meeting_key
  raceName: "Monaco Grand Prix",
  raceDate: "2025-05-25T14:00:00Z",
  pickDeadline: "2025-05-25T13:00:00Z",
  circuit: "Monaco"
};

// User pick structure
const userPick = {
  raceId: "9222",
  driverId: 16, // Charles Leclerc
  timestamp: "2025-05-24T18:30:45Z",
  isAutoPick: false
};

// Qualifying result structure
const qualifyingResult = {
  driver_number: 16,
  position_order: 15, // P15
  driver_name: "Charles Leclerc",
  team_name: "Ferrari"
};
```

### Integration Timeline
1. **Week 1: Setup and Core Implementation**
   - Set up OpenF1 API client utility
   - Implement race countdown timer component
   - Create basic deadline calculation

2. **Week 2: Deadline Logic**
   - Implement full deadline logic
   - Create UI for locked states
   - Connect deadline to countdown
   - Add warning notifications

3. **Week 3: Auto-pick System**
   - Implement qualifying results fetcher
   - Build P15 determination logic
   - Create auto-pick application system
   - Add auto-pick notifications

4. **Week 4: Testing and Refinement**
   - Complete unit and integration tests
   - Refine UI and interactions
   - Add error handling and fallbacks
   - Optimize performance

## Technical Considerations

### Performance Optimization
- Minimize API calls using strategic caching
- Use requestAnimationFrame for smooth countdown updates
- Lazy-load qualifying data until needed

### Error Handling Strategy
- Implement fallback race data for API failures
- Create reliable P15 selection even with incomplete qualifying data
- Handle race cancellations and schedule changes

### Future Extensions
- Support for push notifications about approaching deadlines
- Integration with backend for persistent storage when implemented
- Analytics to track user pick patterns and auto-pick frequency

### API Rate Limiting Considerations
- Implement exponential backoff for failed API requests
- Cache responses to minimize redundant calls
- Consider batch-fetching upcoming race data

## Next Steps

1. Create a small proof-of-concept for the countdown timer
2. Set up the OpenF1 API client utility
3. Define the core state management approach
4. Review with team for feedback before full implementation 