export class Logger {
    constructor(component, debug = false) {
        this.component = component;
        this.debug = debug;
    }
    
    log(level, message, data = null) {
        // Store in structured format for debugging
        const logEntry = {
            component: this.component,
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(data && { data })
        };
        
        // Store recent logs in sessionStorage for debugging
        const logs = JSON.parse(sessionStorage.getItem('f1survivor_logs') || '[]');
        logs.push(logEntry);
        if (logs.length > 100) logs.shift(); // Keep last 100
        sessionStorage.setItem('f1survivor_logs', JSON.stringify(logs));
        
        // Console output based on level and debug mode
        if (level === 'error' || (this.debug && ['warn', 'info', 'debug'].includes(level))) {
            console[level === 'debug' ? 'log' : level](logEntry);
        }
    }
}

// Helper to retrieve logs
export function getRecentLogs(component = null) {
    const logs = JSON.parse(sessionStorage.getItem('f1survivor_logs') || '[]');
    if (component) {
        return logs.filter(log => log.component === component);
    }
    return logs;
} 