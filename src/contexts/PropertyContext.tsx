import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property } from '../types/property.types';

interface PropertyContextType {
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;
  clearSelectedProperty: () => void;
  isPropertySelected: (propertyId: string) => boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

interface PropertyProviderProps {
  children: ReactNode;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const value: PropertyContextType = {
    selectedProperty,
    setSelectedProperty,
    clearSelectedProperty: () => setSelectedProperty(null),
    isPropertySelected: (propertyId: string) => selectedProperty?.id === propertyId,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = (): PropertyContextType => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
