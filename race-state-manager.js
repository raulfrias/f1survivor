export class RaceStateManager {
    constructor() {
        this.states = {
            COUNTDOWN: 'countdown',
            RACE_LIVE: 'race_live', 
            POST_RACE: 'post_race',
            NEXT_RACE: 'next_race'
        };
        this.POST_RACE_DURATION = 10 * 60 * 60 * 1000; // 10 hours
    }
    
    getCurrentState(raceData) {
        if (!raceData || !raceData.raceDate) {
            return this.states.COUNTDOWN;
        }
        
        const now = new Date();
        const raceStart = new Date(raceData.raceDate);
        const postRaceEnd = new Date(raceStart.getTime() + this.POST_RACE_DURATION);
        
        if (now < raceStart) {
            return this.states.COUNTDOWN;
        } else if (now < postRaceEnd) {
            // First 2 hours: "RACE IN PROGRESS"
            // Next 8 hours: "RACE FINISHED - Results Pending"
            const raceEnd = new Date(raceStart.getTime() + 2 * 60 * 60 * 1000);
            return now < raceEnd ? this.states.RACE_LIVE : this.states.POST_RACE;
        } else {
            return this.states.NEXT_RACE;
        }
    }
    
    getStateDisplay(state, timeInfo) {
        switch(state) {
            case this.states.RACE_LIVE:
                return 'RACE IN PROGRESS';
            case this.states.POST_RACE:
                return 'RACE FINISHED - Results Pending';
            case this.states.NEXT_RACE:
                return 'Loading Next Race...';
            default:
                return timeInfo || '';
        }
    }
} 