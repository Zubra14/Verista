import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      isMobile: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
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
    console.error("App error:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Save error state to sessionStorage for troubleshooting
    try {
      sessionStorage.setItem('verista_app_error', JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }

  render() {
    const { hasError, error, errorInfo, isMobile } = this.state;
    
    if (hasError) {
      // Mobile-friendly error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className={`bg-white ${isMobile ? 'p-5' : 'p-8'} rounded-lg shadow-lg ${isMobile ? 'w-full' : 'max-w-md'}`} role="alert" aria-live="assertive">
            <div className="text-red-500 text-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} mx-auto`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-2 text-center`}>
              Application Error
            </h2>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600 mb-4`}>
              We encountered a problem with the application. Please try
              refreshing the page.
            </p>
            
            {/* Collapsible error details */}
            <details className="mb-4">
              <summary className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium cursor-pointer text-gray-700 mb-1`}>
                Show Error Details
              </summary>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} bg-gray-100 p-3 rounded overflow-auto ${isMobile ? 'max-h-32' : 'max-h-40'}`}>
                <pre>{error && error.toString()}</pre>
                {errorInfo && errorInfo.componentStack && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <span className="font-bold">Component Stack:</span>
                    <pre className={`mt-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
            
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-3'}`}>
              <button
                onClick={() => window.location.reload()}
                className={`bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex-1 ${isMobile ? 'min-h-[44px]' : ''}`}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className={`border border-gray-300 bg-white text-gray-700 py-2 px-4 rounded hover:bg-gray-50 flex-1 ${isMobile ? 'min-h-[44px]' : ''}`}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
