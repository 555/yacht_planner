"use client";

import { ReactNode } from 'react';

interface DevLinkComponentProps {
  componentName: string;
  fallback?: ReactNode;
  children?: ReactNode;
  [key: string]: any;
}

// Map of known DevLink components to avoid dynamic imports
const getDevLinkComponent = (componentName: string) => {
  try {
    switch (componentName) {
      case 'Locations':
        return require('../devlink/Locations').Locations;
      case 'Footer':
        return require('../devlink/Footer').Footer;
      case 'MainNavigation':
        return require('../devlink/MainNavigation').MainNavigation;
      case 'Divider':
        return require('../devlink/Divider').Divider;
      case 'GlobalStyles':
        return require('../devlink/GlobalStyles').GlobalStyles;
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// DevLink component loader with fallbacks
export function DevLinkComponent({ 
  componentName, 
  fallback = null, 
  children,
  ...props 
}: DevLinkComponentProps) {
  const Component = getDevLinkComponent(componentName);
  
  if (!Component) {
    // DevLink component not available, use fallback
    console.log(`DevLink component ${componentName} not available, using fallback`);
    return <>{fallback || children}</>;
  }
  
  return <Component {...props}>{children}</Component>;
}

// Hook for checking DevLink availability
export function useDevLinkAvailable() {
  try {
    require('../devlink/DevLinkProvider');
    return true;
  } catch {
    return false;
  }
}

// Higher-order component for DevLink pages
export function withDevLink<T extends object>(
  Component: React.ComponentType<T>,
  fallback: ReactNode = <div>DevLink components not available</div>
) {
  return function DevLinkWrappedComponent(props: T) {
    const isDevLinkAvailable = useDevLinkAvailable();
    
    if (!isDevLinkAvailable) {
      return <>{fallback}</>;
    }
    
    return <Component {...props} />;
  };
}