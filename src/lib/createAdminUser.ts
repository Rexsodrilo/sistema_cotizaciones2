import { pb } from './pocketbase';

export async function ensureAdminUser() {
  try {
    // Verificar si existe un usuario admin
    const adminExists = await pb.collection('user_roles').getFirstListItem('role="admin"').catch(() => null);

    if (!adminExists) {
      // Crear usuario admin
      const userData = {
        email: 'admin@gmail.com',
        password: 'Adm123',
        passwordConfirm: 'Adm123',
      };

      const user = await pb.collection('users').create(userData);

      // Crear rol de admin
      await pb.collection('user_roles').create({
        user: user.id,
        role: 'admin'
      });

      console.log('Usuario administrador creado exitosamente');
    }
  } catch (error) {
    console.error('Error al asegurar usuario admin:', error);
  }
}