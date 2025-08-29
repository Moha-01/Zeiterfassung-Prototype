import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    let currentValue: T;
    try {
      const item = window.localStorage.getItem(key);
      currentValue = item ? JSON.parse(item) : initialValue;
    } catch (error) {
      currentValue = initialValue;
      console.error('Error reading from localStorage', error);
    }
    setValue(currentValue);
  // The empty dependency array ensures this effect runs only once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    // This effect runs whenever the value changes, to keep localStorage in sync.
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [key, value]);

  return [value, setValue];
}
