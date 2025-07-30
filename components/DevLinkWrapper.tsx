"use client";

import { ReactNode } from 'react';

interface DevLinkComponentProps {
  componentName: string;
  fallback?: ReactNode;
  children?: ReactNode;
  [key: string]: any;
}

// Dynamic DevLink component loader with fallbacks
export function DevLinkComponent({ 
  componentName, 
  fallback = null, 
  children,
  ...props 
}: DevLinkComponentProps) {
  try {
    // Try to dynamically import the DevLink component
    const Component = require(`@/devlink/${componentName}`)[componentName];
    return <Component {...props}>{children}</Component>;
  } catch (error) {
    // DevLink component not available, use fallback
    console.log(`DevLink component ${componentName} not available, using fallback`);
    return <>{fallback || children}</>;
  }
}

// Hook for checking DevLink availability
export function useDevLinkAvailable() {
  try {
    require('@/devlink/DevLinkProvider');
    return true;
  } catch {
    return false;
  }
}

// Higher-order component for DevLink pages
export function withDevLink<T extends {}>(
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