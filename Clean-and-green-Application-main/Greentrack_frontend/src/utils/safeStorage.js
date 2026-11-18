/**
 * Safe localStorage utilities for GreenTrack
 * Prevents JSON.parse crashes that cause blank/error screens
 */

/**
 * Safely get the current user from localStorage.
 * Returns the user object or null — never throws.
 */
export const getUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic validation: must have an id
    if (parsed && (parsed.id !== undefined && parsed.id !== null)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Failed to parse user from localStorage:', err);
    return null;
  }
};

/**
 * Safely save the current user to localStorage.
 */
export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  } catch (err) {
    console.warn('Failed to save user to localStorage:', err);
  }
};

/**
 * Remove user from localStorage (logout).
 */
export const removeUser = () => {
  try {
    localStorage.removeItem('user');
  } catch (err) {
    console.warn('Failed to remove user from localStorage:', err);
  }
};
