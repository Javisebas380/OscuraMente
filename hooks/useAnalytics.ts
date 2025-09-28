export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // In a real app, this would send to your analytics service
    console.log('Analytics Event:', eventName, properties);
  };

  return { trackEvent };
}