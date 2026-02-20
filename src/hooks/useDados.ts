import { useMemo } from 'react';
import { useLocalStorage } from './useStorage';
import type { Produto, Venda, Cliente, StatusPagamento, Emprestimo, Pagamento, MovimentacaoCaixa, TipoMovimentacaoCaixa, Compra, MetaReinvestimento } from '@/types';

// Função para gerar ID único
const gerarIdUnico = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Função para validar e migrar empréstimos antigos
const validarEmprestimo = (emp: Partial<Emprestimo>): Emprestimo | null => {
  if (!emp || typeof emp !== 'object') return null;
  if (!emp.id || !emp.clienteNome) return null;

  // Criar pagamento padrão se não existir
  const pagamentoPadrao: Pagamento = {
    id: gerarIdUnico(),
    vendaId: emp.id,
    formaPagamento: 'dinheiro',
    valorTotal: emp.valorTotal || emp.valorSolicitado || 0,
    valorRecebido: 0,
    lancamentos: [],
    status: 'pendente'
  };

  return {
    id: emp.id,
    clienteNome: emp.clienteNome || 'Cliente',
    valorSolicitado: emp.valorSolicitado || 0,
    taxaJuros: emp.taxaJuros ?? 0.20,
    valorTotal: emp.valorTotal || (emp.valorSolicitado || 0) * 1.2,
    dataEmprestimo: emp.dataEmprestimo || new Date().toISOString().split('T')[0],
    dataVencimento: emp.dataVencimento || new Date().toISOString().split('T')[0],
    status: emp.status || 'pendente',
    pagamento: emp.pagamento && emp.pagamento.lancamentos ? emp.pagamento : pagamentoPadrao,
    observacoes: emp.observacoes,
    criadoEm: emp.criadoEm || new Date().toISOString()
  };
};

// Função para validar e migrar vendas antigas
const validarVenda = (venda: Partial<Venda>): Venda | null => {
  if (!venda || typeof venda !== 'object') return null;
  if (!venda.id) return null;

  // Criar pagamento padrão se não existir
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
    formaPagamento: venda.formaPagamento || 'dinheiro',
    numeroParcelas: venda.numeroParcelas || 1,
    status: venda.status || 'pendente',
    pagamento: venda.pagamento && venda.pagamento.lancamentos !== undefined ? venda.pagamento : pagamentoPadrao,
    observacoes: venda.observacoes,
    criadoEm: venda.criadoEm || new Date().toISOString()
  };
};

