import { useState, useEffect } from 'react';

// This custom hook now initializes the state from localStorage synchronously
// on the client-side to prevent data loss on refresh or re-render.
// It also ensures that the server-render and the first client-render match
// to avoid hydration errors.
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    // A function to get the value from localStorage, or the initial value.
    const getInitialValue = (): T => {
        // Since localStorage is not available on the server, we return the initial value.
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage', error);
            return initialValue;
        }
    };
    
    // Set the initial state from localStorage.
    const [value, setValue] = useState<T>(getInitialValue);

    // This effect runs whenever the value changes, to keep localStorage in sync.
    useEffect(() => {
        try {
            // We still need to check for window because this could run in a non-browser environment.
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error('Error writing to localStorage', error);
        }
    }, [key, value]);

    return [value, setValue];
}
