import { useMemo } from 'react';
import { useLocalStorage } from './useStorage';
import type {
  Produto, Venda, Cliente, StatusPagamento,
  CreditoCliente, Pagamento,
  MovimentacaoCaixa, TipoMovimentacaoCaixa,
  Compra, MetaReinvestimento, ScoreCliente, AlertaInteligente,
  ContaPagar, StatusContaPagar, Recomendacao, FormaPagamento,
} from '@/types';
import { cogsDoItem, custoUnitarioDoItem } from '@/lib/utils';

// Função para gerar ID único
const gerarIdUnico = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Função para validar e migrar empréstimos/créditos antigos
const validarCredito = (emp: Partial<CreditoCliente>): CreditoCliente | null => {
  if (!emp || typeof emp !== 'object') return null;
  if (!emp.id || !emp.clienteNome) return null;

  const pagamentoPadrao: Pagamento = {
    id: gerarIdUnico(),
    vendaId: emp.id,
    formaPagamento: 'dinheiro',
    valorTotal: emp.valorTotal || emp.valorConcedido || 0,
    valorRecebido: 0,
    lancamentos: [],
    status: 'pendente'
  };

  return {
    id: emp.id,
    clienteNome: emp.clienteNome || 'Cliente',
    clienteContato: emp.clienteContato,
    tipoModalidade: emp.tipoModalidade || 'amortizado',
    valorConcedido: emp.valorConcedido || (emp as any).valorSolicitado || 0,
    taxaJuros: emp.taxaJuros ?? 0.20,
    valorJurosPeriodico: emp.valorJurosPeriodico,
    valorTotal: emp.valorTotal || ((emp.valorConcedido || (emp as any).valorSolicitado || 0) * 1.2),
    dataConcessao: emp.dataConcessao || (emp as any).dataEmprestimo || new Date().toISOString().split('T')[0],
    dataVencimento: emp.dataVencimento || new Date().toISOString().split('T')[0],
    status: emp.status || 'pendente',
    pagamento: emp.pagamento && emp.pagamento.lancamentos ? emp.pagamento : pagamentoPadrao,
    finalidade: emp.finalidade,
    observacoes: emp.observacoes,
    criadoEm: emp.criadoEm || new Date().toISOString()
  };
};

// Função para validar e migrar vendas antigas
const validarVenda = (venda: Partial<Venda>): Venda | null => {
  if (!venda || typeof venda !== 'object') return null;
  if (!venda.id) return null;

  const pagamentoPadrao: Pagamento = {
    id: gerarIdUnico(),
    vendaId: venda.id,
    formaPagamento: venda.formaPagamento || 'dinheiro',
    valorTotal: venda.valorTotal || 0,
    valorRecebido: 0,
    lancamentos: [],
    status: 'pendente'
  };

  return {
    id: venda.id,
    itens: Array.isArray(venda.itens) ? venda.itens : [],
    valorTotal: venda.valorTotal || 0,
    clienteNome: venda.clienteNome || 'Cliente',
    clienteContato: venda.clienteContato,
    dataVenda: venda.dataVenda || new Date().toISOString().split('T')[0],
    dataPagamento: venda.dataPagamento,
    formaPagamento: venda.formaPagamento || 'dinheiro',
    numeroParcelas: venda.numeroParcelas || 1,
    status: venda.status || 'pendente',
    pagamento: venda.pagamento && venda.pagamento.lancamentos !== undefined ? venda.pagamento : pagamentoPadrao,
    observacoes: venda.observacoes,
    criadoEm: venda.criadoEm || new Date().toISOString()
  };
};

// Calcular score de cliente baseado no tempo médio de pagamento
const calcularScore = (tempoMedio: number, totalCompras: number): ScoreCliente => {
  if (totalCompras === 0) return 'novo';
  if (tempoMedio <= 3) return 'rapido';
  if (tempoMedio <= 7) return 'medio';
  return 'lento';
};

