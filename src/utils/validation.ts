// Validation utilities for RoomPe application

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  
  return null;
};

export const validatePhoneNumber = (phone: string): string | null => {
  if (!phone) {
    return 'Phone number is required';
  }
  
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) {
    return 'Name is required';
  }
  
  if (name.length < 2) {
    return 'Name must be at least 2 characters long';
  }
  
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return 'Name can only contain letters and spaces';
  }
  
  return null;
};