export function useDados() {
  const [produtosRaw, setProdutos] = useLocalStorage<Produto[]>('produtos', []);
  const [vendasRaw, setVendas] = useLocalStorage<Venda[]>('vendas', []);
  const [clientes, setClientes] = useLocalStorage<Cliente[]>('clientes', []);
  const [emprestimosRaw, setEmprestimos] = useLocalStorage<Emprestimo[]>('emprestimos', []);
  const [movimentacoesRaw, setMovimentacoes] = useLocalStorage<MovimentacaoCaixa[]>('caixa_movimentacoes', []);
  const [comprasRaw, setCompras] = useLocalStorage<Compra[]>('compras', []);
  const [metasRaw, setMetas] = useLocalStorage<MetaReinvestimento[]>('metas_reinvestimento', []);

  // Validar e filtrar dados corrompidos (memorizado para evitar loop infinito)
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
    Array.isArray(emprestimosRaw)
      ? emprestimosRaw.map(validarEmprestimo).filter((e): e is Emprestimo => e !== null)
      : [],
    [emprestimosRaw]
  );

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

  // Gerar ID único (usa função externa)
  const gerarId = gerarIdUnico;

  // PRODUTOS
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

  // Verificar estoque baixo (menos de 3 unidades)
  const getProdutosEstoqueBaixo = () => {
    return produtos.filter(p => p.quantidade <= 3);
  };

  // VENDAS
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
        observacao: 'Pagamento à vista (Criação)'
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

    // CONTROLE DE ESTOQUE: Diminuir quantidade dos produtos vendidos
    setProdutos(prev => prev.map(p => {
      const itemVenda = venda.itens.find(i => i.produtoId === p.id);
      if (itemVenda) {
        return { ...p, quantidade: Math.max(0, p.quantidade - itemVenda.quantidade) };
      }
      return p;
    }));

    // Atualizar ou criar cliente
    const clienteExistente = clientes.find(c => c.nome.toLowerCase() === venda.clienteNome.toLowerCase());
    if (clienteExistente) {
      setClientes(prev => prev.map(c => 
        c.id === clienteExistente.id 
          ? { 
              ...c, 
              totalCompras: c.totalCompras + 1, 
              valorTotalGasto: c.valorTotalGasto + venda.valorTotal,
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
        ultimaCompra: new Date().toISOString(),
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

  // EMPRESTIMOS
  const adicionarEmprestimo = (dados: Omit<Emprestimo, 'id' | 'criadoEm' | 'pagamento' | 'taxaJuros' | 'valorTotal'>) => {
    const id = gerarId();
    const taxaJuros = 0.20; // 20%
    const valorTotal = dados.valorSolicitado * (1 + taxaJuros);
    
    // Pagamento inicial zerado
    const pagamento: Pagamento = {
      id: gerarId(),
      vendaId: id, // Usando mesmo campo de link ID
      formaPagamento: 'dinheiro', // Default, mas irrelevante aqui
      valorTotal: valorTotal,
      valorRecebido: 0,
      lancamentos: [],
      status: 'pendente'
    };

    const novoEmprestimo: Emprestimo = {
      ...dados,
      id,
      taxaJuros,
      valorTotal,
      pagamento,
      criadoEm: new Date().toISOString(),
      status: 'pendente'
    };

    setEmprestimos(prev => [novoEmprestimo, ...prev]);
    return novoEmprestimo;
  };

  const registrarPagamentoEmprestimo = (emprestimoId: string, valor: number, data: string, observacao?: string) => {
    setEmprestimos(prev => prev.map(e => {
      if (e.id !== emprestimoId) return e;

      const novoPagamento = { ...e.pagamento };
      
      novoPagamento.lancamentos = [...novoPagamento.lancamentos, {
        id: gerarId(),
        valor,
        data,
        observacao
      }];
      
      novoPagamento.valorRecebido += valor;
      
      if (novoPagamento.valorRecebido >= novoPagamento.valorTotal - 0.01) {
        novoPagamento.status = 'pago';
        novoPagamento.valorRecebido = novoPagamento.valorTotal;
      }

      return { ...e, pagamento: novoPagamento, status: novoPagamento.status === 'pago' ? 'pago' : 'pendente' };
    }));
  };

  const removerEmprestimo = (id: string) => {
    setEmprestimos(prev => prev.filter(e => e.id !== id));
  };

  // PAGAMENTOS (Vendas)
  const registrarPagamento = (vendaId: string, valor: number, data: string, observacao?: string) => {
    setVendas(prev => prev.map(v => {
      if (v.id !== vendaId) return v;

      const novoPagamento = { ...v.pagamento };
      
      // Adicionar lançamento
      const novoLancamento = {
        id: gerarId(),
        valor,
        data,
        observacao
      };
      
      novoPagamento.lancamentos = [...(novoPagamento.lancamentos || []), novoLancamento];
      novoPagamento.valorRecebido += valor;

      // Atualizar Status Geral
      if (novoPagamento.valorRecebido >= novoPagamento.valorTotal - 0.01) { // margem de erro float
        novoPagamento.status = 'pago';
        novoPagamento.valorRecebido = novoPagamento.valorTotal; // Arredondar para evitar 99.999
      } else {
        novoPagamento.status = 'parcial';
      }

      // Atualizar Status das Parcelas (Lógica de Abatimento)
      if (novoPagamento.parcelas) {
        let valorParaAbater = novoPagamento.valorRecebido;
        
        novoPagamento.parcelas = novoPagamento.parcelas.map(p => {
          if (valorParaAbater >= p.valor - 0.01) {
            valorParaAbater -= p.valor;
            return { ...p, pago: true, dataPagamento: p.dataPagamento || data };
          } else {
            // Parcela não paga totalmente
            // Poderíamos marcar como parcial aqui, mas o tipo Parcela só tem boolean 'pago'.
            // Mantemos false, mas o sistema sabe que tem valor recebido geral.
            return { ...p, pago: false };
          }
        });
      }

      return { ...v, pagamento: novoPagamento, status: novoPagamento.status === 'pago' ? 'concluida' : 'pendente' };
    }));
  };

  // CONTAS A RECEBER - para lembretes
  const getContasAReceber = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return vendas
      .filter(v => v.pagamento.status !== 'pago' && v.status !== 'cancelada')
      .map(v => {
        // Verificar parcelas vencidas ou próximas
        const parcelasPendentes = v.pagamento.parcelas?.filter(p => !p.pago) || [];
        const parcelaMaisProxima = parcelasPendentes[0];
        
        return {
          vendaId: v.id,
          clienteNome: v.clienteNome,
          clienteContato: v.clienteContato,
          produtoNome: v.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(', '),
          valorPendente: v.pagamento.valorTotal - v.pagamento.valorRecebido,
          dataVencimento: parcelaMaisProxima?.dataVencimento,
          diasAtraso: parcelaMaisProxima ? Math.floor((new Date(hoje).getTime() - new Date(parcelaMaisProxima.dataVencimento).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          parcelaNumero: parcelaMaisProxima?.numero,
        };
      })
      .filter(c => c.valorPendente > 0)
      .sort((a, b) => (a.diasAtraso > b.diasAtraso ? -1 : 1)); // Mais atrasados primeiro
  };

  // CLIENTES
  const atualizarCliente = (id: string, dados: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c));
  };

  const removerCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  // CAIXA
  const adicionarMovimentacao = (dados: Omit<MovimentacaoCaixa, 'id' | 'criadoEm'>) => {
    const nova: MovimentacaoCaixa = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
    setMovimentacoes(prev => [nova, ...prev]);
    return nova;
  };

  const removerMovimentacao = (id: string) => {
    setMovimentacoes(prev => prev.filter(m => m.id !== id));
  };

  const getSaldoCaixa = () => {
    const saldoPix = movimentacoes
      .filter(m => m.canal === 'pix')
      .reduce((sum, m) => m.direcao === 'entrada' ? sum + m.valor : sum - m.valor, 0);
    const saldoDinheiro = movimentacoes
      .filter(m => m.canal === 'dinheiro')
      .reduce((sum, m) => m.direcao === 'entrada' ? sum + m.valor : sum - m.valor, 0);
    return { saldoPix, saldoDinheiro, saldoTotal: saldoPix + saldoDinheiro };
  };

  // COMPRAS
  const adicionarCompra = (dados: Omit<Compra, 'id' | 'criadoEm'>) => {
    const novaCompra: Compra = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() };
    setCompras(prev => [novaCompra, ...prev]);

    // Atualizar estoque dos produtos vinculados
    dados.itens.forEach(item => {
      if (item.produtoId) {
        setProdutos(prev => prev.map(p =>
          p.id === item.produtoId
            ? { ...p, quantidade: p.quantidade + item.quantidade }
            : p
        ));
      }
    });

    // Auto-criar saída no Caixa
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
    const movId = gerarId();
    setMovimentacoes(prev => [{ ...movSaida, id: movId, criadoEm: new Date().toISOString() }, ...prev]);

    return novaCompra;
  };

  const removerCompra = (id: string) => {
    setCompras(prev => prev.filter(c => c.id !== id));
    setMovimentacoes(prev => prev.filter(m => m.compraId !== id));
  };

  const getTotalInvestidoEstoque = () =>
    compras.reduce((sum, c) => sum + c.valorTotal, 0);

  // METAS DE REINVESTIMENTO
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
      .filter(v =>
        v.status !== 'cancelada' &&
        v.dataVenda >= meta.periodoInicio &&
        v.dataVenda <= meta.periodoFim
      )
      .reduce((sum, v) => sum + v.valorTotal, 0);

    const valorMeta = receitaPeriodo * (meta.percentualMeta / 100);

    const reinvestidoPeriodo = compras
      .filter(c => c.data >= meta.periodoInicio && c.data <= meta.periodoFim)
      .reduce((sum, c) => sum + c.valorTotal, 0);

    const percentualRealizado = valorMeta > 0
      ? Math.min(100, (reinvestidoPeriodo / valorMeta) * 100)
      : 0;

    return {
      receitaPeriodo,
      valorMeta,
      reinvestidoPeriodo,
      percentualRealizado,
      atingida: reinvestidoPeriodo >= valorMeta,
      faltando: Math.max(0, valorMeta - reinvestidoPeriodo),
    };
  };

  // LIMPEZA DE DADOS
  const limparDados = () => {
    localStorage.removeItem('sge_produtos');
    localStorage.removeItem('sge_vendas');
    localStorage.removeItem('sge_clientes');
    localStorage.removeItem('sge_emprestimos');
    // Para compatibilidade
    localStorage.removeItem('produtos');
    localStorage.removeItem('vendas');
    localStorage.removeItem('clientes');
    localStorage.removeItem('emprestimos');
    localStorage.removeItem('caixa_movimentacoes');
    localStorage.removeItem('compras');
    localStorage.removeItem('metas_reinvestimento');

    setProdutos([]);
    setVendas([]);
    setClientes([]);
    setEmprestimos([]);
    setMovimentacoes([]);
    setCompras([]);
    setMetas([]);
    window.location.reload();
  };

  return {
    // Dados
    produtos,
    vendas,
    clientes,
    emprestimos,
    // Produtos
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    getProdutoById,
    getProdutosEstoqueBaixo,
    // Vendas
    adicionarVenda,
    atualizarVenda,
    removerVenda,
    getVendaById,
    // Pagamentos
    registrarPagamento,
    getContasAReceber,
    // Emprestimos
    adicionarEmprestimo,
    registrarPagamentoEmprestimo,
    removerEmprestimo,
    // Clientes
    atualizarCliente,
    removerCliente,
    // Caixa
    movimentacoes,
    adicionarMovimentacao,
    removerMovimentacao,
    getSaldoCaixa,
    // Compras
    compras,
    adicionarCompra,
    removerCompra,
    getTotalInvestidoEstoque,
    // Metas de Reinvestimento
    metas,
    adicionarMeta,
    removerMeta,
    getMetaAtiva,
    getProgressoMeta,
    // Sistema
    limparDados
  };
}
