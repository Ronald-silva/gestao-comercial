// Tipos do Sistema — Gestão de Vendas Pro (Capital de Giro)

export type CategoriaProduto = 'roupas' | 'eletronicos' | 'diversos';
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'parcelado';
export type StatusPagamento = 'pendente' | 'parcial' | 'pago';
export type StatusVenda = 'pendente' | 'concluida' | 'cancelada';
export type ScoreCliente = 'rapido' | 'medio' | 'lento' | 'novo';

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
  dataPagamento?: string; // data em que foi efetivamente pago
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
  valorTotalPago: number;
  valorTotalPendente: number;
  ultimaCompra?: string;
  tempoMedioPagamento: number; // em dias
  score: ScoreCliente;
  limiteCredito?: number; // limite configurável
}

// Dados analíticos
export interface DashboardData {
  totalVendas: number;
  totalRecebido: number;
  totalPendente: number;
  totalLucro: number;
  margemLucro: number;
  capitalDisponivel: number;
  capitalTravado: number;
  giroCapital: number;
  tempoMedioRetorno: number;
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
  tempoMedioVenda?: number;
}

export interface RelatorioMensal {
  mes: string;
  totalVendas: number;
  totalLucro: number;
  quantidadeVendas: number;
  ticketMedio: number;
}

// ============================================================
// CRÉDITO A CLIENTES (ex-Empréstimos)
// Capital adiantado para clientes como ferramenta de fidelização
// ============================================================

export type TipoCredito = 'amortizado' | 'juros_recorrentes';

export interface CreditoCliente {
  id: string;
  clienteNome: string;
  clienteContato?: string;
  tipoModalidade: TipoCredito;  // amortizado ou recorrente
  valorConcedido: number;       // valor do crédito dado ao cliente
  taxaJuros: number;            // % dinâmica (ex: 0.20, 0.05, 0.15)
  valorJurosPeriodico?: number; // valor fixo gerado a cada ciclo se for recorrente
  valorTotal: number;           // total a pagar (apenas para amortizado)
  dataConcessao: string;        // quando foi dado o crédito
  dataVencimento: string;       // quando deve ser pago ou vencimento do juros
  status: 'pendente' | 'pago' | 'ativo'; // ativo = recorrente rendendo
  pagamento: Pagamento;
  finalidade?: string;          // ex: "para reinvestir em produto X"
  observacoes?: string;
  criadoEm: string;
}

// alias para compatibilidade com código existente
export type Emprestimo = CreditoCliente;

// ============================================================
// CAIXA (Controle de Fluxo de Caixa)
// ============================================================

export type TipoMovimentacaoCaixa =
  | 'entrada_venda_pix'
  | 'entrada_venda_dinheiro'
  | 'entrada_manual_pix'
  | 'entrada_manual_dinheiro'
  | 'saida_compra'
  | 'saida_saque'
  | 'saida_despesa';

export interface MovimentacaoCaixa {
  id: string;
  tipo: TipoMovimentacaoCaixa;
  canal: 'pix' | 'dinheiro';
  direcao: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  vendaId?: string;
  compraId?: string;
  observacoes?: string;
  criadoEm: string;
}

// ============================================================
// COMPRAS (Registro de Compras para Revenda)
// ============================================================

export interface ItemCompra {
  produtoId?: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Compra {
  id: string;
  fornecedor: string;
  itens: ItemCompra[];
  valorTotal: number;
  data: string;
  formaPagamento: FormaPagamento;
  observacoes?: string;
  criadoEm: string;
}

// ============================================================
// META DE REINVESTIMENTO
// ============================================================

export interface MetaReinvestimento {
  id: string;
  percentualMeta: number;
  periodoInicio: string;
  periodoFim: string;
  ativa: boolean;
  observacoes?: string;
  criadoEm: string;
}

// ============================================================
// ALERTAS INTELIGENTES
// ============================================================

export type TipoAlerta = 'capital_travado' | 'cliente_risco' | 'reinvestimento' | 'prazo_vencido';

export interface AlertaInteligente {
  id: string;
  tipo: TipoAlerta;
  urgencia: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  valor?: number;
  acao?: string;
}
