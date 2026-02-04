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
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Receipt, HandCoins } from 'lucide-react';
import type { Venda } from '@/types';
import { Emprestimos } from '@/sections/Emprestimos';

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
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-white p-1.5 sm:p-1 rounded-xl shadow-sm h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 min-h-[44px]">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 min-h-[44px]">
              <Package className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-700 min-h-[44px]">
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 min-h-[44px]">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="emprestimos" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 min-h-[44px]">
              <HandCoins className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Empréstimos</span>
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
