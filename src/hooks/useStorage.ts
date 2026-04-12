import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { reportFirestoreListenError } from '@/lib/reportFirestoreListenError';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

/**
 * Remove campos undefined recursivamente.
 * Firestore rejeita valores undefined — JSON.stringify/parse os omite automaticamente.
 */
const sanitizeForFirestore = (data: unknown): unknown => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
          return parsed as T;
        }
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });

  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid || null);

  // Monitorar Autenticação
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubAuth();
  }, []);

  // Sincronizar leitura com Firestore se logado
  useEffect(() => {
    if (!userId) {
      return;
    }

    const docRef = doc(db, 'users', userId, 'data', key);

    const unsubFocus = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.items) {
            setStoredValue(data.items as T);
            window.localStorage.setItem(key, JSON.stringify(data.items));
          }
        } else {
          // Upload inicial: migrar dados do LocalStorage para a nuvem
          const localItem = window.localStorage.getItem(key);
          if (localItem && localItem !== '[]' && localItem !== '{}') {
            try {
              const parsed = JSON.parse(localItem);
              await setDoc(docRef, { items: sanitizeForFirestore(parsed) });
              setStoredValue(parsed as T);
            } catch (e) {
              console.error("Erro na migração inicial para nuvem", e);
            }
          }
        }
      },
      (err) => {
        console.error('Firestore (listener):', err);
        reportFirestoreListenError(err);
      }
    );

    return () => unsubFocus();
  }, [key, userId]);

  // Função de salvar — sanitiza undefined antes de enviar ao Firestore
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;

      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }

      if (userId) {
        const docRef = doc(db, 'users', userId, 'data', key);
        setDoc(docRef, { items: sanitizeForFirestore(valueToStore) }).catch(err => {
          console.error("Falha ao salvar no Firestore", err);
        });
      }

      return valueToStore;
    });
  }, [key, userId]);

  return [storedValue, setValue];
}
