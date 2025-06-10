export class Logger {
    constructor(component, debug = false) {
        this.component = component;
        this.debug = debug;
        this.isProduction = window.location.hostname === 'f1survivor.com';
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
        if (!this.isProduction || level === 'error') {
            const logs = JSON.parse(sessionStorage.getItem('f1survivor_logs') || '[]');
            logs.push(logEntry);
            if (logs.length > 100) logs.shift(); // Keep last 100
            sessionStorage.setItem('f1survivor_logs', JSON.stringify(logs));
        }
        
        // In production, only show errors and important warnings
        if (this.isProduction) {
            if (level === 'error') {
                console.error(logEntry);
            } else if (level === 'warn' && !message.includes('future date')) {
                // Don't log warnings about future dates in production
                console.warn(logEntry);
            }
        } else {
            // In development, show all logs if debug is enabled
            if (level === 'error' || (this.debug && ['warn', 'info', 'debug'].includes(level))) {
                console[level === 'debug' ? 'log' : level](logEntry);
            }
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