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
    await this.fetchNextRaceData();
    this.renderCountdown();
    this.startCountdown();
  }
  
  async fetchNextRaceData() {
    try {
      // Check localStorage for cached race data first
      const cachedData = localStorage.getItem('nextRaceData');
      const cacheTimestamp = localStorage.getItem('nextRaceDataTimestamp');
      
      // Use cache if available and less than 1 hour old
      if (cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 3600000) { // 1 hour in milliseconds
          this.currentRaceData = JSON.parse(cachedData);
          console.log('Using cached race data:', this.currentRaceData);
          return;
        }
      }
      
      // Get next race from static calendar
      console.log('Fetching next race from static calendar...');
      const nextRace = getNextRace();
      
      if (nextRace) {
        console.log('Found next race from calendar:', nextRace.raceName, 'on', nextRace.dateStart);
        
        // Convert to our expected data format
        const raceData = {
          raceId: nextRace.id,
          meetingKey: nextRace.round,
          raceName: nextRace.raceName,
          raceDate: nextRace.dateStart,
          raceCircuit: nextRace.circuit,
          location: nextRace.location,
          country: nextRace.country,
          pickDeadline: new Date(new Date(nextRace.dateStart).getTime() - 3600000).toISOString() // 1 hour before race
        };
        
        // Cache the data
        localStorage.setItem('nextRaceData', JSON.stringify(raceData));
        localStorage.setItem('nextRaceDataTimestamp', Date.now().toString());
        
        this.currentRaceData = raceData;
        console.log('Race data prepared:', raceData);
      } else {
        // No upcoming races in calendar
        console.log('No upcoming races found in calendar, season may be over');
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
    
    if (timeRemaining.total <= 0) {
      // Race has started
      clearInterval(this.countdownInterval);
      document.getElementById('pick-status').textContent = 'Race in progress';
      document.getElementById('pick-status').classList.add('race-live');
      
      // Reset all countdown values to zero
      document.getElementById('days-value').textContent = '00';
      document.getElementById('hours-value').textContent = '00';
      document.getElementById('minutes-value').textContent = '00';
      document.getElementById('seconds-value').textContent = '00';
      
      // Trigger fetch for next race after a delay
      setTimeout(() => this.initialize(), 3600000); // Check again in 1 hour
      return;
    }
    
    // Update DOM elements with new values
    document.getElementById('days-value').textContent = timeRemaining.days.toString().padStart(2, '0');
    document.getElementById('hours-value').textContent = timeRemaining.hours.toString().padStart(2, '0');
    document.getElementById('minutes-value').textContent = timeRemaining.minutes.toString().padStart(2, '0');
    document.getElementById('seconds-value').textContent = timeRemaining.seconds.toString().padStart(2, '0');
    
    // Update pick status based on deadline
    const deadlineTime = new Date(this.currentRaceData.pickDeadline).getTime();
    const currentTime = new Date().getTime();
    const timeToDeadline = deadlineTime - currentTime;
    
    if (timeToDeadline <= 0) {
      document.getElementById('pick-status').textContent = 'Pick deadline passed';
      document.getElementById('pick-status').classList.add('deadline-passed');
    } else if (timeToDeadline <= 3600000) { // Less than 1 hour
      document.getElementById('pick-status').textContent = 'Pick deadline approaching!';
      document.getElementById('pick-status').classList.add('deadline-warning');
    }
  }
  
  calculateTimeRemaining() {
    const raceTime = new Date(this.currentRaceData.raceDate).getTime();
    const currentTime = new Date().getTime();
    const difference = raceTime - currentTime;
    
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