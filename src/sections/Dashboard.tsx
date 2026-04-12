import { useMemo } from 'react';
import { useDados } from '@/hooks/useDados';
import {
  TrendingUp, Lock, DollarSign, Zap, Clock,
  AlertTriangle, AlertCircle, CheckCircle2, ArrowRight,
  Package, Users, BarChart2, RefreshCw, Archive, Wallet,
  ChevronRight,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/utils';
import type { Produto, Venda, CreditoCliente } from '@/types';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell,
} from 'recharts';

interface DashboardProps {
  produtos: Produto[];
  vendas: Venda[];
  emprestimos: CreditoCliente[];
  onNavigate: (tab: string) => void;
}

const GREEN = 'hsl(152, 100%, 41%)';
const RED   = 'hsl(352, 100%, 62%)';
const AMBER = 'hsl(38, 95%, 54%)';
const BLUE  = 'hsl(217, 91%, 60%)';


// ── Tooltip customizado dark ──────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(220, 18%, 10%)',
      border: '1px solid hsl(220, 15%, 18%)',
      borderRadius: 8,
      padding: '8px 12px',
    }}>
      {label && <p style={{ color: 'hsl(215, 15%, 55%)', fontSize: 11, marginBottom: 4 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || AMBER, fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
          {typeof p.value === 'number' ? formatarMoeda(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export function Dashboard({ produtos, vendas, emprestimos, onNavigate }: DashboardProps) {
  const {
    getCapitalDisponivel, getCapitalTravado, getGiroCapital,
    getTempoMedioRetorno, getLucroTotal, getAlertas,
    getCCC, getDSO, getDIO, getValorEstoque, getCaixaRealDisponivel,
    getRecomendacoes,
  } = useDados();

  const dados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const vendasConcluidas = vendas.filter(v => v.status !== 'cancelada');
    const vendasMes = vendasConcluidas.filter(v => new Date(v.dataVenda) >= inicioMes);

    const totalVendas = vendasConcluidas.reduce((s, v) => s + v.valorTotal, 0);
    const totalRecebido = vendasConcluidas.reduce((s, v) => s + v.pagamento.valorRecebido, 0);

    const capitalDisponivel = getCapitalDisponivel();
    const capitalTravado = getCapitalTravado();
    const giroCapital = getGiroCapital();
    const tempoRetorno = getTempoMedioRetorno();
    const { lucro, margem } = getLucroTotal();
    const alertas = getAlertas();

    // Gráfico: evolução dos últimos 7 dias
    const evolucao = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const vendasDia = vendasConcluidas.filter(v => {
        const dv = new Date(v.dataVenda);
        return dv.toDateString() === d.toDateString();
      });
      const recebidoDia = vendasDia.reduce((s, v) => s + v.pagamento.valorRecebido, 0);
      evolucao.push({
        dia: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        recebido: recebidoDia,
        vendas: vendasDia.reduce((s, v) => s + v.valorTotal, 0),
      });
    }

    // Gráfico: distribuição de capital
    const distribuicaoCapital = totalVendas > 0 ? [
      { name: 'Disponível', value: capitalDisponivel },
      { name: 'Travado', value: capitalTravado },
    ] : [];

    // Top 5 produtos por lucro
    const produtoMap: Record<string, { nome: string; lucro: number; qtd: number }> = {};
    vendasConcluidas.forEach(v => {
      v.itens.forEach(item => {
        const prod = produtos.find(p => p.id === item.produtoId);
        const lucroItem = prod ? (item.precoUnitario - prod.precoCusto) * item.quantidade : 0;
        if (!produtoMap[item.produtoId]) {
          produtoMap[item.produtoId] = { nome: item.produtoNome, lucro: 0, qtd: 0 };
        }
        produtoMap[item.produtoId].lucro += lucroItem;
        produtoMap[item.produtoId].qtd += item.quantidade;
      });
    });
    const topProdutos = Object.values(produtoMap)
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 5)
      .map(p => ({ ...p, lucro: Math.round(p.lucro) }));

    // Vendas pendentes ordenadas por valor
    const vendasPendentes = vendasConcluidas
      .filter(v => v.pagamento.status !== 'pago')
      .sort((a, b) => (b.pagamento.valorTotal - b.pagamento.valorRecebido) - (a.pagamento.valorTotal - a.pagamento.valorRecebido))
      .slice(0, 5);

    // Clientes com dívida
    const devedores: Record<string, number> = {};
    vendasConcluidas.filter(v => v.pagamento.status !== 'pago').forEach(v => {
      const pendente = v.pagamento.valorTotal - v.pagamento.valorRecebido;
      devedores[v.clienteNome] = (devedores[v.clienteNome] || 0) + pendente;
    });
    const topDevedores = Object.entries(devedores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    const ccc = getCCC();
    const dso = getDSO();
    const dio = getDIO();
    const estoque = getValorEstoque();
    const caixaReal = getCaixaRealDisponivel();
    const recomendacoes = getRecomendacoes();

    return {
      capitalDisponivel, capitalTravado, giroCapital, tempoRetorno,
      lucro, margem, alertas, evolucao, distribuicaoCapital,
      topProdutos, vendasPendentes, topDevedores,
      vendasMes: vendasMes.reduce((s, v) => s + v.valorTotal, 0),
      qtdVendasMes: vendasMes.length,
      totalVendas, totalRecebido,
      pctRecebido: totalVendas > 0 ? (totalRecebido / totalVendas) * 100 : 0,
      ccc, dso, dio, estoque, caixaReal, recomendacoes,
    };
  }, [produtos, vendas, emprestimos, getCapitalDisponivel, getCapitalTravado, getGiroCapital, getTempoMedioRetorno, getLucroTotal, getAlertas, getCCC, getDSO, getDIO, getValorEstoque, getCaixaRealDisponivel, getRecomendacoes]);

  const alertaIcon = (urgencia: string) => {
    if (urgencia === 'alta') return <AlertCircle className="h-4 w-4 shrink-0" style={{ color: RED }} />;
    if (urgencia === 'media') return <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: AMBER }} />;
    return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: GREEN }} />;
  };

  const tabDeAcao: Record<string, string> = {
    'Ir para Vendas': 'vendas',
    'Ver Clientes': 'clientes',
    'Ver Créditos': 'credito',
    'Registrar Compra': 'compras',
  };

  return (
    <div className="space-y-5">

      {/* ══ HERO KPIs ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Capital Disponível */}
        <div className="kpi-card kpi-card-green p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'hsl(215, 15%, 50%)' }}>
                Capital Disponível
              </p>
              <p className="text-[10px]" style={{ color: GREEN, opacity: 0.8 }}>Livre para reinvestir</p>
            </div>
            <div className="p-2 rounded-lg" style={{ background: `${GREEN}15` }}>
              <DollarSign className="h-5 w-5" style={{ color: GREEN }} />
            </div>
          </div>
          <p className="text-financial-xl glow-green animate-count">
            {formatarMoeda(dados.capitalDisponivel)}
          </p>
          <div className="mt-3 progress-dark">
            <div
              className="progress-fill-green"
              style={{ width: `${dados.pctRecebido}%` }}
            />
          </div>
          <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
            {dados.pctRecebido.toFixed(0)}% das vendas recebido
          </p>
        </div>

        {/* Capital Travado */}
        <div className="kpi-card kpi-card-red p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'hsl(215, 15%, 50%)' }}>
                Capital Travado
              </p>
              <p className="text-[10px]" style={{ color: RED, opacity: 0.8 }}>Aguardando pagamento</p>
            </div>
            <div className="p-2 rounded-lg" style={{ background: `${RED}15` }}>
              <Lock className="h-5 w-5" style={{ color: RED }} />
            </div>
          </div>
          <p className="text-financial-xl glow-red animate-count">
            {formatarMoeda(dados.capitalTravado)}
          </p>
          <div className="mt-3">
            <p className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
              {dados.vendasPendentes.length} venda{dados.vendasPendentes.length !== 1 ? 's' : ''} pendente{dados.vendasPendentes.length !== 1 ? 's' : ''}
            </p>
          </div>
          {dados.capitalTravado > 0 && (
            <button
              onClick={() => onNavigate('vendas')}
              className="mt-2 text-[10px] font-medium flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: RED }}
            >
              Cobrar agora <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Lucro Total */}
        <div className="kpi-card kpi-card-amber p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'hsl(215, 15%, 50%)' }}>
                Lucro Total
              </p>
              <p className="text-[10px]" style={{ color: AMBER, opacity: 0.8 }}>
                {dados.margem.toFixed(1)}% de margem
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ background: `${AMBER}15` }}>
              <TrendingUp className="h-5 w-5" style={{ color: AMBER }} />
            </div>
          </div>
          <p className="text-financial-xl glow-amber animate-count">
            {formatarMoeda(dados.lucro)}
          </p>
          <div className="mt-3">
            <p className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
              {dados.qtdVendasMes} vendas este mês · {formatarMoeda(dados.vendasMes)}
            </p>
          </div>
        </div>
      </div>

      {/* ══ VELOCIDADE DO CAPITAL ══════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">

        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4" style={{ color: AMBER }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Giro de Capital
            </p>
          </div>
          <p className="text-financial-xl glow-amber">
            {dados.giroCapital > 0 ? `${dados.giroCapital.toFixed(1)}x` : '—'}
          </p>
          <p className="text-[10px] mt-1 font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
            vezes que o dinheiro girou
          </p>
          <div className="mt-2 p-2 rounded-md" style={{ background: 'hsl(220, 15%, 9%)' }}>
            <p className="text-[10px]" style={{ color: 'hsl(215, 15%, 45%)' }}>
              {dados.giroCapital >= 3 ? '🟢 Excelente velocidade' :
               dados.giroCapital >= 1.5 ? '🟡 Bom ritmo de giro' :
               dados.giroCapital > 0 ? '🔴 Giro lento — compre mais' : '— Registre compras'}
            </p>
          </div>
        </div>

        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" style={{ color: BLUE }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Tempo de Retorno
            </p>
          </div>
          <p className="text-financial-xl" style={{ color: BLUE, textShadow: `0 0 20px ${BLUE}40` }}>
            {dados.tempoRetorno > 0 ? `${dados.tempoRetorno}d` : '—'}
          </p>
          <p className="text-[10px] mt-1 font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
            em média para receber
          </p>
          <div className="mt-2 p-2 rounded-md" style={{ background: 'hsl(220, 15%, 9%)' }}>
            <p className="text-[10px]" style={{ color: 'hsl(215, 15%, 45%)' }}>
              {dados.tempoRetorno === 0 ? '— Sem vendas pagas ainda' :
               dados.tempoRetorno <= 3 ? '🟢 Retorno excelente' :
               dados.tempoRetorno <= 7 ? '🟡 Retorno normal' :
               '🔴 Retorno lento — cobre clientes'}
            </p>
          </div>
        </div>
      </div>

      {/* ══ KPIs OPERACIONAIS ═════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">

        {/* CCC */}
        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4" style={{ color: AMBER }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Ciclo (CCC)
            </p>
          </div>
          <p className="text-financial-xl" style={{
            color: dados.ccc === 0 ? 'hsl(215,15%,55%)' : dados.ccc <= 15 ? GREEN : dados.ccc <= 30 ? AMBER : RED,
            textShadow: dados.ccc > 30 ? `0 0 20px ${RED}40` : dados.ccc > 0 ? `0 0 20px ${AMBER}40` : 'none',
          }}>
            {dados.ccc > 0 ? `${dados.ccc}d` : '—'}
          </p>
          <p className="text-[10px] mt-1 font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
            DSO {dados.dso}d · DIO {dados.dio}d
          </p>
          <div className="mt-2 p-2 rounded-md" style={{ background: 'hsl(220, 15%, 9%)' }}>
            <p className="text-[10px]" style={{ color: 'hsl(215, 15%, 45%)' }}>
              {dados.ccc === 0 ? '— Registre vendas e compras' :
               dados.ccc <= 15 ? '🟢 Ciclo excelente' :
               dados.ccc <= 30 ? '🟡 Ciclo normal' :
               '🔴 Ciclo longo — acelere cobranças'}
            </p>
          </div>
        </div>

        {/* Estoque */}
        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="h-4 w-4" style={{ color: BLUE }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Capital Estoque
            </p>
          </div>
          <p className="text-financial-xl" style={{ color: BLUE, textShadow: `0 0 20px ${BLUE}40` }}>
            {dados.estoque.valorCusto > 0 ? formatarMoeda(dados.estoque.valorCusto) : '—'}
          </p>
          <p className="text-[10px] mt-1 font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
            {dados.estoque.qtdItens} itens · margem potencial {formatarMoeda(dados.estoque.margemPotencial)}
          </p>
        </div>

        {/* Caixa Real */}
        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4" style={{ color: GREEN }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Caixa Real
            </p>
          </div>
          <p className="text-financial-xl glow-green">
            {formatarMoeda(dados.caixaReal)}
          </p>
          <p className="text-[10px] mt-1 font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
            após compromissos próximos 7 dias
          </p>
        </div>
      </div>

      {/* ══ PRÓXIMOS PASSOS ════════════════════════════════════ */}
      {dados.recomendacoes.length > 0 && (
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight className="h-4 w-4" style={{ color: GREEN }} />
            <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
              Próximos Passos
            </h3>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded ml-auto" style={{
              background: `${GREEN}15`, color: GREEN
            }}>
              {dados.recomendacoes.length}
            </span>
          </div>
          <div className="space-y-2">
            {dados.recomendacoes.slice(0, 3).map(rec => {
              const borderColor = rec.prioridade === 1 ? GREEN : rec.prioridade === 2 ? AMBER : 'hsl(215,15%,25%)';
              return (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{
                    background: 'hsl(220,15%,9%)',
                    borderLeft: `3px solid ${borderColor}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'hsl(210, 20%, 90%)' }}>
                      {rec.titulo}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                      {rec.descricao}
                    </p>
                    {rec.impactoEstimado && rec.impactoEstimado > 0 && (
                      <p className="text-xs mt-1 font-mono font-bold" style={{ color: AMBER }}>
                        Impacto estimado: {formatarMoeda(rec.impactoEstimado)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate(rec.acao)}
                    className="text-xs font-medium flex items-center gap-0.5 shrink-0 hover:opacity-80 transition-opacity"
                    style={{ color: borderColor }}
                  >
                    Agir <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ ALERTAS INTELIGENTES ══════════════════════════════ */}
      {dados.alertas.length > 0 && (
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4" style={{ color: AMBER }} />
            <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
              Alertas Inteligentes
            </h3>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded ml-auto" style={{
              background: `${AMBER}15`, color: AMBER
            }}>
              {dados.alertas.length}
            </span>
          </div>
          <div className="space-y-2">
            {dados.alertas.map(alerta => (
              <div
                key={alerta.id}
                className={`flex items-start gap-3 p-3 ${
                  alerta.urgencia === 'alta' ? 'alerta-urgente' :
                  alerta.urgencia === 'media' ? 'alerta-medio' : 'alerta-baixo'
                }`}
              >
                <div className="mt-0.5">{alertaIcon(alerta.urgencia)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'hsl(210, 20%, 90%)' }}>
                    {alerta.titulo}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                    {alerta.descricao}
                  </p>
                </div>
                {alerta.acao && tabDeAcao[alerta.acao] && (
                  <button
                    onClick={() => onNavigate(tabDeAcao[alerta.acao as keyof typeof tabDeAcao])}
                    className="text-xs font-medium flex items-center gap-0.5 shrink-0 hover:opacity-80 transition-opacity"
                    style={{ color: alerta.urgencia === 'alta' ? RED : alerta.urgencia === 'media' ? AMBER : GREEN }}
                  >
                    {alerta.acao} <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ GRÁFICOS ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Evolução de recebimentos */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4" style={{ color: AMBER }} />
            <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
              Recebimentos — 7 dias
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dados.evolucao} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 45%)', fontFamily: 'DM Mono' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 45%)', fontFamily: 'DM Mono' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`}
              />
              <Tooltip content={<DarkTooltip />} />
              <Area
                type="monotone" dataKey="recebido"
                stroke={GREEN} strokeWidth={2}
                fill="url(#gradRecebido)"
                dot={{ fill: GREEN, r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de capital */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4" style={{ color: AMBER }} />
            <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
              Capital: Disponível vs Travado
            </h3>
          </div>
          {dados.distribuicaoCapital.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dados.distribuicaoCapital}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={75}
                    paddingAngle={4} dataKey="value"
                  >
                    <Cell fill={GREEN} />
                    <Cell fill={RED} />
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 shrink-0">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: GREEN }} />
                    <span className="text-[10px]" style={{ color: 'hsl(215, 15%, 50%)' }}>Disponível</span>
                  </div>
                  <p className="text-sm font-mono font-medium" style={{ color: GREEN }}>
                    {formatarMoeda(dados.capitalDisponivel)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: RED }} />
                    <span className="text-[10px]" style={{ color: 'hsl(215, 15%, 50%)' }}>Travado</span>
                  </div>
                  <p className="text-sm font-mono font-medium" style={{ color: RED }}>
                    {formatarMoeda(dados.capitalTravado)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-xs text-center" style={{ color: 'hsl(215, 15%, 40%)' }}>
                Registre vendas para<br />ver a distribuição de capital
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ TOP PRODUTOS + DEVEDORES ══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top produtos */}
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" style={{ color: AMBER }} />
              <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                Produtos Rentáveis
              </h3>
            </div>
            <button
              onClick={() => onNavigate('relatorios')}
              className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: AMBER }}
            >
              Ver tudo <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {dados.topProdutos.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: 'hsl(215, 15%, 40%)' }}>
              Nenhuma venda registrada ainda
            </p>
          ) : (
            <div className="space-y-2">
              {dados.topProdutos.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'hsl(220, 15%, 9%)' }}>
                  <span className="text-xs font-mono font-semibold w-5 text-center shrink-0" style={{ color: AMBER }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'hsl(210, 20%, 88%)' }}>
                      {p.nome}
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
                      {p.qtd} unid. vendidas
                    </p>
                  </div>
                  <p className="text-sm font-mono font-medium shrink-0" style={{ color: GREEN }}>
                    +{formatarMoeda(p.lucro)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maiores devedores */}
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: RED }} />
              <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                Capital Travado por Cliente
              </h3>
            </div>
            <button
              onClick={() => onNavigate('clientes')}
              className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: AMBER }}
            >
              Gestão <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {dados.topDevedores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <CheckCircle2 className="h-8 w-8" style={{ color: GREEN, opacity: 0.6 }} />
              <p className="text-xs text-center" style={{ color: 'hsl(215, 15%, 40%)' }}>
                Nenhum capital travado 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dados.topDevedores.map(([nome, valor], i) => {
                const pct = dados.capitalTravado > 0 ? (valor / dados.capitalTravado) * 100 : 0;
                return (
                  <div key={i} className="p-2.5 rounded-lg" style={{ background: 'hsl(220, 15%, 9%)' }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(210, 20%, 88%)' }}>
                        {nome}
                      </p>
                      <p className="text-sm font-mono font-medium shrink-0 ml-2" style={{ color: RED }}>
                        {formatarMoeda(valor)}
                      </p>
                    </div>
                    <div className="progress-dark">
                      <div
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${RED}80, ${RED})`,
                          height: '100%',
                          borderRadius: 999,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 40%)' }}>
                      {pct.toFixed(0)}% do capital travado
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ VENDAS PENDENTES ════════════════════════════════════ */}
      {dados.vendasPendentes.length > 0 && (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: AMBER }} />
              <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                Cobranças Pendentes
              </h3>
            </div>
            <button
              onClick={() => onNavigate('vendas')}
              className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: AMBER }}
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {dados.vendasPendentes.map(venda => {
              const pendente = venda.pagamento.valorTotal - venda.pagamento.valorRecebido;
              const diasAtras = Math.floor((Date.now() - new Date(venda.dataVenda).getTime()) / 86400000);
              return (
                <div key={venda.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{
                  background: 'hsl(220, 15%, 9%)',
                  borderLeft: `2px solid ${diasAtras > 7 ? RED : diasAtras > 3 ? AMBER : 'hsl(220, 15%, 18%)'}`,
                }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'hsl(210, 20%, 88%)' }}>
                      {venda.clienteNome}
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
                      há {diasAtras} dia{diasAtras !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium" style={{ color: RED }}>
                      {formatarMoeda(pendente)}
                    </p>
                    <span className={venda.pagamento.status === 'parcial' ? 'badge-parcial' : 'badge-pendente'}>
                      {venda.pagamento.status === 'parcial' ? 'parcial' : 'pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
