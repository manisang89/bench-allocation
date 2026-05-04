import React, { useState } from 'react';
import { Badge, Button, Card, ListGroup } from 'react-bootstrap';
import errorLogger from '../utils/errorLogger';
import routeLogger from '../utils/routeLogger';
import '../styles/devtools.css';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('routes');

  const errors = errorLogger.getErrors();
  const routes = routeLogger.getRoutes();
  const summary = routeLogger.getSummary();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="devtools">
      {/* Toggle Button */}
      <button
        className="devtools-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Open DevTools"
      >
        🛠️
      </button>

      {/* DevTools Panel */}
      {isOpen && (
        <div className="devtools-panel">
          <div className="devtools-header">
            <h6 className="mb-0">🔧 Developer Tools</h6>
            <button
              className="btn btn-sm btn-close"
              onClick={() => setIsOpen(false)}
              title="Close"
            />
          </div>

          {/* Tabs */}
          <div className="devtools-tabs">
            <button
              className={`devtools-tab ${activeTab === 'routes' ? 'active' : ''}`}
              onClick={() => setActiveTab('routes')}
            >
              📍 Routes
              <Badge bg="info" className="ms-2">{routes.length}</Badge>
            </button>
            <button
              className={`devtools-tab ${activeTab === 'errors' ? 'active' : ''}`}
              onClick={() => setActiveTab('errors')}
            >
              ⚠️ Errors
              <Badge bg="danger" className="ms-2">{errors.length}</Badge>
            </button>
          </div>

          {/* Content */}
          <div className="devtools-content">
            {activeTab === 'routes' && (
              <div className="devtools-tab-content">
                <div className="devtools-summary">
                  <small>
                    <strong>Summary:</strong> {summary.totalRoutes} routes, {summary.uniquePaths} unique paths
                  </small>
                </div>
                <div className="devtools-list">
                  {routes.length === 0 ? (
                    <p className="text-muted small">No routes logged</p>
                  ) : (
                    routes.slice(-20).reverse().map((route, idx) => (
                      <div key={idx} className="devtools-item">
                        <small>
                          <strong>{route.action.toUpperCase()}</strong>
                          <br />
                          📍 {route.path}
                          <br />
                          <span className="text-muted">
                            {new Date(route.timestamp).toLocaleTimeString()}
                          </span>
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'errors' && (
              <div className="devtools-tab-content">
                <div className="devtools-list">
                  {errors.length === 0 ? (
                    <p className="text-muted small">No errors logged</p>
                  ) : (
                    errors.slice(-20).reverse().map((error, idx) => (
                      <div key={idx} className={`devtools-item error-${error.level.toLowerCase()}`}>
                        <small>
                          <strong>[{error.level}]</strong> {error.message}
                          <br />
                          <span className="text-muted">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                          {error.details && (
                            <details className="mt-1">
                              <summary className="text-muted small" style={{ cursor: 'pointer' }}>
                                Details
                              </summary>
                              <pre className="small mt-1">
                                {JSON.stringify(error.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="devtools-footer">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                errorLogger.clear();
                routeLogger.clear();
              }}
              title="Clear all logs"
            >
              Clear
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => errorLogger.download()}
              title="Download error logs"
            >
              📥 Errors
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => routeLogger.download()}
              title="Download route logs"
            >
              📥 Routes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;
