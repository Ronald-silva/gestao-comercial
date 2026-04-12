import { useState } from 'react';
import { Users, TrendingUp, AlertCircle, CheckCircle2, Lock, Edit2, Trash2, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { formatarMoeda } from '@/lib/utils';
import type { Cliente, Venda, ScoreCliente } from '@/types';

interface ClientesProps {
  clientes: Cliente[];
  vendas: Venda[];
  onAtualizar: (id: string, dados: Partial<Cliente>) => void;
  onRemover: (id: string) => void;
  onNavigate: (tab: string) => void;
}

const GREEN = 'hsl(152, 100%, 41%)';
const RED   = 'hsl(352, 100%, 62%)';
const AMBER = 'hsl(38, 95%, 54%)';
const BLUE  = 'hsl(217, 91%, 60%)';

const scoreConfig: Record<ScoreCliente, { label: string; className: string; cor: string; desc: string }> = {
  rapido: {
    label: 'Rápido',
    className: 'score-rapido',
    cor: GREEN,
    desc: 'Paga em até 3 dias — cliente ideal'
  },
  medio: {
    label: 'Médio',
    className: 'score-medio',
    cor: AMBER,
    desc: 'Paga entre 3–7 dias — aceitável'
  },
  lento: {
    label: 'Lento',
    className: 'score-lento',
    cor: RED,
    desc: 'Paga após 7 dias — atenção ao crédito'
  },
  novo: {
    label: 'Novo',
    className: 'score-novo',
    cor: BLUE,
    desc: 'Sem histórico ainda'
  },
};

export function Clientes({ clientes, vendas, onAtualizar, onRemover, onNavigate }: ClientesProps) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const [editandoLimite, setEditandoLimite] = useState<string | null>(null);
  const [novoLimite, setNovoLimite] = useState('');
  const [filtroScore, setFiltroScore] = useState<ScoreCliente | 'todos'>('todos');

  // Stats gerais
  const totalExposicao = clientes.reduce((s, c) => s + c.valorTotalPendente, 0);
  const clientesEmRisco = clientes.filter(c => c.score === 'lento' && c.valorTotalPendente > 0);
  const clientesAdimplentes = clientes.filter(c => c.valorTotalPendente === 0);
  const clientesFiltrados = filtroScore === 'todos'
    ? clientes
    : clientes.filter(c => c.score === filtroScore);

  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    // Primeiro os que devem mais
    return b.valorTotalPendente - a.valorTotalPendente;
  });

  const salvarLimite = (clienteId: string) => {
    const valor = parseFloat(novoLimite.replace(',', '.'));
    if (!isNaN(valor) && valor >= 0) {
      onAtualizar(clienteId, { limiteCredito: valor });
    }
    setEditandoLimite(null);
    setNovoLimite('');
  };

  const vendasCliente = (clienteNome: string) =>
    vendas.filter(v => v.clienteNome.toLowerCase() === clienteNome.toLowerCase() && v.status !== 'cancelada')
          .sort((a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime())
          .slice(0, 5);

  if (clientes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="surface-card p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: AMBER }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'hsl(210, 20%, 70%)' }}>
            Nenhum cliente ainda
          </p>
          <p className="text-xs" style={{ color: 'hsl(215, 15%, 40%)' }}>
            Os clientes aparecem automaticamente ao registrar vendas
          </p>
          <button
            onClick={() => onNavigate('vendas')}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}30` }}
          >
            Registrar primeira venda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card kpi-card-amber p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" style={{ color: AMBER }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Total</p>
          </div>
          <p className="text-financial-lg glow-amber">{clientes.length}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>clientes ativos</p>
        </div>

        <div className="kpi-card kpi-card-red p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4" style={{ color: RED }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Exposto</p>
          </div>
          <p className="text-financial-lg glow-red font-mono">{formatarMoeda(totalExposicao)}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>em aberto</p>
        </div>

        <div className="kpi-card kpi-card-red p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" style={{ color: RED }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Em Risco</p>
          </div>
          <p className="text-financial-lg glow-red">{clientesEmRisco.length}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>pagadores lentos</p>
        </div>

        <div className="kpi-card kpi-card-green p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4" style={{ color: GREEN }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Em Dia</p>
          </div>
          <p className="text-financial-lg glow-green">{clientesAdimplentes.length}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>sem pendências</p>
        </div>
      </div>

      {/* ── Filtro de score ──────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'rapido', 'medio', 'lento', 'novo'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroScore(f)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: filtroScore === f
                ? (f === 'todos' ? `${AMBER}20` : `${scoreConfig[f]?.cor || AMBER}20`)
                : 'hsl(220, 15%, 10%)',
              color: filtroScore === f
                ? (f === 'todos' ? AMBER : scoreConfig[f]?.cor || AMBER)
                : 'hsl(215, 15%, 50%)',
              border: `1px solid ${filtroScore === f
                ? (f === 'todos' ? `${AMBER}30` : `${scoreConfig[f]?.cor || AMBER}30`)
                : 'hsl(220, 15%, 16%)'}`,
            }}
          >
            {f === 'todos' ? 'Todos' : scoreConfig[f]?.label}
            {' '}({f === 'todos' ? clientes.length : clientes.filter(c => c.score === f).length})
          </button>
        ))}
      </div>

      {/* ── Lista de Clientes ─────────────────────────────────── */}
      <div className="space-y-2">
        {clientesOrdenados.map(cliente => {
          const score = scoreConfig[cliente.score];
          const isExpandido = expandido === cliente.id;
          const ultimasVendas = vendasCliente(cliente.nome);
          const ultrapassouLimite = cliente.limiteCredito != null && cliente.valorTotalPendente > cliente.limiteCredito;

          return (
            <div key={cliente.id} className="surface-card overflow-hidden">
              {/* ── Header do cliente ── */}
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpandido(isExpandido ? null : cliente.id)}
              >
                {/* Avatar inicial */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{
                  background: `${score.cor}15`,
                  color: score.cor,
                  border: `1px solid ${score.cor}30`,
                }}>
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 90%)' }}>
                      {cliente.nome}
                    </p>
                    <span className={score.className}>{score.label}</span>
                    {ultrapassouLimite && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{
                        background: `${RED}15`, color: RED, border: `1px solid ${RED}25`
                      }}>
                        Limite excedido
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
                      {cliente.totalCompras} compra{cliente.totalCompras !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 45%)' }}>
                      {cliente.tempoMedioPagamento}d avg pag.
                    </span>
                  </div>
                </div>

                {/* Valores */}
                <div className="text-right shrink-0 mr-2">
                  <p className="text-sm font-mono font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                    {formatarMoeda(cliente.valorTotalGasto)}
                  </p>
                  {cliente.valorTotalPendente > 0 && (
                    <p className="text-xs font-mono" style={{ color: RED }}>
                      -{formatarMoeda(cliente.valorTotalPendente)}
                    </p>
                  )}
                </div>

                {isExpandido
                  ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'hsl(215, 15%, 40%)' }} />
                  : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'hsl(215, 15%, 40%)' }} />
                }
              </button>

              {/* ── Detalhe expandido ── */}
              {isExpandido && (
                <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: 'hsl(220, 15%, 12%)' }}>
                  <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Total gasto */}
                    <div className="surface-card-2 p-3">
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Total Gasto</p>
                      <p className="text-sm font-mono font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                        {formatarMoeda(cliente.valorTotalGasto)}
                      </p>
                    </div>
                    {/* Total pago */}
                    <div className="surface-card-2 p-3">
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Total Pago</p>
                      <p className="text-sm font-mono font-semibold" style={{ color: GREEN }}>
                        {formatarMoeda(cliente.valorTotalPago)}
                      </p>
                    </div>
                    {/* Pendente */}
                    <div className="surface-card-2 p-3">
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Pendente</p>
                      <p className="text-sm font-mono font-semibold" style={{ color: cliente.valorTotalPendente > 0 ? RED : 'hsl(215, 15%, 50%)' }}>
                        {formatarMoeda(cliente.valorTotalPendente)}
                      </p>
                    </div>
                    {/* Tempo médio */}
                    <div className="surface-card-2 p-3">
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Tempo Médio</p>
                      <p className="text-sm font-mono font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                        {cliente.tempoMedioPagamento}d
                      </p>
                    </div>
                  </div>

                  {/* Score explicação */}
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{
                    background: `${score.cor}08`,
                    border: `1px solid ${score.cor}20`,
                  }}>
                    <TrendingUp className="h-4 w-4 shrink-0" style={{ color: score.cor }} />
                    <p className="text-xs" style={{ color: score.cor }}>{score.desc}</p>
                  </div>

                  {/* Limite de crédito */}
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 shrink-0" style={{ color: AMBER }} />
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-1" style={{ color: 'hsl(215, 15%, 55%)' }}>
                        Limite de Crédito
                      </p>
                      {editandoLimite === cliente.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={novoLimite}
                            onChange={e => setNovoLimite(e.target.value)}
                            placeholder="0,00"
                            className="input-dark px-3 py-1.5 text-sm w-32 font-mono"
                            onKeyDown={e => { if (e.key === 'Enter') salvarLimite(cliente.id); if (e.key === 'Escape') { setEditandoLimite(null); setNovoLimite(''); } }}
                            autoFocus
                          />
                          <button
                            onClick={() => salvarLimite(cliente.id)}
                            className="px-3 py-1.5 text-xs rounded-lg font-medium"
                            style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}30` }}
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => { setEditandoLimite(null); setNovoLimite(''); }}
                            className="text-xs"
                            style={{ color: 'hsl(215, 15%, 45%)' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono" style={{ color: cliente.limiteCredito != null ? AMBER : 'hsl(215, 15%, 40%)' }}>
                            {cliente.limiteCredito != null ? formatarMoeda(cliente.limiteCredito) : 'Não definido'}
                          </p>
                          <button
                            onClick={() => { setEditandoLimite(cliente.id); setNovoLimite(cliente.limiteCredito?.toString() || ''); }}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Edit2 className="h-3.5 w-3.5" style={{ color: 'hsl(215, 15%, 45%)' }} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Últimas vendas */}
                  {ultimasVendas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'hsl(215, 15%, 45%)' }}>
                        Últimas Compras
                      </p>
                      <div className="space-y-1.5">
                        {ultimasVendas.map(v => (
                          <div key={v.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-md" style={{
                            background: 'hsl(220, 15%, 8%)',
                          }}>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: 'hsl(210, 20%, 80%)' }}>
                                {v.itens.map(i => i.produtoNome).join(', ')}
                              </p>
                              <p className="text-[10px] font-mono" style={{ color: 'hsl(215, 15%, 40%)' }}>
                                {new Date(v.dataVenda).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="text-xs font-mono font-medium" style={{ color: 'hsl(210, 20%, 80%)' }}>
                                {formatarMoeda(v.valorTotal)}
                              </p>
                              <span className={
                                v.pagamento.status === 'pago' ? 'badge-pago' :
                                v.pagamento.status === 'parcial' ? 'badge-parcial' : 'badge-pendente'
                              }>
                                {v.pagamento.status === 'pago' ? 'pago' : v.pagamento.status === 'parcial' ? 'parcial' : 'pend.'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => { if (confirm(`Remover ${cliente.nome}?`)) onRemover(cliente.id); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                      style={{ background: `${RED}10`, color: RED, border: `1px solid ${RED}20` }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
