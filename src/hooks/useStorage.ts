import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          // Validação básica: se for array, verifica se é válido
          if (Array.isArray(parsed)) {
            setStoredValue(parsed as T);
          } else if (parsed && typeof parsed === 'object') {
            setStoredValue(parsed as T);
          } else {
            // Se não for válido, usa valor inicial
            console.warn(`Invalid data in localStorage for key "${key}", using initial value`);
            setStoredValue(initialValue);
          }
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        // Em caso de erro, limpa o item corrompido e usa valor inicial
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to remove corrupted localStorage item:', e);
        }
        setStoredValue(initialValue);
      }
      setIsInitialized(true);
    }
  }, [key, initialValue]);

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
