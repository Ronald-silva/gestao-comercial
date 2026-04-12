import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useDados } from '@/hooks/useDados';
import { Dashboard } from '@/sections/Dashboard';
import { Produtos } from '@/sections/Produtos';
import { Vendas } from '@/sections/Vendas';
import { Recibo } from '@/sections/Recibo';
import { Relatorios } from '@/sections/Relatorios';
import { Clientes } from '@/sections/Clientes';
import { Emprestimos } from '@/sections/Emprestimos';
import { Caixa } from '@/sections/Caixa';
import { Compras } from '@/sections/Compras';
import { MetaReinvestimento } from '@/sections/MetaReinvestimento';
import { ExportarDados } from '@/components/ExportarDados';
import { AlertaEstoque } from '@/components/AlertaEstoque';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from '@/sections/Login';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Users, HandCoins, Wallet, ShoppingBag, Target,
  TrendingUp,
} from 'lucide-react';
import type { Venda } from '@/types';

const tabs = [
  { id: 'dashboard',   label: 'Dashboard',  icon: LayoutDashboard, cor: 'amber' },
  { id: 'vendas',      label: 'Vendas',      icon: ShoppingCart,    cor: 'green' },
  { id: 'clientes',    label: 'Clientes',    icon: Users,           cor: 'blue' },
  { id: 'produtos',    label: 'Produtos',    icon: Package,         cor: 'purple' },
  { id: 'compras',     label: 'Compras',     icon: ShoppingBag,     cor: 'cyan' },
  { id: 'credito',     label: 'Crédito',     icon: HandCoins,       cor: 'rose' },
  { id: 'caixa',       label: 'Caixa',       icon: Wallet,          cor: 'teal' },
  { id: 'metas',       label: 'Metas',       icon: Target,          cor: 'violet' },
  { id: 'relatorios',  label: 'Relatórios',  icon: BarChart3,       cor: 'orange' },
];

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  
  const {
    produtos, vendas, clientes, emprestimos,
    adicionarProduto, atualizarProduto, removerProduto,
    adicionarVenda, registrarPagamento,
    getProdutosEstoqueBaixo,
    adicionarEmprestimo, registrarPagamentoEmprestimo,
    movimentacoes, adicionarMovimentacao, removerMovimentacao, getSaldoCaixa,
    compras, adicionarCompra, removerCompra, getTotalInvestidoEstoque,
    metas, adicionarMeta, removerMeta, getMetaAtiva, getProgressoMeta,
    getCapitalDisponivel, getCapitalTravado,
    atualizarCliente, removerCliente,
    limparDados,
  } = useDados();

  const [reciboVenda, setReciboVenda] = useState<Venda | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  // ── Handlers ──────────────────────────────────────────
  const handleAdicionarProduto = (produto: Parameters<typeof adicionarProduto>[0]) => {
    adicionarProduto(produto);
    toast.success('Produto cadastrado!', { description: `${produto.nome} adicionado ao estoque` });
  };

  const handleAdicionarVenda = (venda: Parameters<typeof adicionarVenda>[0]) => {
    for (const item of venda.itens) {
      const produto = produtos.find(p => p.id === item.produtoId);
      if (!produto) continue;
      if (produto.quantidade < item.quantidade) {
        toast.error('Estoque insuficiente!', {
          description: `Apenas ${produto.quantidade} unidades de ${produto.nome}`
        });
        return;
      }
    }
    adicionarVenda(venda);
    toast.success('Venda registrada!', { description: 'Estoque atualizado automaticamente' });
  };

  const handleRegistrarPagamento = (vendaId: string, valor: number, data: string, obs?: string) => {
    registrarPagamento(vendaId, valor, data, obs);
    toast.success('Pagamento registrado!', { description: 'Capital atualizado' });
  };

  const handleAdicionarEmprestimo = (dados: Parameters<typeof adicionarEmprestimo>[0]) => {
    adicionarEmprestimo(dados);
    toast.success('Crédito concedido!', { description: `Para ${dados.clienteNome}` });
  };

  const handlePagamentoCredito = (id: string, valor: number, data: string, obs?: string) => {
    registrarPagamentoEmprestimo(id, valor, data, obs);
    toast.success('Recebimento registrado!', { description: 'Capital atualizado' });
  };

  const handleAdicionarMovimentacao = (dados: Parameters<typeof adicionarMovimentacao>[0]) => {
    adicionarMovimentacao(dados);
    toast.success('Movimentação registrada!');
  };

  const handleAdicionarCompra = (dados: Parameters<typeof adicionarCompra>[0]) => {
    adicionarCompra(dados);
    toast.success('Compra registrada!', { description: 'Estoque e caixa atualizados' });
  };

  const handleAdicionarMeta = (dados: Parameters<typeof adicionarMeta>[0]) => {
    adicionarMeta(dados);
    toast.success('Meta definida!');
  };

  // ── Derived ────────────────────────────────────────────
  const produtosEstoqueBaixo = getProdutosEstoqueBaixo();
  const capitalDisponivel = getCapitalDisponivel();
  const capitalTravado = getCapitalTravado();

  const formatarMoeda = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  // ── Auth Gates ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(220, 20%, 4%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#10b981] border-t-transparent animate-spin" />
          <p className="text-sm font-mono text-[#8b92a5] animate-pulse">Sincronizando Cofre...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ background: 'hsl(220, 20%, 4%)' }}>
      <Toaster
        position="top-center"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: 'hsl(220, 18%, 10%)',
            border: '1px solid hsl(220, 15%, 18%)',
            color: 'hsl(210, 20%, 94%)',
          }
        }}
      />

      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 safe-area-inset-top border-b" style={{ 
        background: 'hsl(220, 20%, 4%)',
        borderColor: 'hsl(220, 15%, 14%)',
      }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{
                background: 'linear-gradient(135deg, hsl(38, 95%, 54%), hsl(38, 95%, 38%))',
              }}>
                <TrendingUp className="h-4 w-4 text-black" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold leading-none" style={{ color: 'hsl(210, 20%, 94%)' }}>
                  Gestão de Vendas <span style={{ color: 'hsl(38, 95%, 54%)' }}>Pro</span>
                </h1>
                <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'hsl(215, 15%, 50%)' }}>
                  Capital de giro
                </p>
              </div>
            </div>

            {/* Capital status — visible no header */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 45%)' }}>Disponível</p>
                <p className="text-financial-md font-mono glow-green">{formatarMoeda(capitalDisponivel)}</p>
              </div>
              <div className="w-px h-8" style={{ background: 'hsl(220, 15%, 14%)' }} />
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 45%)' }}>Travado</p>
                <p className="text-financial-md font-mono glow-red">{formatarMoeda(capitalTravado)}</p>
              </div>
              <div className="w-px h-8" style={{ background: 'hsl(220, 15%, 14%)' }} />
              <ExportarDados produtos={produtos} vendas={vendas} />
            </div>

            {/* Mobile: apenas export */}
            <div className="flex items-center gap-2 md:hidden">
              <ExportarDados produtos={produtos} vendas={vendas} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Navigation Tabs ─────────────────────────────── */}
      <div className="sticky z-20 border-b" style={{ 
        top: '56px', 
        background: 'hsl(220, 18%, 6%)',
        borderColor: 'hsl(220, 15%, 12%)',
      }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <div className="flex overflow-x-auto gap-0.5 py-1.5 scroll-touch" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = abaAtiva === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className="nav-tab shrink-0 min-w-[58px] sm:min-w-[72px]"
                  data-state={isActive ? 'active' : 'inactive'}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Alerta estoque baixo — dentro do fluxo normal do conteúdo */}
        {produtosEstoqueBaixo.length > 0 && (
          <div className="mb-4">
            <AlertaEstoque produtos={produtos} />
          </div>
        )}
        <div className="animate-slide-up">
          {abaAtiva === 'dashboard' && (
            <Dashboard produtos={produtos} vendas={vendas} emprestimos={emprestimos} onNavigate={setAbaAtiva} />
          )}
          {abaAtiva === 'vendas' && (
            <Vendas
              produtos={produtos}
              vendas={vendas}
              onAdicionar={handleAdicionarVenda}
              onAdicionarEmprestimo={handleAdicionarEmprestimo}
              onRegistrarPagamento={handleRegistrarPagamento}
              onVerRecibo={setReciboVenda}
            />
          )}
          {abaAtiva === 'clientes' && (
            <Clientes
              clientes={clientes}
              vendas={vendas}
              onAtualizar={atualizarCliente}
              onRemover={removerCliente}
              onNavigate={setAbaAtiva}
            />
          )}
          {abaAtiva === 'produtos' && (
            <Produtos
              produtos={produtos}
              onAdicionar={handleAdicionarProduto}
              onAtualizar={atualizarProduto}
              onRemover={removerProduto}
            />
          )}
          {abaAtiva === 'compras' && (
            <Compras
              compras={compras}
              produtos={produtos}
              onAdicionar={handleAdicionarCompra}
              onRemover={removerCompra}
              getTotalInvestidoEstoque={getTotalInvestidoEstoque}
            />
          )}
          {abaAtiva === 'credito' && (
            <Emprestimos
              emprestimos={emprestimos}
              onAdicionar={handleAdicionarEmprestimo}
              onRegistrarPagamento={handlePagamentoCredito}
            />
          )}
          {abaAtiva === 'caixa' && (
            <Caixa
              movimentacoes={movimentacoes}
              vendas={vendas}
              onAdicionar={handleAdicionarMovimentacao}
              onRemover={removerMovimentacao}
              getSaldoCaixa={getSaldoCaixa}
            />
          )}
          {abaAtiva === 'metas' && (
            <MetaReinvestimento
              metas={metas}
              vendas={vendas}
              compras={compras}
              onAdicionar={handleAdicionarMeta}
              onRemover={removerMeta}
              getMetaAtiva={getMetaAtiva}
              getProgressoMeta={getProgressoMeta}
            />
          )}
          {abaAtiva === 'relatorios' && (
            <Relatorios produtos={produtos} vendas={vendas} />
          )}
        </div>
      </main>

      {/* ── Recibo Modal ─────────────────────────────────── */}
      <Recibo
        venda={reciboVenda}
        aberto={!!reciboVenda}
        onFechar={() => setReciboVenda(null)}
      />

      {/* ── Footer minimal ──────────────────────────────── */}
      <footer className="border-t mt-8" style={{ borderColor: 'hsl(220, 15%, 12%)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-xs font-mono" style={{ color: 'hsl(215, 15%, 40%)' }}>
              Gestão de Vendas Pro © 2024
            </p>
            <div className="flex gap-4">
              <span className="text-xs font-mono" style={{ color: 'hsl(215, 15%, 40%)' }}>
                <span style={{ color: 'hsl(38, 95%, 54%)' }}>{produtos.length}</span> produtos
              </span>
              <span className="text-xs font-mono" style={{ color: 'hsl(215, 15%, 40%)' }}>
                <span style={{ color: 'hsl(38, 95%, 54%)' }}>{vendas.filter(v => v.status !== 'cancelada').length}</span> vendas
              </span>
              <button
                onClick={limparDados}
                className="text-xs font-mono hover:underline"
                style={{ color: 'hsl(352, 100%, 62% / 0.5)' }}
              >
                resetar dados
              </button>
              <span className="text-xs font-mono" style={{ color: 'hsl(215, 15%, 20%)' }}>|</span>
              <button
                onClick={logout}
                className="text-xs font-mono hover:text-white transition-colors"
                style={{ color: 'hsl(215, 15%, 40%)' }}
              >
                sair da conta
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
