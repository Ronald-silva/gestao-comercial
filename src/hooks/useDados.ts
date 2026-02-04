import { useLocalStorage } from './useStorage';
import type { Produto, Venda, Cliente, StatusPagamento } from '@/types';

export function useDados() {
  const [produtos, setProdutos] = useLocalStorage<Produto[]>('produtos', []);
  const [vendas, setVendas] = useLocalStorage<Venda[]>('vendas', []);
  const [clientes, setClientes] = useLocalStorage<Cliente[]>('clientes', []);

  // Gerar ID único
  const gerarId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

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
      status: (venda.formaPagamento === 'dinheiro' || venda.formaPagamento === 'pix' ? 'pago' : 'pendente') as StatusPagamento,
    };

    const novaVenda: Venda = {
      ...venda,
      id,
      pagamento,
      criadoEm: new Date().toISOString(),
    };

    setVendas(prev => [novaVenda, ...prev]);

    // CONTROLE DE ESTOQUE: Diminuir quantidade do produto vendido
    setProdutos(prev => prev.map(p => 
      p.id === venda.produtoId 
        ? { ...p, quantidade: Math.max(0, p.quantidade - venda.quantidade) }
        : p
    ));

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

  // PAGAMENTOS
  const registrarPagamento = (vendaId: string, parcelaNumero?: number) => {
    setVendas(prev => prev.map(v => {
      if (v.id !== vendaId) return v;

      const novoPagamento = { ...v.pagamento };
      
      if (parcelaNumero !== undefined && novoPagamento.parcelas) {
        novoPagamento.parcelas = novoPagamento.parcelas.map(p => 
          p.numero === parcelaNumero 
            ? { ...p, pago: true, dataPagamento: new Date().toISOString().split('T')[0] }
            : p
        );
        const totalRecebido = novoPagamento.parcelas.filter(p => p.pago).reduce((sum, p) => sum + p.valor, 0);
        novoPagamento.valorRecebido = totalRecebido;
        novoPagamento.status = totalRecebido >= novoPagamento.valorTotal ? 'pago' : 'parcial';
      } else {
        novoPagamento.valorRecebido = novoPagamento.valorTotal;
        novoPagamento.status = 'pago';
        if (novoPagamento.parcelas) {
          novoPagamento.parcelas = novoPagamento.parcelas.map(p => ({ 
            ...p, 
            pago: true, 
            dataPagamento: new Date().toISOString().split('T')[0] 
          }));
        }
      }

      return { ...v, pagamento: novoPagamento, status: novoPagamento.status === 'pago' ? 'concluida' : v.status };
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
          produtoNome: v.produtoNome,
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

  return {
    // Dados
    produtos,
    vendas,
    clientes,
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
    // Clientes
    atualizarCliente,
    removerCliente,
  };
}
