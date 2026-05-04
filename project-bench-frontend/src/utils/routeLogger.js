// Route Logger - Logs all navigation and route changes
class RouteLogger {
  constructor() {
    this.routes = [];
    this.maxRoutes = 100; // Keep last 100 route logs
  }

  // Log route change
  log(path, action = 'navigate', details = {}) {
    const routeEntry = {
      timestamp: new Date().toISOString(),
      path,
      action,
      details,
    };

    this.routes.push(routeEntry);

    // Keep only last 100 routes
    if (this.routes.length > this.maxRoutes) {
      this.routes.shift();
    }

    // Log to console
    console.log(`%c[ROUTE] ${action.toUpperCase()} → ${path}`, 'color: green; font-weight: bold;');
    
    if (Object.keys(details).length > 0) {
      console.log('%cDetails:', 'color: green;', details);
    }

    return routeEntry;
  }

  // Log user role-based navigation
  logUserNavigation(path, userRole, action = 'navigate') {
    return this.log(path, action, { userRole, timestamp: Date.now() });
  }

  // Log redirect
  logRedirect(fromPath, toPath, reason = '') {
    return this.log(toPath, 'redirect', { from: fromPath, reason });
  }

  // Log access attempt (for protected routes)
  logAccessAttempt(path, userRole, allowed = true) {
    return this.log(path, allowed ? 'access-granted' : 'access-denied', { 
      userRole, 
      status: allowed ? 'ALLOWED' : 'DENIED' 
    });
  }

  // Get all route logs
  getRoutes() {
    return this.routes;
  }

  // Get routes by action type
  getByAction(action) {
    return this.routes.filter(r => r.action === action);
  }

  // Get routes by path
  getByPath(path) {
    return this.routes.filter(r => r.path === path);
  }

  // Clear route log
  clear() {
    this.routes = [];
  }

  // Export routes as JSON
  export() {
    return JSON.stringify(this.routes, null, 2);
  }

  // Download routes as file
  download() {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(this.export())}`);
    element.setAttribute('download', `route-log-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  // Get summary statistics
  getSummary() {
    return {
      totalRoutes: this.routes.length,
      uniquePaths: [...new Set(this.routes.map(r => r.path))].length,
      actions: [...new Set(this.routes.map(r => r.action))],
      lastRoute: this.routes[this.routes.length - 1] || null,
    };
  }
}

// Create singleton instance
const routeLogger = new RouteLogger();

export default routeLogger;
