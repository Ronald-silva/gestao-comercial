import { useMemo } from 'react';
import { useLocalStorage } from './useStorage';
import type {
  Produto, Venda, Cliente, StatusPagamento,
  CreditoCliente, Pagamento,
  MovimentacaoCaixa, TipoMovimentacaoCaixa,
  Compra, MetaReinvestimento, ScoreCliente, AlertaInteligente
} from '@/types';

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
   * Capital Disponível = dinheiro já recebido - custo dos produtos vendidos
   * É o dinheiro livre para reinvestimento
   */
  const getCapitalDisponivel = () => {
    const vendasConcluidas = vendas.filter(v => v.status !== 'cancelada');
    const totalRecebido = vendasConcluidas.reduce((s, v) => s + v.pagamento.valorRecebido, 0);
    // Custo proporcional ao recebido
    const totalCusto = vendasConcluidas.reduce((s, v) => {
      const custoVenda = v.itens.reduce((si, item) => {
        const prod = produtos.find(p => p.id === item.produtoId);
        return si + (prod ? prod.precoCusto * item.quantidade : 0);
      }, 0);
      // Proporcional ao recebido
      const proporcao = v.valorTotal > 0 ? v.pagamento.valorRecebido / v.valorTotal : 0;
      return s + custoVenda * proporcao;
    }, 0);
    return Math.max(0, totalRecebido - totalCusto);
  };

  /**
   * Capital Travado = soma de vendas não pagas (dinheiro que ainda não está em caixa)
   */
  const getCapitalTravado = () => {
    return vendas
      .filter(v => v.status !== 'cancelada' && v.pagamento.status !== 'pago')
      .reduce((s, v) => s + (v.pagamento.valorTotal - v.pagamento.valorRecebido), 0);
  };

  /**
   * Giro de Capital = Total vendido / Total investido em compras
   * Indica quantas vezes o capital foi "girado"
   */
  const getGiroCapital = () => {
    const totalVendido = vendas
      .filter(v => v.status !== 'cancelada')
      .reduce((s, v) => s + v.valorTotal, 0);
    const totalInvestido = compras.reduce((s, c) => s + c.valorTotal, 0);
    if (totalInvestido === 0) return 0;
    return totalVendido / totalInvestido;
  };

  /**
   * Tempo Médio de Retorno = média de dias entre dataVenda e dataPagamento
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
   * Lucro total e margem
   */
  const getLucroTotal = () => {
    const vendasConcluidas = vendas.filter(v => v.status !== 'cancelada');
    const totalVendido = vendasConcluidas.reduce((s, v) => s + v.valorTotal, 0);
    const totalCusto = vendasConcluidas.reduce((s, v) => {
      return s + v.itens.reduce((si, item) => {
        const prod = produtos.find(p => p.id === item.produtoId);
        return si + (prod ? prod.precoCusto * item.quantidade : 0);
      }, 0);
    }, 0);
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

    // 4. Oportunidade de reinvestimento (capital disponível alto)
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
        const prod = produtos.find(p => p.id === item.produtoId);
        const lucro = prod ? (item.precoUnitario - prod.precoCusto) * item.quantidade : 0;
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

    const lista = Object.entries(mapa).map(([id, d]) => ({
      produtoId: id,
      produtoNome: d.nome,
      lucroTotal: d.lucroTotal,
      quantidadeVendida: d.qtdVendida,
      margemLucro: d.totalVendas > 0 ? (d.lucroTotal / d.totalVendas) * 100 : 0,
      tempoMedioVenda: d.qtdPagas > 0 ? Math.round(d.diasTotal / d.qtdPagas) : 0,
    }));

    const maisLucrativo = [...lista].sort((a, b) => b.lucroTotal - a.lucroTotal)[0];
    const maisRapido = [...lista].filter(p => p.tempoMedioVenda > 0).sort((a, b) => a.tempoMedioVenda - b.tempoMedioVenda)[0];
    const menosEficiente = [...lista].sort((a, b) => a.margemLucro - b.margemLucro)[0];

    return { lista, maisLucrativo, maisRapido, menosEficiente };
  };

  // ================================================================
  // VENDAS
  // ================================================================

  const adicionarVenda = (venda: Omit<Venda, 'id' | 'criadoEm' | 'pagamento'>) => {
    const id = gerarId();
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
        data: new Date().toISOString().split('T')[0],
        observacao: 'Pagamento à vista'
      }] : [],
      status: (venda.formaPagamento === 'dinheiro' || venda.formaPagamento === 'pix' ? 'pago' : 'pendente') as StatusPagamento,
    };

    const novaVenda: Venda = {
      ...venda,
      id,
      pagamento,
      criadoEm: new Date().toISOString(),
    };

    setVendas(prev => [novaVenda, ...prev]);

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
  };

  const getVendaById = (id: string) => vendas.find(v => v.id === id);

  const registrarPagamento = (vendaId: string, valor: number, data: string, observacao?: string) => {

    setVendas(prev => prev.map(v => {
      if (v.id !== vendaId) return v;

      const novoPagamento = { ...v.pagamento };

      const novoLancamento = { id: gerarId(), valor, data, observacao };
      novoPagamento.lancamentos = [...(novoPagamento.lancamentos || []), novoLancamento];
      novoPagamento.valorRecebido += valor;

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

    if (dados.tipoModalidade === 'amortizado') {
      valorTotal = dados.valorConcedido * (1 + dados.taxaJuros);
    } else {
      // juros_recorrentes - valorTotal keeps pointing just to principal as a reference,
      // but they don't amortize it directly through interest payments.
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

    return {
      receitaPeriodo, valorMeta, reinvestidoPeriodo, percentualRealizado,
      atingida: reinvestidoPeriodo >= valorMeta,
      faltando: Math.max(0, valorMeta - reinvestidoPeriodo),
    };
  };

  // ================================================================
  // SISTEMA
  // ================================================================

  const limparDados = () => {
    ['sge_produtos', 'sge_vendas', 'sge_clientes', 'sge_emprestimos',
     'produtos', 'vendas', 'clientes', 'emprestimos', 'caixa_movimentacoes',
     'compras', 'metas_reinvestimento'].forEach(k => localStorage.removeItem(k));
    setProdutos([]); setVendas([]); setClientes([]); setCreditos([]);
    setMovimentacoes([]); setCompras([]); setMetas([]);
    window.location.reload();
  };

  return {
    // Dados
    produtos, vendas, clientes, emprestimos, creditos,
    movimentacoes, compras, metas,
    // Analytics de Capital
    getCapitalDisponivel,
    getCapitalTravado,
    getGiroCapital,
    getTempoMedioRetorno,
    getLucroTotal,
    getAlertas,
    getInsightsProdutos,
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
    // Metas
    adicionarMeta, removerMeta, getMetaAtiva, getProgressoMeta,
    // Emprestimos Adicionais
    quitarPrincipalEmprestimo,
    // Sistema
    limparDados,
  };
}
