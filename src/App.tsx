import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { useDados } from '@/hooks/useDados';
import { Dashboard } from '@/sections/Dashboard';
import { Produtos } from '@/sections/Produtos';
import { Vendas } from '@/sections/Vendas';
import { Recibo } from '@/sections/Recibo';
import { Relatorios } from '@/sections/Relatorios';
import { ExportarDados } from '@/components/ExportarDados';
import { LembretesContas } from '@/components/LembretesContas';
import { AlertaEstoque } from '@/components/AlertaEstoque';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Receipt, HandCoins, Wallet, ShoppingBag, Target } from 'lucide-react';
import type { Venda } from '@/types';
import { Emprestimos } from '@/sections/Emprestimos';
import { Caixa } from '@/sections/Caixa';
import { Compras } from '@/sections/Compras';
import { MetaReinvestimento } from '@/sections/MetaReinvestimento';

function App() {
  const {
    produtos,
    vendas,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    adicionarVenda,
    registrarPagamento,
    getProdutosEstoqueBaixo,
    getContasAReceber,
    emprestimos,
    adicionarEmprestimo,
    registrarPagamentoEmprestimo,
    movimentacoes,
    adicionarMovimentacao,
    removerMovimentacao,
    getSaldoCaixa,
    compras,
    adicionarCompra,
    removerCompra,
    getTotalInvestidoEstoque,
    metas,
    adicionarMeta,
    removerMeta,
    getMetaAtiva,
    getProgressoMeta,
  } = useDados();

  const [reciboVenda, setReciboVenda] = useState<Venda | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  const handleAdicionarProduto = (produto: Parameters<typeof adicionarProduto>[0]) => {
    adicionarProduto(produto);
    toast.success('Produto cadastrado com sucesso!');
  };

  const handleAdicionarVenda = (venda: Parameters<typeof adicionarVenda>[0]) => {
    // Validar estoque
    for (const item of venda.itens) {
      const produto = produtos.find(p => p.id === item.produtoId);
      if (!produto) continue;
      if (produto.quantidade < item.quantidade) {
        toast.error(`Estoque insuficiente para ${produto.nome}! Apenas ${produto.quantidade} unidades.`);
        return;
      }
    }

    adicionarVenda(venda);
    toast.success('Venda registrada com sucesso! Estoque atualizado.');
  };

  const handleRegistrarPagamento = (vendaId: string, valor: number, data: string, obs?: string) => {
    registrarPagamento(vendaId, valor, data, obs);
    toast.success('Pagamento registrado com sucesso!');
  };

  const handleAdicionarEmprestimo = (dados: Parameters<typeof adicionarEmprestimo>[0]) => {
    adicionarEmprestimo(dados);
    toast.success('Empréstimo registrado com sucesso!');
  };

  const handlePagamentoEmprestimo = (id: string, valor: number, data: string, obs?: string) => {
    registrarPagamentoEmprestimo(id, valor, data, obs);
    toast.success('Baixa registrada com sucesso!');
  };

  const handleAdicionarMovimentacao = (dados: Parameters<typeof adicionarMovimentacao>[0]) => {
    adicionarMovimentacao(dados);
    toast.success('Movimentação registrada!');
  };

  const handleAdicionarCompra = (dados: Parameters<typeof adicionarCompra>[0]) => {
    adicionarCompra(dados);
    toast.success('Compra registrada! Estoque e caixa atualizados.');
  };

  const handleAdicionarMeta = (dados: Parameters<typeof adicionarMeta>[0]) => {
    adicionarMeta(dados);
    toast.success('Meta de reinvestimento definida!');
  };

  const handleVerRecibo = (venda: Venda) => {
    setReciboVenda(venda);
  };



  const produtosEstoqueBaixo = getProdutosEstoqueBaixo();
  const contasAReceber = getContasAReceber();

  return (
    <div className="min-h-screen bg-gray-100 min-h-[100dvh]">
      <Toaster position="top-center" richColors />
      
      {/* Header - compacto no mobile */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-lg shrink-0">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Gestão de Vendas Pro</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sistema de controle comercial</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <ExportarDados produtos={produtos} vendas={vendas} />
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-500">Total em Vendas</p>
                <p className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => sum + v.valorTotal, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Alertas */}
      {(produtosEstoqueBaixo.length > 0 || contasAReceber.length > 0) && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <AlertaEstoque produtos={produtos} />
            <LembretesContas vendas={vendas} onRegistrarPagamento={handleRegistrarPagamento} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4 sm:space-y-6">
          <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full bg-white p-1.5 rounded-xl shadow-sm h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 min-h-[52px] rounded-lg w-full">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 min-h-[52px] rounded-lg w-full">
              <Package className="h-4 w-4 shrink-0" />
              <span>Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700 min-h-[52px] rounded-lg w-full">
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <span>Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="compras" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700 min-h-[52px] rounded-lg w-full">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>Compras</span>
            </TabsTrigger>
            <TabsTrigger value="caixa" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700 min-h-[52px] rounded-lg w-full">
              <Wallet className="h-4 w-4 shrink-0" />
              <span>Caixa</span>
            </TabsTrigger>
            <TabsTrigger value="metas" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 min-h-[52px] rounded-lg w-full">
              <Target className="h-4 w-4 shrink-0" />
              <span>Metas</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 min-h-[52px] rounded-lg w-full">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="emprestimos" className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] sm:text-xs data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 min-h-[52px] rounded-lg w-full">
              <HandCoins className="h-4 w-4 shrink-0" />
              <span>Emprést.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard produtos={produtos} vendas={vendas} emprestimos={emprestimos} />
          </TabsContent>

          <TabsContent value="produtos" className="mt-6">
            <Produtos 
              produtos={produtos}
              onAdicionar={handleAdicionarProduto}
              onAtualizar={atualizarProduto}
              onRemover={removerProduto}
            />
          </TabsContent>

          <TabsContent value="vendas" className="mt-6">
            <Vendas 
              produtos={produtos}
              vendas={vendas}
              onAdicionar={handleAdicionarVenda}
              onRegistrarPagamento={handleRegistrarPagamento}
              onVerRecibo={handleVerRecibo}
            />
          </TabsContent>

          <TabsContent value="compras" className="mt-6">
            <Compras
              compras={compras}
              produtos={produtos}
              onAdicionar={handleAdicionarCompra}
              onRemover={removerCompra}
              getTotalInvestidoEstoque={getTotalInvestidoEstoque}
            />
          </TabsContent>

          <TabsContent value="caixa" className="mt-6">
            <Caixa
              movimentacoes={movimentacoes}
              vendas={vendas}
              onAdicionar={handleAdicionarMovimentacao}
              onRemover={removerMovimentacao}
              getSaldoCaixa={getSaldoCaixa}
            />
          </TabsContent>

          <TabsContent value="metas" className="mt-6">
            <MetaReinvestimento
              metas={metas}
              vendas={vendas}
              compras={compras}
              onAdicionar={handleAdicionarMeta}
              onRemover={removerMeta}
              getMetaAtiva={getMetaAtiva}
              getProgressoMeta={getProgressoMeta}
            />
          </TabsContent>

          <TabsContent value="relatorios" className="mt-6">
            <Relatorios produtos={produtos} vendas={vendas} />
          </TabsContent>

          <TabsContent value="emprestimos" className="mt-6">
            <Emprestimos 
              emprestimos={emprestimos}
              onAdicionar={handleAdicionarEmprestimo}
              onRegistrarPagamento={handlePagamentoEmprestimo}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Recibo Modal */}
      <Recibo 
        venda={reciboVenda}
        aberto={!!reciboVenda}
        onFechar={() => setReciboVenda(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left">
            <p className="text-xs sm:text-sm text-gray-500">
              © 2024 Gestão de Vendas Pro. Seu negócio em crescimento.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{produtos.length} produtos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{vendas.filter(v => v.status !== 'cancelada').length} vendas</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
