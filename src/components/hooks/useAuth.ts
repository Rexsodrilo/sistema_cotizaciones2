import { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';

export function useAuth() {
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Actualizar el estado cuando cambie la autenticación
    pb.authStore.onChange((auth) => {
      setUser(auth.model);
      checkAdminRole();
    });

    checkAdminRole();
    setLoading(false);
  }, []);

  const checkAdminRole = async () => {
    if (pb.authStore.model) {
      try {
        const record = await pb.collection('user_roles').getFirstListItem(`user="${pb.authStore.model.id}"`);
        setIsAdmin(record.role === 'admin');
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  return { user, loading, isAdmin };
}