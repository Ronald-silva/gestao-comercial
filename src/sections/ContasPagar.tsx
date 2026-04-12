import { useState } from 'react';
import {
  FileText, Plus, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, DollarSign, Calendar, Trash2,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/utils';
import type { ContaPagar } from '@/types';

interface ContasPagarProps {
  contasPagar: ContaPagar[];
  onAdicionar: (dados: Omit<ContaPagar, 'id' | 'criadoEm' | 'status'>) => void;
  onPagar: (id: string, dataPagamento: string) => void;
  onRemover: (id: string) => void;
}

const GREEN = 'hsl(152, 100%, 41%)';
const RED   = 'hsl(352, 100%, 62%)';
const AMBER = 'hsl(38, 95%, 54%)';

export function ContasPagar({ contasPagar, onAdicionar, onPagar, onRemover }: ContasPagarProps) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarPagForm, setMostrarPagForm] = useState<string | null>(null);

  const hoje = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    fornecedor: '',
    descricao: '',
    valor: '',
    dataVencimento: '',
    observacoes: '',
  });

  const [pagForm, setPagForm] = useState({
    dataPagamento: hoje,
  });

  // ── Stats ───────────────────────────────────────────────
  const totalPendente = contasPagar.filter(c => c.status !== 'pago').reduce((s, c) => s + c.valor, 0);
  const totalVencido = contasPagar.filter(c => c.status === 'vencido').reduce((s, c) => s + c.valor, 0);
  const vencendoEm7d = contasPagar.filter(c => {
    if (c.status !== 'pendente') return false;
    const dias = Math.floor((new Date(c.dataVencimento).getTime() - new Date(hoje).getTime()) / 86400000);
    return dias >= 0 && dias <= 7;
  }).reduce((s, c) => s + c.valor, 0);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fornecedor || !form.valor || !form.dataVencimento) return;
    onAdicionar({
      fornecedor: form.fornecedor,
      descricao: form.descricao || form.fornecedor,
      valor: parseFloat(form.valor),
      dataVencimento: form.dataVencimento,
      observacoes: form.observacoes || undefined,
    });
    setForm({ fornecedor: '', descricao: '', valor: '', dataVencimento: '', observacoes: '' });
    setMostrarForm(false);
  };

  const confirmarPagamento = (id: string) => {
    onPagar(id, pagForm.dataPagamento);
    setMostrarPagForm(null);
  };

  const corStatus = (c: ContaPagar) => {
    if (c.status === 'pago') return GREEN;
    if (c.status === 'vencido') return RED;
    const dias = Math.floor((new Date(c.dataVencimento).getTime() - new Date(hoje).getTime()) / 86400000);
    if (dias <= 3) return RED;
    if (dias <= 7) return AMBER;
    return 'hsl(215, 15%, 55%)';
  };

  const labelStatus = (c: ContaPagar) => {
    if (c.status === 'pago') return 'Pago';
    if (c.status === 'vencido') return 'Vencido';
    const dias = Math.floor((new Date(c.dataVencimento).getTime() - new Date(hoje).getTime()) / 86400000);
    if (dias === 0) return 'Vence hoje';
    if (dias < 0) return `Atrasado ${Math.abs(dias)}d`;
    return `Vence em ${dias}d`;
  };

  const pendentes = contasPagar.filter(c => c.status !== 'pago').sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  const pagas = contasPagar.filter(c => c.status === 'pago').slice(0, 10);

  return (
    <div className="space-y-4">

      {/* ══ STATS ══════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card kpi-card-red p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" style={{ color: RED }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Vencido
            </p>
          </div>
          <p className="text-financial-md glow-red font-mono">{formatarMoeda(totalVencido)}</p>
        </div>

        <div className="kpi-card kpi-card-amber p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" style={{ color: AMBER }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              7 dias
            </p>
          </div>
          <p className="text-financial-md font-mono" style={{ color: AMBER }}>{formatarMoeda(vencendoEm7d)}</p>
        </div>

        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4" style={{ color: 'hsl(215, 15%, 55%)' }} />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>
              Total Pendente
            </p>
          </div>
          <p className="text-financial-md font-mono" style={{ color: 'hsl(210, 20%, 88%)' }}>{formatarMoeda(totalPendente)}</p>
        </div>
      </div>

      {/* ══ HEADER + BOTÃO ════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: AMBER }} />
          <h2 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
            Contas a Pagar
          </h2>
          {pendentes.length > 0 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${RED}20`, color: RED }}>
              {pendentes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setMostrarForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}30` }}
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Conta
        </button>
      </div>

      {/* ══ FORMULÁRIO ════════════════════════════════════ */}
      {mostrarForm && (
        <form onSubmit={submeter} className="surface-card p-4 space-y-3">
          <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(210, 20%, 88%)' }}>Nova Conta a Pagar</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'hsl(215, 15%, 55%)' }}>Fornecedor *</label>
              <input
                className="input-dark w-full"
                value={form.fornecedor}
                onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))}
                placeholder="Nome do fornecedor"
                required
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'hsl(215, 15%, 55%)' }}>Descrição</label>
              <input
                className="input-dark w-full"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Reposição de estoque"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'hsl(215, 15%, 55%)' }}>Valor *</label>
              <input
                className="input-dark w-full font-mono"
                type="number"
                min="0.01"
                step="0.01"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'hsl(215, 15%, 55%)' }}>Vencimento *</label>
              <input
                className="input-dark w-full"
                type="date"
                value={form.dataVencimento}
                onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'hsl(215, 15%, 55%)' }}>Observações</label>
            <input
              className="input-dark w-full"
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: `${AMBER}25`, color: AMBER, border: `1px solid ${AMBER}40` }}
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'hsl(220, 15%, 12%)', color: 'hsl(215, 15%, 55%)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ══ LISTA PENDENTE ════════════════════════════════ */}
      {pendentes.length === 0 && (
        <div className="surface-card p-8 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: GREEN }} />
          <p className="text-sm font-medium" style={{ color: 'hsl(210, 20%, 80%)' }}>Nenhuma conta pendente</p>
          <p className="text-xs mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Todas as contas estão em dia</p>
        </div>
      )}

      <div className="space-y-2">
        {pendentes.map(conta => (
          <div key={conta.id} className="surface-card overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => setExpandido(v => v === conta.id ? null : conta.id)}
            >
              <div className="p-2 rounded-lg shrink-0" style={{ background: `${corStatus(conta)}15` }}>
                {conta.status === 'vencido'
                  ? <AlertCircle className="h-4 w-4" style={{ color: corStatus(conta) }} />
                  : <Calendar className="h-4 w-4" style={{ color: corStatus(conta) }} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 90%)' }}>
                    {conta.fornecedor}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{
                    background: `${corStatus(conta)}15`, color: corStatus(conta)
                  }}>
                    {labelStatus(conta)}
                  </span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(215, 15%, 50%)' }}>
                  {conta.descricao}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-mono font-bold" style={{ color: corStatus(conta) }}>
                  {formatarMoeda(conta.valor)}
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'hsl(215, 15%, 45%)' }}>
                  {new Date(conta.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>

              {expandido === conta.id
                ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'hsl(215, 15%, 45%)' }} />
                : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'hsl(215, 15%, 45%)' }} />
              }
            </button>

            {expandido === conta.id && (
              <div className="border-t px-4 pb-4 space-y-3" style={{ borderColor: 'hsl(220, 15%, 14%)' }}>
                {conta.observacoes && (
                  <p className="text-xs pt-3" style={{ color: 'hsl(215, 15%, 55%)' }}>{conta.observacoes}</p>
                )}

                {mostrarPagForm === conta.id ? (
                  <div className="flex gap-2 pt-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: 'hsl(215, 15%, 55%)' }}>Data do pagamento</label>
                      <input
                        className="input-dark w-full"
                        type="date"
                        value={pagForm.dataPagamento}
                        onChange={e => setPagForm({ dataPagamento: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={() => confirmarPagamento(conta.id)}
                      className="px-3 py-2 rounded-lg text-xs font-medium"
                      style={{ background: `${GREEN}20`, color: GREEN, border: `1px solid ${GREEN}30` }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setMostrarPagForm(null)}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'hsl(220, 15%, 12%)', color: 'hsl(215, 15%, 55%)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setMostrarPagForm(conta.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                      style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}25` }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Marcar como Pago
                    </button>
                    <button
                      onClick={() => onRemover(conta.id)}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{ background: `${RED}10`, color: RED, border: `1px solid ${RED}20` }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ══ PAGAS RECENTES ════════════════════════════════ */}
      {pagas.length > 0 && (
        <div className="surface-card p-4">
          <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 45%)' }}>
            Pagas Recentemente
          </p>
          <div className="space-y-2">
            {pagas.map(conta => (
              <div key={conta.id} className="flex items-center justify-between py-1.5">
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: 'hsl(210, 20%, 70%)' }}>{conta.fornecedor}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(215, 15%, 40%)' }}>
                    Pago em {new Date((conta.dataPagamento || conta.dataVencimento) + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className="text-sm font-mono shrink-0" style={{ color: GREEN }}>
                  {formatarMoeda(conta.valor)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
