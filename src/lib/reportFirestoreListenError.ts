import { toast } from 'sonner';

let notified = false;

/**
 * Mostra uma vez por carregamento da página quando o listener do Firestore falha
 * (banco não criado, bloqueador, rede, etc.).
 */
export function reportFirestoreListenError(_error: unknown): void {
  if (notified) return;
  notified = true;

  toast.error('Sincronização com a nuvem indisponível', {
    description:
      'Crie o banco Firestore no Console do projeto (Firestore Database → Criar banco). No Brave, desative o escudo para este site ou teste outro navegador — bloqueadores costumam barrar firestore.googleapis.com.',
    duration: 18_000,
  });
}