export function useDados() {
  const [produtosRaw, setProdutos] = useLocalStorage<Produto[]>('produtos', []);
  const [vendasRaw, setVendas] = useLocalStorage<Venda[]>('vendas', []);
  const [clientesRaw, setClientes] = useLocalStorage<Cliente[]>('clientes', []);
  const [creditosRaw, setCreditos] = useLocalStorage<CreditoCliente[]>('emprestimos', []);
  const [movimentacoesRaw, setMovimentacoes] = useLocalStorage<MovimentacaoCaixa[]>('caixa_movimentacoes', []);
  const [comprasRaw, setCompras] = useLocalStorage<Compra[]>('compras', []);
  const [metasRaw, setMetas] = useLocalStorage<MetaReinvestimento[]>('metas_reinvestimento', []);
  const [contasPagarRaw, setContasPagar] = useLocalStorage<ContaPagar[]>('contas_pagar', []);

  // Validar e filtrar dados
  const produtos = useMemo(() =>
    Array.isArray(produtosRaw) ? produtosRaw.filter(p => p && p.id) : [],
    [produtosRaw]
  );

  const vendas = useMemo(() =>
    Array.isArray(vendasRaw)
      ? vendasRaw.map(validarVenda).filter((v): v is Venda => v !== null)
      : [],
    [vendasRaw]
  );

  const emprestimos = useMemo(() =>
    Array.isArray(creditosRaw)
      ? creditosRaw.map(validarCredito).filter((e): e is CreditoCliente => e !== null)
      : [],
    [creditosRaw]
  );

  // alias para compatibilidade
  const creditos = emprestimos;

  const movimentacoes = useMemo(() =>
    Array.isArray(movimentacoesRaw)
      ? movimentacoesRaw.filter(m => m && m.id && m.tipo)
      : [],
    [movimentacoesRaw]
  );

  const compras = useMemo(() =>
    Array.isArray(comprasRaw) ? comprasRaw.filter(c => c && c.id) : [],
    [comprasRaw]
  );

  const metas = useMemo(() =>
    Array.isArray(metasRaw) ? metasRaw.filter(m => m && m.id) : [],
    [metasRaw]
  );

  const contasPagar = useMemo(() => {
    const raw = Array.isArray(contasPagarRaw) ? contasPagarRaw.filter(c => c && c.id) : [];
    const hoje = new Date().toISOString().split('T')[0];
    return raw.map(c => ({
      ...c,
      status: c.status === 'pago' ? 'pago' : c.dataVencimento < hoje ? 'vencido' : 'pendente',
    })) as ContaPagar[];
  }, [contasPagarRaw]);

  // Clientes com score calculado dinamicamente
  const clientes = useMemo((): Cliente[] => {
    const clientesBase = Array.isArray(clientesRaw) ? clientesRaw.filter(c => c && c.id) : [];

    return clientesBase.map(cliente => {
      // Vendas deste cliente
      const vendasCliente = vendas.filter(
        v => v.clienteNome.toLowerCase() === cliente.nome.toLowerCase() && v.status !== 'cancelada'
      );

      // Calcular tempo médio de pagamento (apenas vendas pagas)
      const vendasPagas = vendasCliente.filter(v => v.pagamento.status === 'pago');
      let tempoMedio = 0;
      if (vendasPagas.length > 0) {
        const tempos = vendasPagas.map(v => {
          const dataVenda = new Date(v.dataVenda).getTime();
          // Usar o lançamento mais recente como data de pagamento
          const lancamentos = v.pagamento.lancamentos || [];
          const ultimoLancamento = lancamentos[lancamentos.length - 1];
          const dataPagto = ultimoLancamento
            ? new Date(ultimoLancamento.data).getTime()
            : dataVenda; // se não há lançamento, assume que pagou na hora
          return Math.max(0, (dataPagto - dataVenda) / (1000 * 60 * 60 * 24));
        });
        tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
      }

      // Totais financeiros
      const valorTotalGasto = vendasCliente.reduce((s, v) => s + v.valorTotal, 0);
      const valorTotalPago = vendasCliente.reduce((s, v) => s + v.pagamento.valorRecebido, 0);
      const valorTotalPendente = valorTotalGasto - valorTotalPago;

      return {
        ...cliente,
        totalCompras: vendasCliente.length,
        valorTotalGasto,
        valorTotalPago,
        valorTotalPendente: Math.max(0, valorTotalPendente),
        tempoMedioPagamento: Math.round(tempoMedio),
        score: calcularScore(tempoMedio, vendasCliente.length),
      };
    });
  }, [clientesRaw, vendas]);

  const gerarId = gerarIdUnico;

  // ================================================================
  // ANALYTICS DE CAPITAL DE GIRO
  // ================================================================

  /**
   * Helper interno: custo total (COGS) de uma venda — produto saiu do estoque inteiro ao vender
   */
  const fullCOGS = (v: Venda): number =>
    v.itens.reduce((s, item) => s + cogsDoItem(item, produtos), 0);

  /**
   * Capital Disponível = dinheiro já recebido - custo CHEIO dos produtos que geraram esse recebimento
   * Correção: o estoque sai 100% ao vender — não proporcional ao pagamento recebido
   */
  const getCapitalDisponivel = () => {
    const vendasConcluidas = vendas.filter(v => v.status !== 'cancelada');
    const totalRecebido = vendasConcluidas.reduce((s, v) => s + v.pagamento.valorRecebido, 0);
    // Deduz COGS apenas de vendas que geraram algum recebimento (estoque já saiu)
    const totalCusto = vendasConcluidas
      .filter(v => v.pagamento.valorRecebido > 0)
      .reduce((s, v) => s + fullCOGS(v), 0);
    return Math.max(0, totalRecebido - totalCusto);
  };

  /**
   * Capital Travado = vendas a receber + créditos a clientes ativos
   * Retorna breakdown detalhado e total
   */
  const getCapitalTravado = () => {
    const vendaTravadasValor = vendas
      .filter(v => v.status !== 'cancelada' && v.pagamento.status !== 'pago')
      .reduce((s, v) => s + (v.pagamento.valorTotal - v.pagamento.valorRecebido), 0);

    const creditosTravadosValor = creditos
      .filter(c => c.status !== 'pago')
      .reduce((s, c) => {
        if (c.tipoModalidade === 'juros_recorrentes') return s + c.valorConcedido;
        return s + Math.max(0, c.valorTotal - c.pagamento.valorRecebido);
      }, 0);

    return vendaTravadasValor + creditosTravadosValor;
  };

  const getCapitalTravadoDetalhado = () => {
    const vendas_ = vendas
      .filter(v => v.status !== 'cancelada' && v.pagamento.status !== 'pago')
      .reduce((s, v) => s + (v.pagamento.valorTotal - v.pagamento.valorRecebido), 0);
    const creditos_ = creditos
      .filter(c => c.status !== 'pago')
      .reduce((s, c) => {
        if (c.tipoModalidade === 'juros_recorrentes') return s + c.valorConcedido;
        return s + Math.max(0, c.valorTotal - c.pagamento.valorRecebido);
      }, 0);
    return { vendas: vendas_, creditos: creditos_, total: vendas_ + creditos_ };
  };

  /**
   * Giro de Capital anualizado = (COGS 30 dias / valor estoque atual) * 12
   * Mede quantas vezes o estoque se converte em vendas por ano
   */
  const getGiroCapital = () => {
    const janela30d = new Date(Date.now() - 30 * 86400000);
    const custoVendas30d = vendas
      .filter(v => v.status !== 'cancelada' && new Date(v.dataVenda) >= janela30d)
      .reduce((s, v) => s + fullCOGS(v), 0);
    const valorEstoqueAtual = produtos.reduce((s, p) => s + p.precoCusto * p.quantidade, 0);
    if (valorEstoqueAtual === 0) return 0;
    return parseFloat(((custoVendas30d / valorEstoqueAtual) * 12).toFixed(1));
  };

  /**
   * Tempo Médio de Retorno = dias médios entre venda e pagamento (somente vendas pagas)
   * Métrica histórica de velocidade de recebimento
   */
  const getTempoMedioRetorno = () => {
    const vendasPagas = vendas.filter(
      v => v.status !== 'cancelada' && v.pagamento.status === 'pago' && v.pagamento.lancamentos.length > 0
    );
    if (vendasPagas.length === 0) return 0;

    const tempos = vendasPagas.map(v => {
      const dataVenda = new Date(v.dataVenda).getTime();
      const lancamentos = v.pagamento.lancamentos;
      const ultimoLancamento = lancamentos[lancamentos.length - 1];
      const dataPagto = new Date(ultimoLancamento.data).getTime();
      return Math.max(0, (dataPagto - dataVenda) / (1000 * 60 * 60 * 24));
    });

    return Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
  };

  /**
   * DSO (Days Sales Outstanding) = dias médios para receber, incluindo vendas em aberto
   * Fórmula: (total pendente / total vendido no período) * dias
   */
  const getDSO = (diasPeriodo = 30): number => {
    const janela = new Date(Date.now() - diasPeriodo * 86400000);
    const vendasPeriodo = vendas.filter(
      v => v.status !== 'cancelada' && new Date(v.dataVenda) >= janela
    );
    const totalVendasPeriodo = vendasPeriodo.reduce((s, v) => s + v.valorTotal, 0);
    const totalPendente = vendasPeriodo.reduce(
      (s, v) => s + Math.max(0, v.pagamento.valorTotal - v.pagamento.valorRecebido), 0
    );
    if (totalVendasPeriodo === 0) return 0;
    return Math.round((totalPendente / totalVendasPeriodo) * diasPeriodo);
  };

  /**
   * Valor do Estoque = capital imobilizado em produtos não vendidos
   */
  const getValorEstoque = () => {
    const valorCusto = produtos.reduce((s, p) => s + p.precoCusto * p.quantidade, 0);
    const valorVenda = produtos.reduce((s, p) => s + p.precoVenda * p.quantidade, 0);
    const qtdItens = produtos.reduce((s, p) => s + p.quantidade, 0);
    return { valorCusto, valorVenda, margemPotencial: valorVenda - valorCusto, qtdItens };
  };

  /**
   * DIO (Days Inventory Outstanding) = dias médios que o estoque fica parado antes de vender
   */
  const getDIO = (diasPeriodo = 30): number => {
    const janela = new Date(Date.now() - diasPeriodo * 86400000);
    const custoVendas = vendas
      .filter(v => v.status !== 'cancelada' && new Date(v.dataVenda) >= janela)
      .reduce((s, v) => s + fullCOGS(v), 0);
    const valorEstoque = getValorEstoque().valorCusto;
    if (custoVendas === 0) return 0;
    return Math.round((valorEstoque / custoVendas) * diasPeriodo);
  };

  /**
   * DPO (Days Payable Outstanding) = dias médios para pagar fornecedores
   */
  const getDPO = (): number => {
    const pagas = contasPagar.filter(c => c.status === 'pago' && c.dataPagamento);
    if (pagas.length === 0) return 0;
    const totalDias = pagas.reduce((s, c) => {
      const dias = Math.max(0,
        (new Date(c.dataPagamento!).getTime() - new Date(c.criadoEm).getTime()) / 86400000
      );
      return s + dias;
    }, 0);
    return Math.round(totalDias / pagas.length);
  };

  /**
   * CCC (Cash Conversion Cycle) = DSO + DIO - DPO
   * Quantos dias o dinheiro fica fora do caixa durante o ciclo operacional
   */
  const getCCC = (diasPeriodo = 30): number => {
    return Math.max(0, getDSO(diasPeriodo) + getDIO(diasPeriodo) - getDPO());
  };

  /**
   * Aging de Recebíveis — distribui o capital travado em faixas de atraso
   */
  const getAgingRecebiveis = () => {
    const hoje = new Date();
    const buckets = { corrente: 0, dias30: 0, dias60: 0, acima60: 0 };
    vendas
      .filter(v => v.status !== 'cancelada' && v.pagamento.status !== 'pago')
      .forEach(v => {
        const diasAtraso = Math.floor(
          (hoje.getTime() - new Date(v.dataVenda).getTime()) / 86400000
        );
        const pendente = v.pagamento.valorTotal - v.pagamento.valorRecebido;
        if (diasAtraso <= 0) buckets.corrente += pendente;
        else if (diasAtraso <= 30) buckets.dias30 += pendente;
        else if (diasAtraso <= 60) buckets.dias60 += pendente;
        else buckets.acima60 += pendente;
      });
    return buckets;
  };

  /**
   * Projeção de fluxo de caixa para os próximos N dias
   * Entradas: parcelas de vendas com vencimento. Saídas: contas a pagar.
   */
  const getProjecaoFluxoCaixa = (diasHorizonte = 30) => {
    const saldoInicial = getSaldoCaixa().saldoTotal;
    let saldoCumulativo = saldoInicial;
    const dias: { data: string; entradas: number; saidas: number; saldoCumulativo: number }[] = [];

    for (let i = 0; i <= diasHorizonte; i++) {
      const dia = new Date(Date.now() + i * 86400000);
      const diaStr = dia.toISOString().split('T')[0];

      const entradas = vendas
        .filter(v => v.status !== 'cancelada' && v.pagamento.status !== 'pago')
        .flatMap(v => v.pagamento.parcelas || [])
        .filter(p => !p.pago && p.dataVencimento === diaStr)
        .reduce((s, p) => s + p.valor, 0);

      const saidas = contasPagar
        .filter(c => c.status === 'pendente' && c.dataVencimento === diaStr)
        .reduce((s, c) => s + c.valor, 0);

      saldoCumulativo += entradas - saidas;
      dias.push({ data: diaStr, entradas, saidas, saldoCumulativo });
    }
    return dias;
  };

  /**
   * Caixa Real Disponível = saldo total - compromissos vencendo em 7 dias
   */
  const getCaixaRealDisponivel = (): number => {
    const { saldoTotal } = getSaldoCaixa();
    const obrigacoesProximas = contasPagar
      .filter(c => {
        if (c.status !== 'pendente') return false;
        const dias = Math.floor(
          (new Date(c.dataVencimento).getTime() - Date.now()) / 86400000
        );
        return dias <= 7;
      })
      .reduce((s, c) => s + c.valor, 0);
    return Math.max(0, saldoTotal - obrigacoesProximas);
  };

  /**
   * Lucro total e margem
   */
  const getLucroTotal = () => {
    const vendasConcluidas = vendas.filter(v => v.status !== 'cancelada');
    const totalVendido = vendasConcluidas.reduce((s, v) => s + v.valorTotal, 0);
    const totalCusto = vendasConcluidas.reduce(
      (s, v) => s + v.itens.reduce((si, item) => si + cogsDoItem(item, produtos), 0),
      0
    );
    const lucro = totalVendido - totalCusto;
    const margem = totalVendido > 0 ? (lucro / totalVendido) * 100 : 0;
    return { lucro, margem, totalCusto, totalVendido };
  };

  /**
   * Alertas inteligentes gerados automaticamente
   */
  const getAlertas = (): AlertaInteligente[] => {
    const alertas: AlertaInteligente[] = [];
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    // 1. Vendas travadas há mais de 7 dias
    const vendasAtrasadas = vendas.filter(v => {
      if (v.status === 'cancelada' || v.pagamento.status === 'pago') return false;
      const dataVenda = new Date(v.dataVenda);
      const diasAtraso = (hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24);
      return diasAtraso > 7;
    });
    if (vendasAtrasadas.length > 0) {
      const valorTravado = vendasAtrasadas.reduce(
        (s, v) => s + (v.pagamento.valorTotal - v.pagamento.valorRecebido), 0
      );
      alertas.push({
        id: 'capital_travado_longo',
        tipo: 'capital_travado',
        urgencia: 'alta',
        titulo: `${vendasAtrasadas.length} venda${vendasAtrasadas.length > 1 ? 's' : ''} travada${vendasAtrasadas.length > 1 ? 's' : ''} há +7 dias`,
        descricao: `R$ ${valorTravado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} parados — cobre esses recebimentos primeiro`,
        valor: valorTravado,
        acao: 'Ir para Vendas'
      });
    }

    // 2. Clientes com score lento e dívida
    const clientesLentos = clientes.filter(
      c => c.score === 'lento' && c.valorTotalPendente > 0
    );
    if (clientesLentos.length > 0) {
      const totalExposto = clientesLentos.reduce((s, c) => s + c.valorTotalPendente, 0);
      alertas.push({
        id: 'clientes_risco',
        tipo: 'cliente_risco',
        urgencia: 'alta',
        titulo: `${clientesLentos.length} cliente${clientesLentos.length > 1 ? 's' : ''} com pagamento lento`,
        descricao: `R$ ${totalExposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em risco — revise o crédito desses clientes`,
        valor: totalExposto,
        acao: 'Ver Clientes'
      });
    }

    // 3. Crédito vencido (ex-empréstimos)
    const creditosVencidos = creditos.filter(c => {
      return c.status !== 'pago' && c.dataVencimento < hojeStr;
    });
    if (creditosVencidos.length > 0) {
      const totalVencido = creditosVencidos.reduce(
        (s, c) => s + (c.valorTotal - c.pagamento.valorRecebido), 0
      );
      alertas.push({
        id: 'credito_vencido',
        tipo: 'prazo_vencido',
        urgencia: 'alta',
        titulo: `${creditosVencidos.length} crédito${creditosVencidos.length > 1 ? 's' : ''} vencido${creditosVencidos.length > 1 ? 's' : ''}`,
        descricao: `R$ ${totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em crédito vencido — cobre agora`,
        valor: totalVencido,
        acao: 'Ver Créditos'
      });
    }

    // 4. Créditos juros_recorrentes com vencimento passado (cobrança de juros pendente)
    const creditosJurosVencidos = creditos.filter(c =>
      c.tipoModalidade === 'juros_recorrentes' &&
      c.status === 'ativo' &&
      c.dataVencimento < hojeStr
    );
    if (creditosJurosVencidos.length > 0) {
      const totalJuros = creditosJurosVencidos.reduce(
        (s, c) => s + (c.valorJurosPeriodico || 0), 0
      );
      alertas.push({
        id: 'credito_juros_vencido',
        tipo: 'credito_juros_vencido',
        urgencia: 'media',
        titulo: `${creditosJurosVencidos.length} cobrança${creditosJurosVencidos.length > 1 ? 's' : ''} de juros vencida${creditosJurosVencidos.length > 1 ? 's' : ''}`,
        descricao: `R$ ${totalJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em juros a receber — renove os vencimentos`,
        valor: totalJuros,
        acao: 'Ver Créditos'
      });
    }

    // 5. Contas a pagar urgentes (vencendo em até 3 dias)
    const contasUrgentes = contasPagar.filter(c => {
      if (c.status !== 'pendente') return false;
      const dias = Math.floor((new Date(c.dataVencimento).getTime() - hoje.getTime()) / 86400000);
      return dias <= 3;
    });
    if (contasUrgentes.length > 0) {
      const totalUrgente = contasUrgentes.reduce((s, c) => s + c.valor, 0);
      alertas.push({
        id: 'conta_pagar_urgente',
        tipo: 'conta_pagar_urgente',
        urgencia: 'alta',
        titulo: `${contasUrgentes.length} conta${contasUrgentes.length > 1 ? 's' : ''} a pagar vencendo em 3 dias`,
        descricao: `R$ ${totalUrgente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar — verifique o caixa`,
        valor: totalUrgente,
        acao: 'Ver Contas a Pagar'
      });
    }

    // 6. CCC alto (ciclo financeiro longo)
    const ccc = getCCC();
    if (ccc > 30) {
      alertas.push({
        id: 'ccc_alto',
        tipo: 'ccc_alto',
        urgencia: ccc > 60 ? 'alta' : 'media',
        titulo: `Ciclo financeiro longo: ${ccc} dias`,
        descricao: `Seu dinheiro fica ${ccc} dias fora do caixa. Acelere cobranças e gire o estoque mais rápido`,
        acao: 'Ver Relatórios'
      });
    }

    // 7. Estoque parado (DIO alto)
    const dio = getDIO();
    if (dio > 45) {
      alertas.push({
        id: 'estoque_parado',
        tipo: 'estoque_parado',
        urgencia: 'media',
        titulo: `Estoque parado há ~${dio} dias em média`,
        descricao: `Capital imobilizado em produtos sem giro. Avalie promoções ou reposicionamento de preço`,
        valor: getValorEstoque().valorCusto,
        acao: 'Ver Produtos'
      });
    }

    // 8. Concentração de risco em um cliente
    const travadoTotal = getCapitalTravado();
    if (travadoTotal > 0) {
      const devedoresMapa: Record<string, number> = {};
      vendas.filter(v => v.status !== 'cancelada' && v.pagamento.status !== 'pago').forEach(v => {
        const p = v.pagamento.valorTotal - v.pagamento.valorRecebido;
        devedoresMapa[v.clienteNome] = (devedoresMapa[v.clienteNome] || 0) + p;
      });
      const maiorDevedor = Object.entries(devedoresMapa).sort(([, a], [, b]) => b - a)[0];
      if (maiorDevedor && (maiorDevedor[1] / travadoTotal) > 0.40) {
        alertas.push({
          id: 'concentracao_cliente',
          tipo: 'concentracao_cliente',
          urgencia: 'media',
          titulo: `${((maiorDevedor[1] / travadoTotal) * 100).toFixed(0)}% do capital travado em 1 cliente`,
          descricao: `${maiorDevedor[0]} concentra R$ ${maiorDevedor[1].toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — risco alto de inadimplência`,
          valor: maiorDevedor[1],
          acao: 'Ver Clientes'
        });
      }
    }

    // 9. Margem baixa
    const { margem } = getLucroTotal();
    if (margem > 0 && margem < 15) {
      alertas.push({
        id: 'margem_baixa',
        tipo: 'margem_baixa',
        urgencia: 'alta',
        titulo: `Margem crítica: ${margem.toFixed(1)}%`,
        descricao: `Margem abaixo de 15% — revise preços de venda ou negocie melhor com fornecedores`,
        acao: 'Ver Relatórios'
      });
    }

    // 10. Oportunidade de reinvestimento (capital disponível alto)
    const capitalDisponivel = getCapitalDisponivel();
    if (capitalDisponivel > 500) {
      alertas.push({
        id: 'reinvestimento',
        tipo: 'reinvestimento',
        urgencia: 'baixa',
        titulo: `Capital livre para reinvestir`,
        descricao: `Você tem R$ ${capitalDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponíveis — hora de comprar mais produto`,
        valor: capitalDisponivel,
        acao: 'Registrar Compra'
      });
    }

    return alertas.sort((a, b) => {
      const ordem = { alta: 0, media: 1, baixa: 2 };
      return ordem[a.urgencia] - ordem[b.urgencia];
    });
  };

  // ================================================================
  // PRODUTOS
  // ================================================================

  const adicionarProduto = (produto: Omit<Produto, 'id' | 'criadoEm'>) => {
    const novoProduto: Produto = {
      ...produto,
      id: gerarId(),
      criadoEm: new Date().toISOString(),
    };
    setProdutos(prev => [novoProduto, ...prev]);
    return novoProduto;
  };

  const atualizarProduto = (id: string, dados: Partial<Produto>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p));
  };

  const removerProduto = (id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
  };

  const getProdutoById = (id: string) => produtos.find(p => p.id === id);

  const getProdutosEstoqueBaixo = () => {
    return produtos.filter(p => p.quantidade <= 3);
  };

  // Insights de produtos (mais lucrativo, mais rápido, menos eficiente)
  const getInsightsProdutos = () => {
    const mapa: Record<string, {
      nome: string; lucroTotal: number; qtdVendida: number;
      totalVendas: number; diasTotal: number; qtdPagas: number;
    }> = {};

    vendas.filter(v => v.status !== 'cancelada').forEach(v => {
      const lancamentos = v.pagamento.lancamentos;
      const ultimoLancamento = lancamentos[lancamentos.length - 1];
      const diasRetorno = ultimoLancamento
        ? Math.max(0, (new Date(ultimoLancamento.data).getTime() - new Date(v.dataVenda).getTime()) / 86400000)
        : null;

      v.itens.forEach(item => {
        const cu = custoUnitarioDoItem(item, produtos);
        const lucro = (item.precoUnitario - cu) * item.quantidade;
        if (!mapa[item.produtoId]) {
          mapa[item.produtoId] = { nome: item.produtoNome, lucroTotal: 0, qtdVendida: 0, totalVendas: 0, diasTotal: 0, qtdPagas: 0 };
        }
        mapa[item.produtoId].lucroTotal += lucro;
        mapa[item.produtoId].qtdVendida += item.quantidade;
        mapa[item.produtoId].totalVendas += item.quantidade * item.precoUnitario;
        if (diasRetorno !== null && v.pagamento.status === 'pago') {
          mapa[item.produtoId].diasTotal += diasRetorno;
          mapa[item.produtoId].qtdPagas += 1;
        }
      });
    });

    const lista = Object.entries(mapa).map(([id, d]) => {
      const tempoMedioVenda = d.qtdPagas > 0 ? Math.round(d.diasTotal / d.qtdPagas) : 0;
      const lucroPorUnidade = d.qtdVendida > 0 ? d.lucroTotal / d.qtdVendida : 0;
      const lucroRsPerDia = tempoMedioVenda > 0 ? lucroPorUnidade / tempoMedioVenda : undefined;
      return {
        produtoId: id,
        produtoNome: d.nome,
        lucroTotal: d.lucroTotal,
        quantidadeVendida: d.qtdVendida,
        margemLucro: d.totalVendas > 0 ? (d.lucroTotal / d.totalVendas) * 100 : 0,
        tempoMedioVenda,
        lucroRsPerDia,
      };
    });

    const maisLucrativo = [...lista].sort((a, b) => b.lucroTotal - a.lucroTotal)[0];
    const maisRapido = [...lista].filter(p => p.tempoMedioVenda > 0).sort((a, b) => a.tempoMedioVenda - b.tempoMedioVenda)[0];
    const menosEficiente = [...lista].sort((a, b) => a.margemLucro - b.margemLucro)[0];

    return { lista, maisLucrativo, maisRapido, menosEficiente };
  };

  // ================================================================
  // VENDAS
  // ================================================================

  const pushEntradaCaixaVenda = (vendaId: string, valor: number, forma: FormaPagamento, data: string) => {
    if (valor <= 0) return;
    const canal: 'pix' | 'dinheiro' = forma === 'dinheiro' ? 'dinheiro' : 'pix';
    const tipo: TipoMovimentacaoCaixa = canal === 'pix' ? 'entrada_venda_pix' : 'entrada_venda_dinheiro';
    setMovimentacoes(prev => [{
      id: gerarId(),
      tipo,
      canal,
      direcao: 'entrada',
      descricao: 'Recebimento de venda',
      valor,
      data,
      vendaId,
      criadoEm: new Date().toISOString(),
    }, ...prev]);
  };

  const adicionarVenda = (venda: Omit<Venda, 'id' | 'criadoEm' | 'pagamento'>) => {
    const id = gerarId();

    const itensComCusto = venda.itens.map(item => {
      const prod = produtos.find(p => p.id === item.produtoId);
      return { ...item, precoCusto: prod?.precoCusto ?? item.precoCusto };
    });

    const valorParcela = venda.numeroParcelas > 1
      ? venda.valorTotal / venda.numeroParcelas
      : venda.valorTotal;

    const parcelas = venda.numeroParcelas > 1
      ? Array.from({ length: venda.numeroParcelas }, (_, i) => ({
          numero: i + 1,
          valor: valorParcela,
          dataVencimento: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          pago: false,
        }))
      : undefined;

    const pagamento = {
      id: gerarId(),
      vendaId: id,
      formaPagamento: venda.formaPagamento,
      valorTotal: venda.valorTotal,
      valorRecebido: venda.formaPagamento === 'dinheiro' || venda.formaPagamento === 'pix' ? venda.valorTotal : 0,
      parcelas,
      lancamentos: (venda.formaPagamento === 'dinheiro' || venda.formaPagamento === 'pix') ? [{
        id: gerarId(),
        valor: venda.valorTotal,
        data: venda.dataVenda,
        observacao: 'Pagamento à vista'
      }] : [],
      status: (venda.formaPagamento === 'dinheiro' || venda.formaPagamento === 'pix' ? 'pago' : 'pendente') as StatusPagamento,
    };

    const vistaPaga = venda.formaPagamento === 'dinheiro' || venda.formaPagamento === 'pix';

    const novaVenda: Venda = {
      ...venda,
      itens: itensComCusto,
      id,
      pagamento,
      status: vistaPaga ? 'concluida' : venda.status,
      criadoEm: new Date().toISOString(),
    };

    setVendas(prev => [novaVenda, ...prev]);

    if (vistaPaga && venda.valorTotal > 0) {
      pushEntradaCaixaVenda(id, venda.valorTotal, venda.formaPagamento, venda.dataVenda);
    }

    // Diminuir estoque
    setProdutos(prev => prev.map(p => {
      const itemVenda = venda.itens.find(i => i.produtoId === p.id);
      if (itemVenda) {
        return { ...p, quantidade: Math.max(0, p.quantidade - itemVenda.quantidade) };
      }
      return p;
    }));

    // Atualizar ou criar cliente
    const clienteExistente = clientesRaw.find(c => c.nome.toLowerCase() === venda.clienteNome.toLowerCase());
    if (clienteExistente) {
      setClientes(prev => prev.map(c =>
        c.id === clienteExistente.id
          ? {
              ...c,
              totalCompras: c.totalCompras + 1,
              valorTotalGasto: (c.valorTotalGasto || 0) + venda.valorTotal,
              ultimaCompra: new Date().toISOString()
            }
          : c
      ));
    } else {
      const novoCliente: Cliente = {
        id: gerarId(),
        nome: venda.clienteNome,
        contato: venda.clienteContato || '',
        totalCompras: 1,
        valorTotalGasto: venda.valorTotal,
        valorTotalPago: 0,
        valorTotalPendente: venda.valorTotal,
        ultimaCompra: new Date().toISOString(),
        tempoMedioPagamento: 0,
        score: 'novo',
      };
      setClientes(prev => [novoCliente, ...prev]);
    }

    return novaVenda;
  };

  const atualizarVenda = (id: string, dados: Partial<Venda>) => {
    setVendas(prev => prev.map(v => v.id === id ? { ...v, ...dados } : v));
  };

  const removerVenda = (id: string) => {
    setVendas(prev => prev.filter(v => v.id !== id));
    setMovimentacoes(prev => prev.filter(m => m.vendaId !== id));
  };

  const getVendaById = (id: string) => vendas.find(v => v.id === id);

  const registrarPagamento = (vendaId: string, valor: number, data: string, observacao?: string) => {
    if (valor <= 0) return;

    const ctx: { forma?: FormaPagamento; entrada: number } = { entrada: 0 };

    setVendas(prev => prev.map(v => {
      if (v.id !== vendaId) return v;

      const pendente = v.pagamento.valorTotal - v.pagamento.valorRecebido;
      if (pendente < 0.01) return v;

      const aplicado = Math.min(valor, pendente);
      ctx.forma = v.formaPagamento;
      ctx.entrada = aplicado;

      const novoPagamento = { ...v.pagamento };

      const novoLancamento = { id: gerarId(), valor: aplicado, data, observacao };
      novoPagamento.lancamentos = [...(novoPagamento.lancamentos || []), novoLancamento];
      novoPagamento.valorRecebido += aplicado;

      if (novoPagamento.valorRecebido >= novoPagamento.valorTotal - 0.01) {
        novoPagamento.status = 'pago';
        novoPagamento.valorRecebido = novoPagamento.valorTotal;
      } else {
        novoPagamento.status = 'parcial';
      }

      if (novoPagamento.parcelas) {
        let valorParaAbater = novoPagamento.valorRecebido;
        novoPagamento.parcelas = novoPagamento.parcelas.map(p => {
          if (valorParaAbater >= p.valor - 0.01) {
            valorParaAbater -= p.valor;
            return { ...p, pago: true, dataPagamento: p.dataPagamento || data };
          }
          return { ...p, pago: false };
        });
      }

      return {
        ...v,
        pagamento: novoPagamento,
        status: novoPagamento.status === 'pago' ? 'concluida' : 'pendente',
        dataPagamento: novoPagamento.status === 'pago' ? data : v.dataPagamento
      };
    }));

    if (ctx.forma && ctx.entrada > 0) {
      pushEntradaCaixaVenda(vendaId, ctx.entrada, ctx.forma, data);
    }
  };

  const getContasAReceber = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return vendas
      .filter(v => v.pagamento.status !== 'pago' && v.status !== 'cancelada')
      .map(v => {
        const parcelasPendentes = v.pagamento.parcelas?.filter(p => !p.pago) || [];
        const parcelaMaisProxima = parcelasPendentes[0];
        return {
          vendaId: v.id,
          clienteNome: v.clienteNome,
          clienteContato: v.clienteContato,
          produtoNome: v.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(', '),
          valorPendente: v.pagamento.valorTotal - v.pagamento.valorRecebido,
          dataVencimento: parcelaMaisProxima?.dataVencimento,
          diasAtraso: parcelaMaisProxima
            ? Math.floor((new Date(hoje).getTime() - new Date(parcelaMaisProxima.dataVencimento).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          parcelaNumero: parcelaMaisProxima?.numero,
        };
      })
      .filter(c => c.valorPendente > 0)
      .sort((a, b) => b.diasAtraso - a.diasAtraso);
  };

  // ================================================================
  // CLIENTES
  // ================================================================

  const atualizarCliente = (id: string, dados: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c));
  };

  const removerCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  // ================================================================
  // CRÉDITO A CLIENTES (ex-empréstimos)
  // ================================================================

  const adicionarEmprestimo = (dados: Omit<CreditoCliente, 'id' | 'criadoEm' | 'pagamento' | 'valorTotal' | 'valorJurosPeriodico'>) => {
    const id = gerarId();
    let valorTotal = dados.valorConcedido;
    let valorJurosPeriodico: number | undefined = undefined;

    // Calcula prazo em meses entre concessão e vencimento
    const prazoMeses = Math.max(1, Math.round(
      (new Date(dados.dataVencimento).getTime() - new Date(dados.dataConcessao).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));

    if (dados.tipoModalidade === 'amortizado') {
      // Juros simples pelo período correto (taxa * meses)
      valorTotal = dados.valorConcedido * (1 + dados.taxaJuros * prazoMeses);
    } else {
      // juros_recorrentes: principal permanece, juros periódico por ciclo
      valorJurosPeriodico = dados.valorConcedido * dados.taxaJuros;
    }

    const pagamento: Pagamento = {
      id: gerarId(),
      vendaId: id,
      formaPagamento: 'dinheiro',
      valorTotal,
      valorRecebido: 0,
      lancamentos: [],
      status: 'pendente'
    };

    const novoCredito: CreditoCliente = {
      ...dados,
      id,
      valorTotal,
      valorJurosPeriodico,
      prazoMeses,
      pagamento,
      criadoEm: new Date().toISOString(),
      status: dados.tipoModalidade === 'juros_recorrentes' ? 'ativo' : 'pendente'
    };

    setCreditos(prev => [novoCredito, ...prev]);
    return novoCredito;
  };

  const registrarPagamentoEmprestimo = (creditoId: string, valor: number, data: string, observacao?: string) => {
    setCreditos(prev => prev.map(e => {
      if (e.id !== creditoId) return e;

      const novoPagamento = { ...e.pagamento };
      novoPagamento.lancamentos = [...novoPagamento.lancamentos, { id: gerarId(), valor, data, observacao }];
      novoPagamento.valorRecebido += valor;

      let novoStatus = e.status;

      if (e.tipoModalidade === 'amortizado') {
        if (novoPagamento.valorRecebido >= novoPagamento.valorTotal - 0.01) {
          novoPagamento.status = 'pago';
          novoPagamento.valorRecebido = novoPagamento.valorTotal;
          novoStatus = 'pago';
        } else {
          novoStatus = 'pendente';
        }
      } else {
        // juros_recorrentes - nunca quita por pagamento de juros
        novoPagamento.status = 'parcial';
        novoStatus = 'ativo';
      }

      return { ...e, pagamento: novoPagamento, status: novoStatus };
    }));
  };

  const quitarPrincipalEmprestimo = (creditoId: string, data: string) => {
    setCreditos(prev => prev.map(e => {
      if (e.id !== creditoId || e.tipoModalidade !== 'juros_recorrentes') return e;
      const novoPagamento = { ...e.pagamento };
      novoPagamento.lancamentos = [...novoPagamento.lancamentos, { id: gerarId(), valor: e.valorConcedido, data, observacao: 'Quitação do Principal' }];
      novoPagamento.valorRecebido += e.valorConcedido;
      novoPagamento.status = 'pago';
      return { ...e, pagamento: novoPagamento, status: 'pago' };
    }));
  };

  const removerEmprestimo = (id: string) => {
    setCreditos(prev => prev.filter(e => e.id !== id));
  };

  // ================================================================
  // CAIXA
  // ================================================================

  const adicionarMovimentacao = (dados: Omit<MovimentacaoCaixa, 'id' | 'criadoEm'>) => {
    const nova: MovimentacaoCaixa = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
    setMovimentacoes(prev => [nova, ...prev]);
    return nova;
  };

  const removerMovimentacao = (id: string) => {
    setMovimentacoes(prev => prev.filter(m => m.id !== id));
  };

  const getSaldoCaixa = () => {
    const saldoPix = movimentacoes.filter(m => m.canal === 'pix').reduce((s, m) => m.direcao === 'entrada' ? s + m.valor : s - m.valor, 0);
    const saldoDinheiro = movimentacoes.filter(m => m.canal === 'dinheiro').reduce((s, m) => m.direcao === 'entrada' ? s + m.valor : s - m.valor, 0);
    return { saldoPix, saldoDinheiro, saldoTotal: saldoPix + saldoDinheiro };
  };

  // ================================================================
  // COMPRAS
  // ================================================================

  const adicionarCompra = (dados: Omit<Compra, 'id' | 'criadoEm'>) => {
    const novaCompra: Compra = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
    setCompras(prev => [novaCompra, ...prev]);

    dados.itens.forEach(item => {
      if (item.produtoId) {
        setProdutos(prev => prev.map(p =>
          p.id === item.produtoId ? { ...p, quantidade: p.quantidade + item.quantidade } : p
        ));
      }
    });

    const canal: 'pix' | 'dinheiro' = dados.formaPagamento === 'pix' ? 'pix' : 'dinheiro';
    const movSaida: Omit<MovimentacaoCaixa, 'id' | 'criadoEm'> = {
      tipo: 'saida_compra' as TipoMovimentacaoCaixa,
      canal,
      direcao: 'saida',
      descricao: `Compra: ${dados.fornecedor}`,
      valor: dados.valorTotal,
      data: dados.data,
      compraId: novaCompra.id,
    };
    setMovimentacoes(prev => [{ ...movSaida, id: gerarId(), criadoEm: new Date().toISOString() }, ...prev]);

    return novaCompra;
  };

  const removerCompra = (id: string) => {
    setCompras(prev => prev.filter(c => c.id !== id));
    setMovimentacoes(prev => prev.filter(m => m.compraId !== id));
  };

  const getTotalInvestidoEstoque = () => compras.reduce((s, c) => s + c.valorTotal, 0);

  // ================================================================
  // METAS DE REINVESTIMENTO
  // ================================================================

  const adicionarMeta = (dados: Omit<MetaReinvestimento, 'id' | 'criadoEm'>) => {
    if (dados.ativa) {
      setMetas(prev => prev.map(m => ({ ...m, ativa: false })));
    }
    const nova: MetaReinvestimento = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
    setMetas(prev => [nova, ...prev]);
    return nova;
  };

  const removerMeta = (id: string) => {
    setMetas(prev => prev.filter(m => m.id !== id));
  };

  const getMetaAtiva = () => metas.find(m => m.ativa) || null;

  const getProgressoMeta = (meta: MetaReinvestimento) => {
    const receitaPeriodo = vendas
      .filter(v => v.status !== 'cancelada' && v.dataVenda >= meta.periodoInicio && v.dataVenda <= meta.periodoFim)
      .reduce((s, v) => s + v.valorTotal, 0);

    const valorMeta = receitaPeriodo * (meta.percentualMeta / 100);
    const reinvestidoPeriodo = compras
      .filter(c => c.data >= meta.periodoInicio && c.data <= meta.periodoFim)
      .reduce((s, c) => s + c.valorTotal, 0);

    const percentualRealizado = valorMeta > 0 ? Math.min(100, (reinvestidoPeriodo / valorMeta) * 100) : 0;

    const faltando = Math.max(0, valorMeta - reinvestidoPeriodo);
    const capitalAtual = getCapitalDisponivel();
    return {
      receitaPeriodo, valorMeta, reinvestidoPeriodo, percentualRealizado,
      atingida: reinvestidoPeriodo >= valorMeta,
      faltando,
      capitalDisponivelParaMeta: capitalAtual,
      podeReinvestir: capitalAtual >= faltando && faltando > 0,
    };
  };

  // ================================================================
  // RECOMENDAÇÕES TÁTICAS
  // ================================================================

  const getRecomendacoes = (): Recomendacao[] => {
    const recs: Recomendacao[] = [];
    const { lista: produtosList } = getInsightsProdutos();
    const capitalAtual = getCapitalDisponivel();

    // Janela de 30 dias para métricas
    const janela30d = new Date(Date.now() - 30 * 86400000);
    const vendasMes = vendas.filter(v => v.status !== 'cancelada' && new Date(v.dataVenda) >= janela30d);
    const totalVendasMes = vendasMes.reduce((s, v) => s + v.valorTotal, 0);

    // 1. Cobrar clientes lentos com dívida alta
    const clientesParaCobrar = clientes
      .filter(c => c.score === 'lento' && c.valorTotalPendente > 0)
      .sort((a, b) => b.valorTotalPendente - a.valorTotalPendente);
    if (clientesParaCobrar.length > 0) {
      const top = clientesParaCobrar[0];
      recs.push({
        id: 'cobrar_cliente_lento',
        tipo: 'cobrar_cliente',
        prioridade: 1,
        titulo: `Cobrar ${top.nome}`,
        descricao: `Pagador lento com R$ ${top.valorTotalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto. Priorize esse recebimento.`,
        impactoEstimado: top.valorTotalPendente,
        entidadeId: top.id,
        acao: 'clientes',
      });
    }

    // 2. Estoque baixo com capital disponível para repor
    const valorEstoqueAtual = getValorEstoque().valorCusto;
    if (capitalAtual > 0 && totalVendasMes > 0 && valorEstoqueAtual < totalVendasMes * 0.25) {
      const sugerido = totalVendasMes * 0.3 - valorEstoqueAtual;
      recs.push({
        id: 'repor_estoque',
        tipo: 'comprar_estoque',
        prioridade: capitalAtual >= sugerido ? 1 : 2,
        titulo: 'Reabastecer estoque',
        descricao: `Estoque atual (R$ ${valorEstoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) está baixo em relação ao volume de vendas. Considere repor ~R$ ${Math.round(sugerido).toLocaleString('pt-BR')}.`,
        impactoEstimado: sugerido,
        acao: 'compras',
      });
    }

    // 3. Produto com margem crítica
    const produtosMargemBaixa = produtosList.filter(p => p.margemLucro > 0 && p.margemLucro < 12);
    if (produtosMargemBaixa.length > 0) {
      const pior = produtosMargemBaixa.sort((a, b) => a.margemLucro - b.margemLucro)[0];
      recs.push({
        id: 'revisar_preco_produto',
        tipo: 'revisar_preco',
        prioridade: 2,
        titulo: `Revisar preço: ${pior.produtoNome}`,
        descricao: `Margem de ${pior.margemLucro.toFixed(1)}% está abaixo do mínimo saudável. Aumente o preço de venda ou negocie custo com fornecedor.`,
        entidadeId: pior.produtoId,
        acao: 'produtos',
      });
    }

    // 4. Capital parado — hora de reinvestir
    if (capitalAtual > 500 && getDIO() < 30 && totalVendasMes > 0) {
      recs.push({
        id: 'reinvestir_capital',
        tipo: 'comprar_estoque',
        prioridade: 2,
        titulo: 'Capital disponível para reinvestir',
        descricao: `R$ ${capitalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} livres com estoque girando bem. Reinvista para acelerar o ciclo.`,
        impactoEstimado: capitalAtual,
        acao: 'compras',
      });
    }

    // 5. Concentrar em produto mais rentável por dia
    const produtosComDia = produtosList.filter(p => p.lucroRsPerDia !== undefined && p.lucroRsPerDia > 0);
    if (produtosComDia.length >= 2) {
      const mediaPerDia = produtosComDia.reduce((s, p) => s + (p.lucroRsPerDia || 0), 0) / produtosComDia.length;
      const melhor = produtosComDia.sort((a, b) => (b.lucroRsPerDia || 0) - (a.lucroRsPerDia || 0))[0];
      if ((melhor.lucroRsPerDia || 0) > mediaPerDia * 2.5) {
        recs.push({
          id: 'concentrar_produto_top',
          tipo: 'concentrar_produto',
          prioridade: 3,
          titulo: `Priorizar ${melhor.produtoNome}`,
          descricao: `Gera R$ ${(melhor.lucroRsPerDia || 0).toFixed(2)}/dia de capital — ${((melhor.lucroRsPerDia || 0) / mediaPerDia).toFixed(1)}x acima da média. Aumente o estoque desse produto.`,
          entidadeId: melhor.produtoId,
          acao: 'produtos',
        });
      }
    }

    // 6. Limitar crédito a cliente lento sem limite definido
    const clientesSemLimite = clientes.filter(c => c.score === 'lento' && !c.limiteCredito && c.valorTotalPendente > 0);
    if (clientesSemLimite.length > 0) {
      recs.push({
        id: 'limitar_credito_lento',
        tipo: 'limitar_credito',
        prioridade: 2,
        titulo: `Limitar crédito para ${clientesSemLimite.length} cliente${clientesSemLimite.length > 1 ? 's' : ''} lento${clientesSemLimite.length > 1 ? 's' : ''}`,
        descricao: `Clientes com histórico de atraso sem limite de crédito definido. Defina um teto para reduzir exposição.`,
        impactoEstimado: clientesSemLimite.reduce((s, c) => s + c.valorTotalPendente, 0),
        acao: 'clientes',
      });
    }

    // Ordena por prioridade
    return recs.sort((a, b) => a.prioridade - b.prioridade);
  };

  // ================================================================
  // CONTAS A PAGAR
  // ================================================================

  const adicionarContaPagar = (dados: Omit<ContaPagar, 'id' | 'criadoEm' | 'status'>) => {
    const hoje = new Date().toISOString().split('T')[0];
    const nova: ContaPagar = {
      ...dados,
      id: gerarId(),
      status: dados.dataVencimento < hoje ? 'vencido' : 'pendente',
      criadoEm: new Date().toISOString(),
    };
    setContasPagar(prev => [nova, ...prev]);
    return nova;
  };

  const pagarConta = (id: string, dataPagamento: string) => {
    setContasPagar(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'pago' as StatusContaPagar, dataPagamento } : c
    ));
  };

  const removerContaPagar = (id: string) => {
    setContasPagar(prev => prev.filter(c => c.id !== id));
  };

  // ================================================================
  // SISTEMA
  // ================================================================

  const limparDados = () => {
    ['sge_produtos', 'sge_vendas', 'sge_clientes', 'sge_emprestimos',
     'produtos', 'vendas', 'clientes', 'emprestimos', 'caixa_movimentacoes',
     'compras', 'metas_reinvestimento', 'contas_pagar'].forEach(k => localStorage.removeItem(k));
    setProdutos([]); setVendas([]); setClientes([]); setCreditos([]);
    setMovimentacoes([]); setCompras([]); setMetas([]); setContasPagar([]);
    window.location.reload();
  };

  return {
    // Dados
    produtos, vendas, clientes, emprestimos, creditos,
    movimentacoes, compras, metas, contasPagar,
    // Analytics de Capital
    getCapitalDisponivel,
    getCapitalTravado,
    getCapitalTravadoDetalhado,
    getGiroCapital,
    getTempoMedioRetorno,
    getDSO,
    getLucroTotal,
    getAlertas,
    getInsightsProdutos,
    // Estoque e CCC
    getValorEstoque,
    getDIO,
    getDPO,
    getCCC,
    // Recebíveis
    getAgingRecebiveis,
    getProjecaoFluxoCaixa,
    getCaixaRealDisponivel,
    // Recomendações
    getRecomendacoes,
    // Produtos
    adicionarProduto, atualizarProduto, removerProduto,
    getProdutoById, getProdutosEstoqueBaixo,
    // Vendas
    adicionarVenda, atualizarVenda, removerVenda,
    getVendaById, registrarPagamento, getContasAReceber,
    // Créditos (ex-empréstimos)
    adicionarEmprestimo, registrarPagamentoEmprestimo, removerEmprestimo,
    // Clientes
    atualizarCliente, removerCliente,
    // Caixa
    adicionarMovimentacao, removerMovimentacao, getSaldoCaixa,
    // Compras
    adicionarCompra, removerCompra, getTotalInvestidoEstoque,
    // Contas a Pagar
    adicionarContaPagar, pagarConta, removerContaPagar,
    // Metas
    adicionarMeta, removerMeta, getMetaAtiva, getProgressoMeta,
    // Emprestimos Adicionais
    quitarPrincipalEmprestimo,
    // Sistema
    limparDados,
  };
}
