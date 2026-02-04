import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Usar ref para o valor inicial para evitar loop infinito
  const initialValueRef = useRef(initialValue);

  // Inicializar com valor do localStorage ou valor inicial
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
          return parsed as T;
        }
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sincronizar com localStorage quando a key muda
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
          setStoredValue(parsed as T);
        } else {
          setStoredValue(initialValueRef.current);
        }
      } else {
        setStoredValue(initialValueRef.current);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to remove corrupted localStorage item:', e);
      }
      setStoredValue(initialValueRef.current);
    }
  }, [key]); // Apenas 'key' como dependência

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
