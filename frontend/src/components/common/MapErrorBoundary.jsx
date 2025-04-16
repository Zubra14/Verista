import React from "react";
import errorTrackerModule from "../../utils/errorTracker";
import MapFallback from "./MapFallback";

// Create a minimal error tracker if the imported one isn't available
const defaultErrorTracker = {
  trackError: (error, context, type, additionalInfo) => {
    console.error(`[Error Tracking] ${context}:`, error, type, additionalInfo);
  },
  errorTypes: {
    MAPS_API: 'maps_api',
    RUNTIME: 'runtime',
    NETWORK: 'network',
    COMPONENT: 'component'
  }
};

// Use errorTracker if available, otherwise use default
const trackError = errorTrackerModule?.trackError || defaultErrorTracker.trackError;
const errorTypes = errorTrackerModule?.errorTypes || defaultErrorTracker.errorTypes;

/**
 * Error boundary component specifically designed for Map components
 * Catches and handles errors in Google Maps and related components
 */
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorTimestamp: null,
      isMobile: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorTimestamp: Date.now()
    };
  }

  componentDidMount() {
    // Check if on mobile device
    this.checkIsMobile();
    
    // Add resize listener to update mobile state
    window.addEventListener('resize', this.checkIsMobile);
  }
  
  componentWillUnmount() {
    // Remove resize listener
    window.removeEventListener('resize', this.checkIsMobile);
  }
  
  checkIsMobile = () => {
    // Simple check based on width - we'll use 768px as the breakpoint
    const isMobile = window.innerWidth < 768;
    if (isMobile !== this.state.isMobile) {
      this.setState({ isMobile });
    }
  }

  componentDidCatch(error, errorInfo) {
    // Track the error using error tracking service
    trackError(error, "MapErrorBoundary", errorTypes.MAPS_API, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      props: this.props.debugProps ? this.props : null,
      isMobile: this.state.isMobile
    });

    this.setState({
      errorInfo,
    });

    // Log detailed error for developers
    if (import.meta.env.DEV) {
      console.error("Map component failed to load:", error);
      console.info("Component stack trace:", errorInfo.componentStack);
    }
    
    // Call the onError callback if provided
    if (this.props.onError && typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error("Error in onError callback:", callbackError);
      }
    }
  }

  handleRetry = () => {
    // Increment retry count for tracking
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Call optional onRetry callback if provided
    if (this.props.onRetry && typeof this.props.onRetry === "function") {
      try {
        this.props.onRetry(this.state.retryCount + 1);
      } catch (callbackError) {
        console.error("Error in onRetry callback:", callbackError);
      }
    }
  };

  // Extract coordinates from props if available
  getCoordinatesFromProps = () => {
    const { locationData } = this.props;
    
    if (!locationData) return null;
    
    if (locationData.coordinates) {
      return locationData.coordinates;
    }
    
    if (locationData.lat !== undefined && locationData.lng !== undefined) {
      return { lat: locationData.lat, lng: locationData.lng };
    }
    
    if (locationData.latitude !== undefined && locationData.longitude !== undefined) {
      return { lat: locationData.latitude, lng: locationData.longitude };
    }
    
    return null;
  };

  render() {
    const { hasError, error, errorInfo, retryCount, errorTimestamp, isMobile } = this.state;
    const { 
      title = "Map loading failed",
      message,
      fallbackUI,
      locationData,
      additionalInfo,
      className = "",
      errorClassName = isMobile ? "p-3 border border-red-300 bg-red-50 rounded-md" : "p-4 border border-red-300 bg-red-50 rounded-md",
      showMapFallback = true
    } = this.props;

    if (hasError) {
      // Calculate time elapsed since error
      const timeElapsed = errorTimestamp ? Math.floor((Date.now() - errorTimestamp) / 1000) : 0;
      
      // Use custom fallback if provided
      if (fallbackUI && typeof fallbackUI === "function") {
        return fallbackUI(error, errorInfo, this.handleRetry, retryCount);
      }

      // Use MapFallback component if available and enabled
      if (showMapFallback) {
        // Extract location data if available
        const coordinates = this.getCoordinatesFromProps();
        const address = locationData?.address;
        const lastUpdate = locationData?.timestamp || locationData?.lastUpdate;
        
        return (
          <MapFallback
            error={error}
            coordinates={coordinates}
            address={address}
            lastUpdate={lastUpdate}
            status={locationData?.status || "Error"}
            onRetry={this.handleRetry}
            title={title}
            showRetryButton={true}
            className={className}
            additionalInfo={additionalInfo}
            attemptCount={retryCount}
            errorTimestamp={errorTimestamp}
          />
        );
      }

      // Default fallback UI if MapFallback is disabled
      return (
        <div 
          className={`${errorClassName} ${className}`}
          role="alert"
          aria-live="assertive"
        >
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-red-800 mb-2`}>
            {title}
          </h3>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-600 mb-4`}>
            {message || (error?.message || "An error occurred while loading the map.")}
          </p>
          <button
            onClick={this.handleRetry}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${isMobile ? 'w-full min-h-[44px]' : ''}`}
            style={{ minHeight: isMobile ? '44px' : 'auto' }}
          >
            {retryCount > 0
              ? `Try Again (${retryCount})`
              : "Try Again"}
          </button>

          {import.meta.env.DEV && error && (
            <details className="mt-4">
              <summary className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium cursor-pointer`}>
                Error Details (Debug Only)
              </summary>
              <pre className={`mt-2 ${isMobile ? 'text-[10px]' : 'text-xs'} bg-gray-100 p-2 rounded overflow-auto ${isMobile ? 'max-h-24' : 'max-h-32'}`}>
                {error.toString()}
                {errorInfo && errorInfo.componentStack && (
                  <div className="mt-2 border-t border-gray-300 pt-2">
                    {errorInfo.componentStack}
                  </div>
                )}
              </pre>
              <div className={`mt-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                Error occurred {timeElapsed} seconds ago. Retry count: {retryCount}
              </div>
            </details>
          )}
        </div>
      );
    }

    // Return children if no error
    return this.props.children;
  }
}

export default MapErrorBoundary;