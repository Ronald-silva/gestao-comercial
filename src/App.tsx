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
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Receipt } from 'lucide-react';
import type { Venda } from '@/types';

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
  } = useDados();

  const [reciboVenda, setReciboVenda] = useState<Venda | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  const handleAdicionarProduto = (produto: Parameters<typeof adicionarProduto>[0]) => {
    adicionarProduto(produto);
    toast.success('Produto cadastrado com sucesso!');
  };

  const handleAdicionarVenda = (venda: Parameters<typeof adicionarVenda>[0]) => {
    const produto = produtos.find(p => p.id === venda.produtoId);
    if (produto && produto.quantidade < venda.quantidade) {
      toast.error(`Estoque insuficiente! Apenas ${produto.quantidade} unidades disponíveis.`);
      return;
    }
    adicionarVenda(venda);
    toast.success('Venda registrada com sucesso! Estoque atualizado.');
  };

  const handleRegistrarPagamento = (vendaId: string, parcelaNumero?: number) => {
    registrarPagamento(vendaId, parcelaNumero);
    toast.success(parcelaNumero ? 'Parcela recebida!' : 'Pagamento registrado!');
  };

  const handleVerRecibo = (venda: Venda) => {
    setReciboVenda(venda);
  };

  const produtoDoRecibo = reciboVenda 
    ? produtos.find(p => p.id === reciboVenda.produtoId) 
    : null;

  const produtosEstoqueBaixo = getProdutosEstoqueBaixo();
  const contasAReceber = getContasAReceber();

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestão de Vendas Pro</h1>
                <p className="text-xs text-gray-500">Sistema de controle comercial</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AlertaEstoque produtos={produtos} />
            <LembretesContas vendas={vendas} onRegistrarPagamento={handleRegistrarPagamento} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard produtos={produtos} vendas={vendas} />
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
        </Tabs>
      </main>

      {/* Recibo Modal */}
      <Recibo 
        venda={reciboVenda}
        produto={produtoDoRecibo || null}
        aberto={!!reciboVenda}
        onFechar={() => setReciboVenda(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2024 Gestão de Vendas Pro. Seu negócio em crescimento.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
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
