/**
 * Race Countdown Timer Component
 * Displays the time remaining until the next F1 race with real-time updates
 */
import { getNextRace, F1_2025_CALENDAR } from '@/data/RaceCalendar2025.js';
import { RaceStateManager } from '@/services/race/RaceStateManager.js';

class RaceCountdown {
  constructor(containerElement) {
    this.containerEl = containerElement;
    this.currentRaceData = null;
    this.countdownInterval = null;
    this.stateManager = new RaceStateManager();
  }
  
  async initialize() {
    // Clear any existing interval first
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    try {
      await this.fetchNextRaceData();
      
      // Verify race data was properly loaded
      if (!this.currentRaceData || !this.currentRaceData.raceId) {
        throw new Error('Failed to load race data');
      }
      
      this.renderCountdown();
      this.startCountdown();

      // Add event listener for storage changes
      window.addEventListener('storage', (e) => {
        if (e.key === 'nextRaceData') {
          console.log('Race data changed in localStorage, reinitializing...');
          this.initialize();
        }
      });

      // Also listen for custom event
      window.addEventListener('raceDataUpdated', () => {
        console.log('Race data updated event received, reinitializing...');
        this.initialize();
      });
      
      return this.currentRaceData; // Return race data for verification
    } catch (error) {
      console.error('Failed to initialize race countdown:', error);
      throw error; // Re-throw to be handled by app initialization
    }
  }
  
  async fetchNextRaceData() {
    try {
      // Always check localStorage first
      const cachedData = localStorage.getItem('nextRaceData');
      
      if (cachedData) {
        console.log('Found race data in localStorage:', JSON.parse(cachedData));
        this.currentRaceData = JSON.parse(cachedData);
        return;
      }
      
      // If no cached data, check for currently running race first
      console.log('No cached data found, checking for current race...');
      const currentRace = this.getCurrentRace();
      
      if (currentRace) {
        console.log('Found current race in progress:', currentRace.raceName);
        
        const raceData = {
          raceId: currentRace.id,
          meetingKey: currentRace.round,
          raceName: currentRace.raceName,
          raceDate: currentRace.dateStart,
          qualifyingDate: this.calculateQualifyingDate(currentRace.dateStart),
          raceCircuit: currentRace.circuit,
          location: currentRace.location,
          country: currentRace.country,
          pickDeadline: currentRace.dateStart
        };
        
        this.currentRaceData = raceData;
        localStorage.setItem('nextRaceData', JSON.stringify(raceData));
        console.log('Current race data prepared and cached:', raceData);
        return;
      }
      
      // If no current race, get next upcoming race from calendar
      console.log('No current race found, fetching next race from calendar...');
      const nextRace = getNextRace();
      
      if (nextRace) {
        console.log('Found next race from calendar:', nextRace.raceName);
        
        const raceData = {
          raceId: nextRace.id,
          meetingKey: nextRace.round,
          raceName: nextRace.raceName,
          raceDate: nextRace.dateStart,
          qualifyingDate: this.calculateQualifyingDate(nextRace.dateStart),
          raceCircuit: nextRace.circuit,
          location: nextRace.location,
          country: nextRace.country,
          pickDeadline: nextRace.dateStart
        };
        
        this.currentRaceData = raceData;
        localStorage.setItem('nextRaceData', JSON.stringify(raceData));
        console.log('Race data prepared and cached:', raceData);
      } else {
        console.log('No upcoming races found, loading fallback...');
        this.loadFallbackRaceData();
      }
    } catch (error) {
      console.error('Error fetching race data:', error);
      this.loadFallbackRaceData();
    }
  }
  
  loadFallbackRaceData() {
    console.log('Loading fallback race data...');
    // Hardcoded fallback for next race if API fails
    const fallbackData = {
      raceId: "mon-2025",
      meetingKey: 8,
      raceName: "Monaco GP",
      raceDate: "2025-05-25T13:00:00+00:00",
      qualifyingDate: "2025-05-25",
      raceCircuit: "Monaco",
      location: "Monaco",
      country: "Monaco",
      pickDeadline: "2025-05-25T12:00:00.000Z"
    };
    
    this.currentRaceData = fallbackData;
    
    // Cache the fallback data
    localStorage.setItem('nextRaceData', JSON.stringify(fallbackData));
    localStorage.setItem('nextRaceDataTimestamp', Date.now().toString());
    
    console.log('Fallback data loaded:', fallbackData);
  }
  
  renderCountdown() {
    if (!this.currentRaceData) return;
    
    const currentState = this.getCurrentRaceState();
    const titlePrefix = (currentState === this.stateManager.states.RACE_LIVE || 
                        currentState === this.stateManager.states.POST_RACE) 
                        ? "Race: " 
                        : "Next Race: ";
    
    // Create HTML structure
    this.containerEl.innerHTML = `
      <div class="race-info">
        <h3 class="race-name">${titlePrefix}<span id="race-name">${this.currentRaceData.raceName}</span></h3>
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
      <div class="pick-status" id="pick-status"></div>
    `;
  }
  
  startCountdown() {
    if (!this.currentRaceData) return;
    
    // Initial update
    this.updateCountdown();
    
    // Update every second
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }
  
