// Tipos do Sistema de Gestão de Vendas

export type CategoriaProduto = 'roupas' | 'eletronicos' | 'diversos';
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'parcelado';
export type StatusPagamento = 'pendente' | 'parcial' | 'pago';
export type StatusVenda = 'pendente' | 'concluida' | 'cancelada';

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaProduto;
  precoCusto: number;
  precoVenda: number;
  quantidade: number;
  dataCompra: string;
  fornecedor?: string;
  observacoes?: string;
  criadoEm: string;
}

export interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  pago: boolean;
}

export interface LancamentoPagamento {
  id: string;
  valor: number;
  data: string;
  observacao?: string;
}

export interface Pagamento {
  id: string;
  vendaId: string;
  formaPagamento: FormaPagamento;
  valorTotal: number;
  valorRecebido: number;
  parcelas?: Parcela[];
  lancamentos: LancamentoPagamento[];
  status: StatusPagamento;
}

export interface ItemVenda {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  valorTotal: number;
  clienteNome: string;
  clienteContato?: string;
  dataVenda: string;
  formaPagamento: FormaPagamento;
  numeroParcelas: number;
  status: StatusVenda;
  pagamento: Pagamento;
  observacoes?: string;
  criadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  contato: string;
  email?: string;
  totalCompras: number;
  valorTotalGasto: number;
  ultimaCompra?: string;
}

// Dados analíticos
export interface DashboardData {
  totalVendas: number;
  totalRecebido: number;
  totalPendente: number;
  totalLucro: number;
  margemLucro: number;
  vendasHoje: number;
  vendasSemana: number;
  vendasMes: number;
  produtosMaisVendidos: ProdutoVendido[];
  vendasRecentes: Venda[];
  pagamentosPendentes: Venda[];
}

export interface ProdutoVendido {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  lucroTotal: number;
  margemLucro: number;
}

export interface RelatorioMensal {
  mes: string;
  totalVendas: number;
  totalLucro: number;
  quantidadeVendas: number;
  ticketMedio: number;
}

export interface Emprestimo {
  id: string;
  clienteNome: string;
  valorSolicitado: number;
  taxaJuros: number;
  valorTotal: number;
  dataEmprestimo: string;
  dataVencimento: string;
  status: 'pendente' | 'pago';
  pagamento: Pagamento;
  observacoes?: string;
  criadoEm: string;
}
