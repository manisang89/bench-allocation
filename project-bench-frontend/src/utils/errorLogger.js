// Error Logger - Logs all errors with timestamp and details
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
  }

  // Log error with level, message, and additional details
  log(message, error = null, level = 'error') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      details: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : null,
    };

    this.errors.push(errorEntry);

    // Keep only last 100 errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console
    const style = `color: ${level === 'error' ? 'red' : level === 'warn' ? 'orange' : 'blue'}; font-weight: bold;`;
    console.log(`%c[${errorEntry.level}] ${message}`, style);
    
    if (error) {
      console.error(error);
    }

    // Optional: Send to server for monitoring
    // this.sendToServer(errorEntry);

    return errorEntry;
  }

  error(message, error = null) {
    return this.log(message, error, 'error');
  }

  warn(message, error = null) {
    return this.log(message, error, 'warn');
  }

  info(message, error = null) {
    return this.log(message, error, 'info');
  }

  // Get all logged errors
  getErrors() {
    return this.errors;
  }

  // Clear error log
  clear() {
    this.errors = [];
  }

  // Export errors as JSON
  export() {
    return JSON.stringify(this.errors, null, 2);
  }

  // Download errors as file
  download() {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(this.export())}`);
    element.setAttribute('download', `error-log-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

export default errorLogger;
