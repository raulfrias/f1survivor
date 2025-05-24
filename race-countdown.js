/**
 * Race Countdown Timer Component
 * Displays the time remaining until the next F1 race with real-time updates
 */
import { getNextRace } from './race-calendar-2025.js';

class RaceCountdown {
  constructor(containerElement) {
    this.containerEl = containerElement;
    this.currentRaceData = null;
    this.countdownInterval = null;
  }
  
  async initialize() {
    // Clear any existing interval first
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    await this.fetchNextRaceData();
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
      
      // If no cached data, get from calendar
      console.log('No cached data found, fetching from calendar...');
      const nextRace = getNextRace();
      
      if (nextRace) {
        console.log('Found next race from calendar:', nextRace.raceName);
        
        const raceData = {
          raceId: nextRace.id,
          meetingKey: nextRace.round,
          raceName: nextRace.raceName,
          raceDate: nextRace.dateStart,
          qualifyingDate: nextRace.dateStart.substring(0, 10),
          raceCircuit: nextRace.circuit,
          location: nextRace.location,
          country: nextRace.country,
          pickDeadline: new Date(new Date(nextRace.dateStart).getTime() - 3600000).toISOString()
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
      raceId: "2025-monaco",
      meetingKey: "2025-6",
      raceName: "Monaco Grand Prix",
      raceDate: "2025-05-25T14:00:00Z",
      raceCircuit: "Monaco",
      pickDeadline: "2025-05-25T13:00:00Z"
    };
    
    this.currentRaceData = fallbackData;
    
    // Cache the fallback data
    localStorage.setItem('nextRaceData', JSON.stringify(fallbackData));
    localStorage.setItem('nextRaceDataTimestamp', Date.now().toString());
    
    console.log('Fallback data loaded:', fallbackData);
  }
  
  renderCountdown() {
    if (!this.currentRaceData) return;
    
    // Create HTML structure
    this.containerEl.innerHTML = `
      <div class="race-info">
        <h3 class="race-name">Next Race: <span id="race-name">${this.currentRaceData.raceName}</span></h3>
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
  
  updateCountdown() {
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
  
  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}

export default RaceCountdown; 