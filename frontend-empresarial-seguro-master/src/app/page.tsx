import { redirect } from 'next/navigation';
import { verificarSesion } from '@/lib/session';

export default async function Home() {
  const sesion = await verificarSesion();
  redirect(sesion ? '/solicitudes' : '/login');
}
