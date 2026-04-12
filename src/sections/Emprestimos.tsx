import { useState } from 'react';
import {
  HandCoins, Plus, X, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, DollarSign, TrendingUp, Lock, AlertTriangle,
} from 'lucide-react';
import { formatarMoeda } from '@/lib/utils';
import { useDados } from '@/hooks/useDados';
import type { CreditoCliente, TipoCredito } from '@/types';

interface EmprestimosProps {
  emprestimos: CreditoCliente[];
  onAdicionar: (dados: Omit<CreditoCliente, 'id' | 'criadoEm' | 'pagamento' | 'valorTotal' | 'valorJurosPeriodico'>) => void;
  onRegistrarPagamento: (id: string, valor: number, data: string, obs?: string) => void;
}

const GREEN = 'hsl(152, 100%, 41%)';
const RED   = 'hsl(352, 100%, 62%)';
const AMBER = 'hsl(38, 95%, 54%)';

export function Emprestimos({ emprestimos, onAdicionar, onRegistrarPagamento }: EmprestimosProps) {
  const { clientes } = useDados();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarPagForm, setMostrarPagForm] = useState<string | null>(null);

  const [form, setForm] = useState({
    clienteNome: '',
    clienteContato: '',
    tipoModalidade: 'amortizado' as TipoCredito,
    taxaJuros: '20',
    valorConcedido: '',
    dataConcessao: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    finalidade: '',
    observacoes: '',
  });

  // ── Form — recebimento ──────────────────────────────────
  const [pagForm, setPagForm] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });

  // ── Stats ───────────────────────────────────────────────
  const totalConcedido = emprestimos.reduce((s, e) => s + e.valorConcedido, 0);
  const totalAReceber = emprestimos.filter(e => e.status !== 'pago').reduce(
    (s, e) => {
      if (e.tipoModalidade === 'juros_recorrentes') return s + e.valorConcedido;
      return s + Math.max(0, e.valorTotal - e.pagamento.valorRecebido);
    }, 0
  );
  const totalJuros = emprestimos.reduce(
    (s, e) => {
      if (e.tipoModalidade === 'juros_recorrentes') return s + e.pagamento.valorRecebido;
      return s + Math.max(0, e.pagamento.valorRecebido - e.valorConcedido);
    }, 0
  );
  const creditosAtivos = emprestimos.filter(e => e.status !== 'pago').length;

  const submeterCredito = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteNome || !form.valorConcedido || !form.dataVencimento) return;
    onAdicionar({
      clienteNome: form.clienteNome,
      clienteContato: form.clienteContato || undefined,
      tipoModalidade: form.tipoModalidade,
      taxaJuros: parseFloat(form.taxaJuros) / 100,
      valorConcedido: parseFloat(form.valorConcedido.replace(',', '.')),
      dataConcessao: form.dataConcessao,
      dataVencimento: form.dataVencimento,
      finalidade: form.finalidade || undefined,
      observacoes: form.observacoes || undefined,
      status: form.tipoModalidade === 'juros_recorrentes' ? 'ativo' : 'pendente',
    });
    setForm({
      clienteNome: '', clienteContato: '', tipoModalidade: 'amortizado', taxaJuros: '20', valorConcedido: '',
      dataConcessao: new Date().toISOString().split('T')[0],
      dataVencimento: '', finalidade: '', observacoes: '',
    });
    setMostrarForm(false);
  };

  const submeterPagamento = (creditoId: string) => {
    if (!pagForm.valor || !pagForm.data) return;
    onRegistrarPagamento(
      creditoId,
      parseFloat(pagForm.valor.replace(',', '.')),
      pagForm.data,
      pagForm.observacao || undefined
    );
    setPagForm({ valor: '', data: new Date().toISOString().split('T')[0], observacao: '' });
    setMostrarPagForm(null);
  };

  const hoje = new Date().toISOString().split('T')[0];

  const statusCredito = (c: CreditoCliente) => {
    if (c.status === 'pago') return 'pago';
    if (c.dataVencimento < hoje) return 'vencido';
    return 'ativo';
  };

  return (
    <div className="space-y-4">

      {/* ── Header: título + botão novo ───────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'hsl(210, 20%, 92%)' }}>
            Crédito a Clientes
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215, 15%, 45%)' }}>
            Capital adiantado como ferramenta de fidelização e retorno
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{ background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}30` }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Crédito</span>
        </button>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card kpi-card-amber p-4">
          <div className="flex items-center gap-2 mb-2">
            <HandCoins className="h-4 w-4" style={{ color: AMBER }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Concedido</p>
          </div>
          <p className="text-financial-lg glow-amber">{formatarMoeda(totalConcedido)}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>capital emprestado</p>
        </div>

        <div className="kpi-card kpi-card-red p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4" style={{ color: RED }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>A Receber</p>
          </div>
          <p className="text-financial-lg glow-red">{formatarMoeda(totalAReceber)}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>{creditosAtivos} crédito{creditosAtivos !== 1 ? 's' : ''} ativo{creditosAtivos !== 1 ? 's' : ''}</p>
        </div>

        <div className="kpi-card kpi-card-green p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4" style={{ color: GREEN }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Juros Receb.</p>
          </div>
          <p className="text-financial-lg glow-green">{formatarMoeda(totalJuros)}</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>lucro financeiro</p>
        </div>

        <div className="kpi-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4" style={{ color: GREEN }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(215, 15%, 50%)' }}>Pagos</p>
          </div>
          <p className="text-financial-lg" style={{ color: 'hsl(210, 20%, 80%)' }}>
            {emprestimos.filter(e => e.status === 'pago').length}
          </p>
          <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(215, 15%, 45%)' }}>quitados</p>
        </div>
      </div>

      {/* ── Explicação do módulo ──────────────────────────────── */}
      <div className="p-3 rounded-lg" style={{
        background: `${AMBER}06`,
        border: `1px solid ${AMBER}15`,
      }}>
        <p className="text-xs" style={{ color: 'hsl(215, 15%, 55%)' }}>
          <span style={{ color: AMBER }} className="font-semibold">💡 Como usar:</span>{' '}
          Crédito a clientes é capital que você adianta para um cliente de confiança.
          O sistema cobra 20% de retorno automático. Use com moderação para não travar seu capital de giro.
          Prefira sempre cobrar <span style={{ color: AMBER }}>antes de conceder</span> novo crédito.
        </p>
      </div>

      {/* ── Formulário novo crédito ───────────────────────────── */}
      {mostrarForm && (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 90%)' }}>
              Conceder Crédito
            </h3>
            <button onClick={() => setMostrarForm(false)}>
              <X className="h-4 w-4" style={{ color: 'hsl(215, 15%, 50%)' }} />
            </button>
          </div>
          <form onSubmit={submeterCredito} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Cliente *
                </label>
                <input
                  type="text"
                  value={form.clienteNome}
                  onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
                  placeholder="Nome do cliente"
                  required
                  className="input-dark w-full px-3 py-2 text-sm"
                />
                {(() => {
                  const match = clientes.find(c => c.nome.toLowerCase() === form.clienteNome.toLowerCase());
                  if (!match || match.score !== 'lento') return null;
                  return (
                    <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-md" style={{ background: 'hsl(38,95%,54%,0.12)', border: '1px solid hsl(38,95%,54%,0.25)' }}>
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(38,95%,54%)' }} />
                      <p className="text-xs" style={{ color: 'hsl(38,95%,54%)' }}>
                        Pagador lento ({match.tempoMedioPagamento}d em média). Avalie antes de conceder crédito.
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Contato
                </label>
                <input
                  type="text"
                  value={form.clienteContato}
                  onChange={e => setForm(f => ({ ...f, clienteContato: e.target.value }))}
                  placeholder="WhatsApp / telefone"
                  className="input-dark w-full px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Modalidade do Crédito *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'hsl(210, 20%, 90%)' }}>
                    <input
                      type="radio"
                      name="tipoModalidade"
                      value="amortizado"
                      checked={form.tipoModalidade === 'amortizado'}
                      onChange={() => setForm(f => ({ ...f, tipoModalidade: 'amortizado' }))}
                      className="accent-amber-500"
                    />
                    Quitação (Capital + Juros)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'hsl(210, 20%, 90%)' }}>
                    <input
                      type="radio"
                      name="tipoModalidade"
                      value="juros_recorrentes"
                      checked={form.tipoModalidade === 'juros_recorrentes'}
                      onChange={() => setForm(f => ({ ...f, tipoModalidade: 'juros_recorrentes' }))}
                      className="accent-amber-500"
                    />
                    Rendimento Recorrente
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Valor Concedido *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.valorConcedido}
                  onChange={e => setForm(f => ({ ...f, valorConcedido: e.target.value }))}
                  placeholder="0,00"
                  required
                  className="input-dark w-full px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Taxa de Juros (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.taxaJuros}
                  onChange={e => setForm(f => ({ ...f, taxaJuros: e.target.value }))}
                  placeholder="20"
                  required
                  className="input-dark w-full px-3 py-2 text-sm font-mono"
                />
                {form.valorConcedido && form.taxaJuros && (
                  <p className="text-[10px] mt-1 font-mono" style={{ color: AMBER }}>
                    {form.tipoModalidade === 'amortizado'
                      ? `Retorno total: ${formatarMoeda(parseFloat(form.valorConcedido || '0') * (1 + parseFloat(form.taxaJuros)/100))}`
                      : `Rendimento periódico: ${formatarMoeda(parseFloat(form.valorConcedido || '0') * (parseFloat(form.taxaJuros)/100))}`
                    }
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Data de Concessão *
                </label>
                <input
                  type="date"
                  value={form.dataConcessao}
                  onChange={e => setForm(f => ({ ...f, dataConcessao: e.target.value }))}
                  required
                  className="input-dark w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Vencimento *
                </label>
                <input
                  type="date"
                  value={form.dataVencimento}
                  min={form.dataConcessao}
                  onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
                  required
                  className="input-dark w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'hsl(215, 15%, 55%)' }}>
                  Finalidade
                </label>
                <input
                  type="text"
                  value={form.finalidade}
                  onChange={e => setForm(f => ({ ...f, finalidade: e.target.value }))}
                  placeholder="Ex: compra de produto X"
                  className="input-dark w-full px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 text-sm rounded-lg"
                style={{ color: 'hsl(215, 15%, 50%)', background: 'hsl(220, 15%, 10%)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
                style={{ background: AMBER, color: 'hsl(220, 20%, 4%)' }}
              >
                Conceder Crédito
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lista de créditos ─────────────────────────────────── */}
      {emprestimos.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: AMBER }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'hsl(210, 20%, 70%)' }}>
            Nenhum crédito registrado
          </p>
          <p className="text-xs" style={{ color: 'hsl(215, 15%, 40%)' }}>
            Use com cautela — crédito trava seu capital de giro
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {emprestimos.map(credito => {
            const status = statusCredito(credito);
            const isRecorrente = credito.tipoModalidade === 'juros_recorrentes';
            const pendente = isRecorrente ? credito.valorConcedido : credito.valorTotal - credito.pagamento.valorRecebido;
            const pct = isRecorrente ? 100 : (credito.valorTotal > 0 ? (credito.pagamento.valorRecebido / credito.valorTotal) * 100 : 0);
            const isExp = expandido === credito.id;
            const diasVencimento = Math.ceil(
              (new Date(credito.dataVencimento).getTime() - Date.now()) / 86400000
            );

            const cor = status === 'pago' ? GREEN : status === 'vencido' ? RED : AMBER;
            const labelStatus = status === 'pago' ? 'Quitado' : isRecorrente ? 'Rendendo' : (status === 'vencido' ? 'Vencido' : 'Ativo');

            return (
              <div key={credito.id} className="surface-card overflow-hidden">
                <button
                  className="w-full p-4 flex items-center gap-3 text-left"
                  onClick={() => setExpandido(isExp ? null : credito.id)}
                >
                  {/* Ícone status */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{
                    background: `${cor}15`,
                    border: `1px solid ${cor}30`,
                  }}>
                    {status === 'pago'
                      ? <CheckCircle2 className="h-4 w-4" style={{ color: cor }} />
                      : status === 'vencido'
                      ? <AlertCircle className="h-4 w-4" style={{ color: cor }} />
                      : <Clock className="h-4 w-4" style={{ color: cor }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'hsl(210, 20%, 90%)' }}>
                        {credito.clienteNome}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                        background: `${cor}15`, color: cor, border: `1px solid ${cor}25`
                      }}>
                        {labelStatus}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      {credito.finalidade && (
                        <span className="text-[10px]" style={{ color: 'hsl(215, 15%, 45%)' }}>
                          {credito.finalidade}
                        </span>
                      )}
                      {status !== 'pago' && (
                        <span className="text-[10px] font-mono" style={{ color: status === 'vencido' ? RED : 'hsl(215, 15%, 45%)' }}>
                          {status === 'vencido'
                            ? `${Math.abs(diasVencimento)}d vencido`
                            : `${diasVencimento}d para vencer`}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 progress-dark" style={{ height: 3 }}>
                      <div style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${cor}70, ${cor})`,
                        height: '100%',
                        borderRadius: 999,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  <div className="text-right shrink-0 mr-1">
                    <p className="text-sm font-mono font-semibold" style={{ color: 'hsl(210, 20%, 90%)' }}>
                      {isRecorrente ? 'Travado' : 'Total'} {formatarMoeda(isRecorrente ? credito.valorConcedido : credito.valorTotal)}
                    </p>
                    {(!isRecorrente && pendente > 0) && (
                      <p className="text-xs font-mono" style={{ color: RED }}>
                        Falta {formatarMoeda(pendente)}
                      </p>
                    )}
                    {isRecorrente && (
                      <p className="text-xs font-mono" style={{ color: GREEN }}>
                        Rende {formatarMoeda(credito.valorJurosPeriodico || 0)}
                      </p>
                    )}
                  </div>

                  {isExp ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'hsl(215, 15%, 40%)' }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'hsl(215, 15%, 40%)' }} />}
                </button>

                {/* ── Detalhe ── */}
                {isExp && (
                  <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: 'hsl(220, 15%, 12%)' }}>
                    <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="surface-card-2 p-3">
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Concedido</p>
                        <p className="text-sm font-mono" style={{ color: 'hsl(210, 20%, 88%)' }}>{formatarMoeda(credito.valorConcedido)}</p>
                      </div>
                      <div className="surface-card-2 p-3">
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>
                          {isRecorrente ? `Rendimento` : `+Juros`}
                        </p>
                        <p className="text-sm font-mono" style={{ color: AMBER }}>
                          {isRecorrente ? formatarMoeda(credito.valorJurosPeriodico || 0) : formatarMoeda(credito.valorTotal - credito.valorConcedido)}
                        </p>
                      </div>
                      <div className="surface-card-2 p-3">
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>
                          {isRecorrente ? 'Ganhos Acumulados' : 'Recebido'}
                        </p>
                        <p className="text-sm font-mono" style={{ color: GREEN }}>{formatarMoeda(credito.pagamento.valorRecebido)}</p>
                      </div>
                      <div className="surface-card-2 p-3">
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>
                          {isRecorrente ? "Capital Travado" : "Pendente"}
                        </p>
                        <p className="text-sm font-mono" style={{ color: (!isRecorrente && pendente > 0) ? RED : GREEN }}>{formatarMoeda(pendente)}</p>
                      </div>
                    </div>

                    {/* Informações adicionais */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p style={{ color: 'hsl(215, 15%, 45%)' }}>Concessão:</p>
                        <p className="font-mono" style={{ color: 'hsl(210, 20%, 80%)' }}>
                          {new Date(credito.dataConcessao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'hsl(215, 15%, 45%)' }}>Vencimento:</p>
                        <p className="font-mono" style={{ color: status === 'vencido' ? RED : 'hsl(210, 20%, 80%)' }}>
                          {new Date(credito.dataVencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {credito.clienteContato && (
                        <div>
                          <p style={{ color: 'hsl(215, 15%, 45%)' }}>Contato:</p>
                          <p style={{ color: 'hsl(210, 20%, 80%)' }}>{credito.clienteContato}</p>
                        </div>
                      )}
                    </div>

                    {/* Lançamentos de pagamento */}
                    {credito.pagamento.lancamentos.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'hsl(215, 15%, 45%)' }}>
                          Recebimentos
                        </p>
                        <div className="space-y-1.5">
                          {credito.pagamento.lancamentos.map(l => (
                            <div key={l.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-md" style={{ background: 'hsl(220, 15%, 8%)' }}>
                              <div>
                                <p className="text-xs font-mono" style={{ color: 'hsl(210, 20%, 80%)' }}>
                                  {new Date(l.data).toLocaleDateString('pt-BR')}
                                </p>
                                {l.observacao && <p className="text-[10px]" style={{ color: 'hsl(215, 15%, 45%)' }}>{l.observacao}</p>}
                              </div>
                              <p className="text-sm font-mono font-medium" style={{ color: GREEN }}>+{formatarMoeda(l.valor)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Form recebimento */}
                    {credito.status !== 'pago' && (
                      <div>
                        {mostrarPagForm === credito.id ? (
                          <div className="surface-card-2 p-3 space-y-3">
                              <p className="text-xs font-semibold" style={{ color: 'hsl(210, 20%, 88%)' }}>
                                {isRecorrente ? 'Registrar Rendimento' : 'Registrar Recebimento'}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] block mb-1" style={{ color: 'hsl(215, 15%, 50%)' }}>
                                    Valor {isRecorrente && `(Sugestão: ${formatarMoeda(credito.valorJurosPeriodico || 0)})`}
                                  </label>
                                  <input
                                    type="number"
                                    value={pagForm.valor}
                                    onChange={e => setPagForm(f => ({ ...f, valor: e.target.value }))}
                                    placeholder={!isRecorrente ? `Até ${formatarMoeda(pendente)}` : formatarMoeda(credito.valorJurosPeriodico || 0)}
                                  step="0.01"
                                  className="input-dark w-full px-2 py-1.5 text-sm font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] block mb-1" style={{ color: 'hsl(215, 15%, 50%)' }}>Data</label>
                                <input
                                  type="date"
                                  value={pagForm.data}
                                  onChange={e => setPagForm(f => ({ ...f, data: e.target.value }))}
                                  className="input-dark w-full px-2 py-1.5 text-sm"
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={pagForm.observacao}
                              onChange={e => setPagForm(f => ({ ...f, observacao: e.target.value }))}
                              placeholder="Observação (opcional)"
                              className="input-dark w-full px-2 py-1.5 text-sm"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setMostrarPagForm(null)}
                                className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ color: 'hsl(215, 15%, 50%)', background: 'hsl(220, 15%, 10%)' }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => submeterPagamento(credito.id)}
                                disabled={!pagForm.valor}
                                className="text-xs px-4 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                                style={{ background: GREEN, color: 'hsl(220, 20%, 4%)' }}
                              >
                                Registrar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setMostrarPagForm(credito.id);
                              setPagForm({
                                valor: isRecorrente ? String(credito.valorJurosPeriodico || '') : '',
                                data: new Date().toISOString().split('T')[0],
                                observacao: isRecorrente ? 'Recebimento de rendimentos' : ''
                              });
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-90"
                            style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}25` }}
                          >
                            <DollarSign className="h-4 w-4" />
                            {isRecorrente ? 'Receber Rendimento' : 'Registrar Recebimento'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
