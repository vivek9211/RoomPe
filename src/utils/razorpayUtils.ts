// Razorpay utility functions for state mapping and validation

// Mapping of common state names/abbreviations to Razorpay accepted state names
export const STATE_NAME_MAPPING: Record<string, string> = {
  // Common abbreviations and variations
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CT': 'Chhattisgarh',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HR': 'Haryana',
  'HP': 'Himachal Pradesh',
  'JK': 'Jammu and Kashmir',
  'JH': 'Jharkhand',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra',
  'MN': 'Manipur',
  'ML': 'Meghalaya',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OR': 'Odisha',
  'PB': 'Punjab',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TG': 'Telangana',
  'TR': 'Tripura',
  'UP': 'Uttar Pradesh',
  'UT': 'Uttarakhand',
  'WB': 'West Bengal',
  'AN': 'Andaman and Nicobar Islands',
  'CH': 'Chandigarh',
  'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'DL': 'Delhi',
  'LD': 'Lakshadweep',
  'PY': 'Puducherry',
  
  // Common variations
  'Telengana': 'Telangana',
  'Telangana': 'Telangana',
  'Tamilnadu': 'Tamil Nadu',
  'Tamil Nadu': 'Tamil Nadu',
  'West Bengal': 'West Bengal',
  'West bengal': 'West Bengal',
  'Karnataka': 'Karnataka',
  'Maharashtra': 'Maharashtra',
  'Gujarat': 'Gujarat',
  'Rajasthan': 'Rajasthan',
  'Uttar Pradesh': 'Uttar Pradesh',
  'Madhya Pradesh': 'Madhya Pradesh',
  'Bihar': 'Bihar',
  'Odisha': 'Odisha',
  'Kerala': 'Kerala',
  'Punjab': 'Punjab',
  'Haryana': 'Haryana',
  'Himachal Pradesh': 'Himachal Pradesh',
  'Jharkhand': 'Jharkhand',
  'Chhattisgarh': 'Chhattisgarh',
  'Uttarakhand': 'Uttarakhand',
  'Assam': 'Assam',
  'Arunachal Pradesh': 'Arunachal Pradesh',
  'Manipur': 'Manipur',
  'Meghalaya': 'Meghalaya',
  'Mizoram': 'Mizoram',
  'Nagaland': 'Nagaland',
  'Tripura': 'Tripura',
  'Sikkim': 'Sikkim',
  'Goa': 'Goa',
  'Delhi': 'Delhi',
  'Puducherry': 'Puducherry',
  'Chandigarh': 'Chandigarh',
  'Andaman and Nicobar Islands': 'Andaman and Nicobar Islands',
  'Lakshadweep': 'Lakshadweep',
  'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir': 'Jammu and Kashmir',
  'Ladakh': 'Ladakh',
};

/**
 * Converts a state name/abbreviation to Razorpay accepted format
 * @param stateName - The state name from property location
 * @returns Proper state name for Razorpay API
 */
export function getRazorpayStateName(stateName: string): string {
  if (!stateName) return 'Karnataka'; // Default fallback
  
  const normalizedState = stateName.trim();
  
  // Check if it's already a valid state name
  if (STATE_NAME_MAPPING[normalizedState]) {
    return STATE_NAME_MAPPING[normalizedState];
  }
  
  // Try case-insensitive match
  const lowerState = normalizedState.toLowerCase();
  for (const [key, value] of Object.entries(STATE_NAME_MAPPING)) {
    if (key.toLowerCase() === lowerState) {
      return value;
    }
  }
  
  // If no mapping found, return the original name (might work)
  return normalizedState;
}

/**
 * Validates and formats address data for Razorpay API
 * @param location - Property location object
 * @returns Formatted address for Razorpay
 */
export function formatAddressForRazorpay(location: any) {
  return {
    street1: location?.address,
    street2: location?.landmark, // Provide default if no landmark
    city: location?.city,
    state: getRazorpayStateName(location?.state),
    postal_code: location?.postalCode,
    country: 'IN',
  };
}
