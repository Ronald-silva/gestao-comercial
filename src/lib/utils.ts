import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de moeda (BRL)
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

// Formatação de data
export function formatarData(data: string | Date): string {
  if (!data) return '-';
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string | Date): string {
  if (!data) return '-';
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleString('pt-BR');
}

// Formatação de número
export function formatarNumero(valor: number, decimais = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor);
}

// Categorias
export const categorias = {
  roupas: { label: 'Roupas', cor: 'bg-blue-500', icone: '👕' },
  eletronicos: { label: 'Eletrônicos', cor: 'bg-purple-500', icone: '📱' },
  diversos: { label: 'Diversos', cor: 'bg-orange-500', icone: '📦' },
} as const;

// Formas de pagamento
export const formasPagamento = {
  pix: { label: 'PIX', cor: 'bg-green-500', icone: '⚡' },
  dinheiro: { label: 'Dinheiro', cor: 'bg-emerald-500', icone: '💵' },
  cartao: { label: 'Cartão', cor: 'bg-blue-500', icone: '💳' },
  parcelado: { label: 'Parcelado', cor: 'bg-orange-500', icone: '📅' },
} as const;

// Status de pagamento
export const statusPagamento = {
  pendente: { label: 'Pendente', cor: 'bg-red-500', textoCor: 'text-red-600' },
  parcial: { label: 'Parcial', cor: 'bg-yellow-500', textoCor: 'text-yellow-600' },
  pago: { label: 'Pago', cor: 'bg-green-500', textoCor: 'text-green-600' },
} as const;

// Status de venda
export const statusVenda = {
  pendente: { label: 'Pendente', cor: 'bg-yellow-500' },
  concluida: { label: 'Concluída', cor: 'bg-green-500' },
  cancelada: { label: 'Cancelada', cor: 'bg-red-500' },
} as const;

// Gerar número de recibo
export function gerarNumeroRecibo(): string {
  const data = new Date();
  const ano = data.getFullYear().toString().slice(-2);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REC-${ano}${mes}-${random}`;
}

// Calcular dias entre datas
export function diasEntre(data1: string, data2: string): number {
  const d1 = new Date(data1);
  const d2 = new Date(data2);
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Verificar se data está vencida
export function estaVencida(data: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = new Date(data);
  dataVenc.setHours(0, 0, 0, 0);
  return dataVenc < hoje;
}
