// AppStore.js - Unified state management for F1 Survivor
// Replaces scattered state logic with centralized store

class AppStore {
  constructor() {
    this.subscribers = [];
    this.state = {
      // Authentication state
      user: null,
      isAuthenticated: false,
      authLoading: false,
      
      // League state
      leagues: [],
      activeLeague: null,
      activeLeagueId: null,
      leaguesLoading: false,
      
      // Driver and race state
      drivers: [],
      races: [],
      currentRace: null,
      driversLoading: false,
      
      // Application state
      isLoading: false,
      error: null,
      notifications: [],
      
      // Navigation state
      currentPage: 'home',
      breadcrumbs: [],
      
      // Onboarding state
      isNewUser: false,
      onboardingStep: 0,
      showOnboarding: false,
      
      // UI state
      mobileMenuOpen: false,
      theme: 'light'
    };
    
    this.initialize();
  }
  
  async initialize() {
    console.log('AppStore: Initializing unified state management');
    await this.loadInitialState();
  }
  
  async loadInitialState() {
    // Load from localStorage or set defaults
    const savedState = localStorage.getItem('f1survivor_app_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
      } catch (error) {
        console.warn('Failed to parse saved state:', error);
      }
    }
  }
  
  // State subscription system
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  notify() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }
  
  // State update methods
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Persist certain state to localStorage
    this.persistState();
    
    // Notify subscribers
    this.notify();
    
    console.log('State updated:', { updates, prevState, newState: this.state });
  }
  
  persistState() {
    const stateToPersist = {
      theme: this.state.theme,
      activeLeagueId: this.state.activeLeagueId,
      onboardingStep: this.state.onboardingStep,
      showOnboarding: this.state.showOnboarding
    };
    
    try {
      localStorage.setItem('f1survivor_app_state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }
  
  getState() {
    return this.state;
  }
  
  // Authentication actions
  setUser(user) {
    this.setState({
      user,
      isAuthenticated: !!user,
      authLoading: false,
      isNewUser: !user?.hasCompletedOnboarding
    });
  }
  
  setAuthLoading(loading) {
    this.setState({ authLoading: loading });
  }
  
  clearAuth() {
    this.setState({
      user: null,
      isAuthenticated: false,
      authLoading: false,
      leagues: [],
      activeLeague: null,
      activeLeagueId: null
    });
  }
  
  // League actions
  setLeagues(leagues) {
    this.setState({
      leagues,
      leaguesLoading: false
    });
    
    // Set active league if none selected
    if (!this.state.activeLeagueId && leagues.length > 0) {
      this.setActiveLeague(leagues[0]);
    }
  }
  
  setActiveLeague(league) {
    this.setState({
      activeLeague: league,
      activeLeagueId: league?.leagueId || null,
      breadcrumbs: this.updateBreadcrumbs(league)
    });
  }
  
  addLeague(league) {
    const updatedLeagues = [...this.state.leagues, league];
    this.setState({
      leagues: updatedLeagues
    });
  }
  
  removeLeague(leagueId) {
    const updatedLeagues = this.state.leagues.filter(l => l.leagueId !== leagueId);
    const newActiveLeague = updatedLeagues.length > 0 ? updatedLeagues[0] : null;
    
    this.setState({
      leagues: updatedLeagues,
      activeLeague: newActiveLeague,
      activeLeagueId: newActiveLeague?.leagueId || null
    });
  }
  
  setLeaguesLoading(loading) {
    this.setState({ leaguesLoading: loading });
  }
  
  // Error and notification actions
  setError(error) {
    console.error('App error:', error);
    this.setState({ error });
    
    // Auto-clear error after 10 seconds
    setTimeout(() => {
      if (this.state.error === error) {
        this.clearError();
      }
    }, 10000);
  }
  
  clearError() {
    this.setState({ error: null });
  }
  
  addNotification(notification) {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      ...notification
    };
    
    this.setState({
      notifications: [...this.state.notifications, newNotification]
    });
    
    // Auto-remove notification based on type
    const timeout = notification.type === 'error' ? 8000 : 4000;
    setTimeout(() => {
      this.removeNotification(id);
    }, timeout);
    
    return id;
  }
  
  removeNotification(id) {
    this.setState({
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }
  
  clearAllNotifications() {
    this.setState({ notifications: [] });
  }
  
  // Loading actions
  setLoading(loading) {
    this.setState({ isLoading: loading });
  }
  
  setDriversLoading(loading) {
    this.setState({ driversLoading: loading });
  }
  
  // Navigation actions
  setCurrentPage(page) {
    this.setState({
      currentPage: page,
      breadcrumbs: this.updateBreadcrumbs()
    });
  }
  
  updateBreadcrumbs(league = this.state.activeLeague) {
    const breadcrumbs = [{ name: 'F1 Survivor', path: '/' }];
    
    if (league) {
      breadcrumbs.push({
        name: league.name,
        path: `/league/${league.leagueId}`
      });
    }
    
    if (this.state.currentPage && this.state.currentPage !== 'home') {
      breadcrumbs.push({
        name: this.getPageTitle(this.state.currentPage),
        path: `/${this.state.currentPage}`
      });
    }
    
    return breadcrumbs;
  }
  
  getPageTitle(page) {
    const titles = {
      'dashboard': 'Dashboard',
      'driver-selection': 'Select Driver',
      'league-hub': 'My Leagues',
      'settings': 'Settings',
      'help': 'Help'
    };
    return titles[page] || page;
  }
  
  // Onboarding actions
  setOnboardingStep(step) {
    this.setState({ onboardingStep: step });
  }
  
  completeOnboarding() {
    this.setState({
      showOnboarding: false,
      onboardingStep: 0,
      isNewUser: false
    });
  }
  
  startOnboarding() {
    this.setState({
      showOnboarding: true,
      onboardingStep: 1,
      isNewUser: true
    });
  }
  
  // UI actions
  toggleMobileMenu() {
    this.setState({ mobileMenuOpen: !this.state.mobileMenuOpen });
  }
  
  closeMobileMenu() {
    this.setState({ mobileMenuOpen: false });
  }
  
  setTheme(theme) {
    this.setState({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  // Driver and race actions
  setDrivers(drivers) {
    this.setState({
      drivers,
      driversLoading: false
    });
  }
  
  setCurrentRace(race) {
    this.setState({ currentRace: race });
  }
  
  // Computed getters
  get hasLeagues() {
    return this.state.leagues.length > 0;
  }
  
  get isMultiLeague() {
    return this.state.leagues.length > 1;
  }
  
  get currentLeagueContext() {
    return {
      hasLeagues: this.hasLeagues,
      isMultiLeague: this.isMultiLeague,
      activeLeague: this.state.activeLeague,
      activeLeagueId: this.state.activeLeagueId,
      leagues: this.state.leagues
    };
  }
  
  // Utility methods
  reset() {
    const initialState = {
      user: null,
      isAuthenticated: false,
      authLoading: false,
      leagues: [],
      activeLeague: null,
      activeLeagueId: null,
      leaguesLoading: false,
      drivers: [],
      races: [],
      currentRace: null,
      driversLoading: false,
      isLoading: false,
      error: null,
      notifications: [],
      currentPage: 'home',
      breadcrumbs: [],
      isNewUser: false,
      onboardingStep: 0,
      showOnboarding: false,
      mobileMenuOpen: false,
      theme: this.state.theme // Preserve theme
    };
    
    this.setState(initialState);
  }
  
  // Debug methods
  getDebugInfo() {
    return {
      subscribersCount: this.subscribers.length,
      state: this.state,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
export const appStore = new AppStore();

// Export class for testing
export { AppStore };

// Helper hook-like function for components
export function useAppStore(selector) {
  const store = appStore;
  
  return {
    state: selector ? selector(store.getState()) : store.getState(),
    subscribe: store.subscribe.bind(store),
    actions: {
      // Authentication
      setUser: store.setUser.bind(store),
      setAuthLoading: store.setAuthLoading.bind(store),
      clearAuth: store.clearAuth.bind(store),
      
      // Leagues
      setLeagues: store.setLeagues.bind(store),
      setActiveLeague: store.setActiveLeague.bind(store),
      addLeague: store.addLeague.bind(store),
      removeLeague: store.removeLeague.bind(store),
      setLeaguesLoading: store.setLeaguesLoading.bind(store),
      
      // Errors and notifications
      setError: store.setError.bind(store),
      clearError: store.clearError.bind(store),
      addNotification: store.addNotification.bind(store),
      removeNotification: store.removeNotification.bind(store),
      clearAllNotifications: store.clearAllNotifications.bind(store),
      
      // Loading
      setLoading: store.setLoading.bind(store),
      setDriversLoading: store.setDriversLoading.bind(store),
      
      // Navigation
      setCurrentPage: store.setCurrentPage.bind(store),
      
      // Onboarding
      setOnboardingStep: store.setOnboardingStep.bind(store),
      completeOnboarding: store.completeOnboarding.bind(store),
      startOnboarding: store.startOnboarding.bind(store),
      
      // UI
      toggleMobileMenu: store.toggleMobileMenu.bind(store),
      closeMobileMenu: store.closeMobileMenu.bind(store),
      setTheme: store.setTheme.bind(store),
      
      // Data
      setDrivers: store.setDrivers.bind(store),
      setCurrentRace: store.setCurrentRace.bind(store)
    },
    getters: {
      hasLeagues: store.hasLeagues,
      isMultiLeague: store.isMultiLeague,
      currentLeagueContext: store.currentLeagueContext
    }
  };
}