  isRaceInProgress() {
    if (!this.currentRaceData || !this.currentRaceData.raceDate) return false;
    
    const now = new Date();
    const raceStart = new Date(this.currentRaceData.raceDate);
    const raceEnd = new Date(raceStart.getTime() + (3 * 60 * 60 * 1000)); // Race duration ~2hrs + 1hr buffer
    
    return now >= raceStart && now <= raceEnd;
  }
  
  getCurrentRaceState() {
    return this.stateManager.getCurrentState(this.currentRaceData);
  }
  
  getCurrentRace() {
    const now = new Date();
    const POST_RACE_DURATION = 10 * 60 * 60 * 1000; // 10 hours (same as RaceStateManager)
    
    for (const race of F1_2025_CALENDAR) {
      const raceStart = new Date(race.dateStart);
      const raceEnd = new Date(raceStart.getTime() + POST_RACE_DURATION);
      
      // Check if current time is between race start and end (including post-race buffer)
      if (now >= raceStart && now <= raceEnd) {
        console.log(`Found current race: ${race.raceName} (${race.dateStart})`);
        return race;
      }
    }
    
    console.log('No current race found');
    return null;
  }
  
  updateCountdown() {
    const currentState = this.getCurrentRaceState();
    
    // Update all time values to 00 for race in progress or post-race
    if (currentState === this.stateManager.states.RACE_LIVE || 
        currentState === this.stateManager.states.POST_RACE) {
        document.getElementById('days-value').textContent = '00';
        document.getElementById('hours-value').textContent = '00';
        document.getElementById('minutes-value').textContent = '00';
        document.getElementById('seconds-value').textContent = '00';
        
        const pickStatus = document.getElementById('pick-status');
        pickStatus.textContent = this.stateManager.getStateDisplay(currentState);
        pickStatus.className = `pick-status ${currentState}`;
        
        // Disable pick button
        const makePickBtn = document.getElementById('make-pick-btn');
        if (makePickBtn) {
            makePickBtn.disabled = true;
            makePickBtn.style.opacity = '0.5';
            makePickBtn.style.cursor = 'not-allowed';
        }
    } else if (currentState === this.stateManager.states.NEXT_RACE) {
        // Trigger next race load
        this.loadNextRace();
    } else {
        // Normal countdown logic
        this.updateCountdownDisplay();
        this.updatePickDeadlineStatus();
    }
  }
  
  updateCountdownDisplay() {
    if (this.isRaceInProgress()) {
      // Show race in progress status
      document.getElementById('days-value').textContent = '00';
      document.getElementById('hours-value').textContent = '00';
      document.getElementById('minutes-value').textContent = '00';
      document.getElementById('seconds-value').textContent = '00';
      
      const pickStatus = document.getElementById('pick-status');
      pickStatus.textContent = 'RACE IN PROGRESS';
      pickStatus.className = 'pick-status race-live';
      
      // Disable pick button if it exists
      const makePickBtn = document.getElementById('make-pick-btn');
      if (makePickBtn) {
        makePickBtn.disabled = true;
        makePickBtn.style.opacity = '0.5';
        makePickBtn.style.cursor = 'not-allowed';
      }
      
      return;
    }
    
    const timeRemaining = this.calculateTimeRemaining();
    
    // Update DOM elements with new values
    document.getElementById('days-value').textContent = timeRemaining.days.toString().padStart(2, '0');
    document.getElementById('hours-value').textContent = timeRemaining.hours.toString().padStart(2, '0');
    document.getElementById('minutes-value').textContent = timeRemaining.minutes.toString().padStart(2, '0');
    document.getElementById('seconds-value').textContent = timeRemaining.seconds.toString().padStart(2, '0');
    
    // Update pick status based on deadline
    const deadlineTime = new Date(this.currentRaceData.pickDeadline).getTime();
    const currentTime = new Date().getTime();
    const timeToDeadline = deadlineTime - currentTime;
    
    const pickStatus = document.getElementById('pick-status');
    
    if (timeToDeadline <= 0) {
      pickStatus.textContent = 'Selection locked: Deadline has passed';
      pickStatus.className = 'pick-status deadline-passed';
    } else if (timeToDeadline <= 3600000) { // Less than 1 hour
      pickStatus.textContent = 'Pick deadline approaching!';
      pickStatus.className = 'pick-status deadline-warning';
    } else {
      pickStatus.textContent = '';
      pickStatus.className = 'pick-status';
    }
  }
  
  updatePickDeadlineStatus() {
    // Implementation of updatePickDeadlineStatus method
  }
  
  loadNextRace() {
    // Implementation of loadNextRace method
  }
  
  calculateTimeRemaining() {
    const raceTime = new Date(this.currentRaceData.raceDate).getTime();
    const currentTime = new Date().getTime();
    const difference = raceTime - currentTime;
    
    // If race time has passed, return all zeros
    if (difference <= 0) {
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }
    
    return {
      total: difference,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000)
    };
  }
  
  calculateQualifyingDate(raceDate) {
    // F1 qualifying is typically on Saturday, race on Sunday
    // Subtract 1 day from race date to get qualifying date
    const date = new Date(raceDate);
    const qualifyingDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    return qualifyingDate.toISOString().split('T')[0];
  }
  
  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}

export default RaceCountdown; 