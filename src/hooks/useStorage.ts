import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
      // Offline fallback: se deslogar, manter local e não ouvir nuvem
      return;
    }

    const docRef = doc(db, 'users', userId, 'data', key);
    
    // Inicia ouvindo a nuvem
    const unsubFocus = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.items) {
          setStoredValue(data.items as T);
          // Atualizar local storage silenciosamente para backup
          window.localStorage.setItem(key, JSON.stringify(data.items));
        }
      } else {
        // Se o doc não existe, mas temos dados no LocalStorage, vamos fazer o UPLOAD INICIAL da migração!
        const localItem = window.localStorage.getItem(key);
        if (localItem && localItem !== '[]' && localItem !== '{}') {
          try {
            const parsed = JSON.parse(localItem);
            await setDoc(docRef, { items: parsed });
            setStoredValue(parsed as T);
          } catch (e) {
            console.error("Erro na migração inicial para nuvem", e);
          }
        }
      }
    });

    return () => unsubFocus();
  }, [key, userId]);

  // Função abstrata de salvar
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      
      // Salva local sempre
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }

      // Salva na Nuvem se logado
      if (userId) {
        const docRef = doc(db, 'users', userId, 'data', key);
        setDoc(docRef, { items: valueToStore }).catch(err => {
          console.error("Falha ao salvar silenciosamente no Firestore", err);
        });
      }

      return valueToStore;
    });
  }, [key, userId]);

  return [storedValue, setValue];
}
