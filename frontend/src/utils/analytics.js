import { apiClient } from './api';

// Generate a unique session ID if not exists
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track a page view
export const trackPageView = async (path) => {
  try {
    const sessionId = getSessionId();
    await apiClient.post('/analytics/events', {
      event_type: 'page_view',
      page: path,
      session_id: sessionId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // Silently fail for analytics to not disrupt user experience
  }
};

// Track a specific event
export const trackEvent = async (eventName, data = {}, productId = null) => {
  try {
    const sessionId = getSessionId();
    const payload = {
      event_type: eventName,
      page: window.location.pathname,
      session_id: sessionId,
      metadata: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    if (productId) {
      payload.product_id = productId;
    }

    await apiClient.post('/analytics/events', payload);
  } catch (error) {
  }
};

// Track product view specifically
export const trackProductView = async (productId, productName, category) => {
  await trackEvent('product_view', {
    productName,
    category
  }, productId);
};
