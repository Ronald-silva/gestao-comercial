import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, AlertTriangle, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import { formatarMoeda, formatarData } from '@/lib/utils';
import type { MetaReinvestimento as MetaType, Venda, Compra } from '@/types';

interface MetaReinvestimentoProps {
  metas: MetaType[];
  vendas: Venda[];
  compras: Compra[];
  onAdicionar: (dados: Omit<MetaType, 'id' | 'criadoEm'>) => void;
  onRemover: (id: string) => void;
  getMetaAtiva: () => MetaType | null;
  getProgressoMeta: (meta: MetaType) => {
    receitaPeriodo: number;
    valorMeta: number;
    reinvestidoPeriodo: number;
    percentualRealizado: number;
    atingida: boolean;
    faltando: number;
  };
}

export function MetaReinvestimento({ metas, vendas, compras, onAdicionar, onRemover, getMetaAtiva, getProgressoMeta }: MetaReinvestimentoProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [form, setForm] = useState({
    percentualMeta: '30',
    periodoInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodoFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    ativa: true,
    observacoes: '',
  });

  const metaAtiva = useMemo(() => getMetaAtiva(), [metas]);
  const progressoAtivo = useMemo(() =>
    metaAtiva ? getProgressoMeta(metaAtiva) : null,
    [metaAtiva, vendas, compras]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdicionar({
      percentualMeta: parseFloat(form.percentualMeta),
      periodoInicio: form.periodoInicio,
      periodoFim: form.periodoFim,
      ativa: form.ativa,
      observacoes: form.observacoes,
    });
    setModalNovo(false);
    setForm({
      percentualMeta: '30',
      periodoInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      periodoFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      ativa: true,
      observacoes: '',
    });
  };

  const getCorProgresso = (pct: number) => {
    if (pct >= 80) return { barra: '#10b981', texto: '#10b981', badge: 'bg-[#10b981]/10 text-[#10b981]' };
    if (pct >= 50) return { barra: '#f59e0b', texto: '#f59e0b', badge: 'bg-[#f59e0b]/10 text-[#f59e0b]' };
    return { barra: '#ef4444', texto: '#ef4444', badge: 'bg-[#ef4444]/10 text-[#ef4444]' };
  };

  return (
    <div className="space-y-6">
      {/* Meta Ativa — Card Destaque */}
      {metaAtiva && progressoAtivo ? (
        <>
          {/* Alerta de baixo investimento */}
          {progressoAtivo.percentualRealizado < 50 && (
            <div className="flex items-start gap-3 p-4 rounded-lg border" style={{ backgroundColor: 'hsl(35, 30%, 15%)', borderColor: 'hsl(35, 30%, 25%)' }}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(35, 90%, 55%)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'hsl(35, 90%, 65%)' }}>Reinvestimento abaixo da meta!</p>
                <p className="text-sm mt-0.5" style={{ color: 'hsl(35, 60%, 55%)' }}>
                  Você reinvestiu apenas <strong>{progressoAtivo.percentualRealizado.toFixed(0)}%</strong> da meta.
                  Faltam <strong>{formatarMoeda(progressoAtivo.faltando)}</strong> para atingir o alvo.
                  Compre mais estoque!
                </p>
              </div>
            </div>
          )}

          {/* Card progresso */}
          <Card className="surface-card border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(270, 70%, 75%)' }}>
                  <Target className="w-5 h-5" />
                  Meta Ativa — {metaAtiva.percentualMeta}% da Receita
                </CardTitle>
                <Badge className={getCorProgresso(progressoAtivo.percentualRealizado).badge}>
                  {progressoAtivo.atingida ? '✓ Atingida' : `${progressoAtivo.percentualRealizado.toFixed(0)}% realizado`}
                </Badge>
              </div>
              <p className="text-xs" style={{ color: 'hsl(215, 15%, 50%)' }}>
                {formatarData(metaAtiva.periodoInicio)} até {formatarData(metaAtiva.periodoFim)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'hsl(210, 20%, 80%)' }}>Progresso</span>
                  <span className="font-bold" style={{ color: getCorProgresso(progressoAtivo.percentualRealizado).texto }}>
                    {progressoAtivo.percentualRealizado.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full rounded-full h-4 overflow-hidden" style={{ background: 'hsl(220, 15%, 15%)' }}>
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progressoAtivo.percentualRealizado)}%`, background: getCorProgresso(progressoAtivo.percentualRealizado).barra }}
                  />
                </div>
                <p className="text-xs mt-1 text-center" style={{ color: 'hsl(215, 15%, 50%)' }}>
                  Reinvestido: <strong style={{ color: 'hsl(210, 20%, 90%)' }}>{formatarMoeda(progressoAtivo.reinvestidoPeriodo)}</strong> de <strong style={{ color: 'hsl(210, 20%, 90%)' }}>{formatarMoeda(progressoAtivo.valorMeta)}</strong>
                </p>
              </div>

              {/* 3 cards de números */}
              <div className="grid grid-cols-3 gap-3">
                <div className="surface-card-2 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Receita no Período</p>
                  <p className="font-bold text-lg font-mono text-white">{formatarMoeda(progressoAtivo.receitaPeriodo)}</p>
                </div>
                <div className="surface-card-2 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>Meta ({metaAtiva.percentualMeta}%)</p>
                  <p className="font-bold text-lg font-mono" style={{ color: 'hsl(270, 70%, 75%)' }}>{formatarMoeda(progressoAtivo.valorMeta)}</p>
                </div>
                <div className={`surface-card-2 rounded-lg p-3 text-center border ${progressoAtivo.faltando > 0 ? 'border-red-900/50' : 'border-green-900/50'}`}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'hsl(215, 15%, 45%)' }}>
                    {progressoAtivo.faltando > 0 ? 'Faltando' : 'Excedente'}
                  </p>
                  <p className={`font-bold text-lg font-mono ${progressoAtivo.faltando > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                    {progressoAtivo.faltando > 0
                      ? formatarMoeda(progressoAtivo.faltando)
                      : <span className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> OK</span>
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="surface-card border-none border-dashed border-2 text-center" style={{ borderColor: 'hsl(270, 40%, 25%)' }}>
          <CardContent className="py-10">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'hsl(270, 70%, 75%)' }} />
            <p className="font-medium" style={{ color: 'hsl(210, 20%, 70%)' }}>Nenhuma meta ativa</p>
            <p className="text-sm mb-4" style={{ color: 'hsl(215, 15%, 45%)' }}>Defina uma meta de reinvestimento para acompanhar seu crescimento</p>
            <Button onClick={() => setModalNovo(true)} style={{ background: 'hsl(270, 70%, 55%)', color: 'white' }}>
              <Plus className="w-4 h-4 mr-2" /> Definir Meta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Metas */}
      <Card className="surface-card border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'hsl(270, 70%, 65%)' }} />
            Histórico de Metas
          </CardTitle>
          <Button onClick={() => setModalNovo(true)} style={{ background: 'hsl(270, 70%, 55%)', color: 'white' }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Meta
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Meta %</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Meta (R$)</TableHead>
                  <TableHead className="text-right">Reinvestido</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma meta registrada ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  metas.map(meta => {
                    const prog = getProgressoMeta(meta);
                    const cor = getCorProgresso(prog.percentualRealizado);
                    return (
                      <TableRow key={meta.id} className="border-[#ffffff10] hover:bg-[#ffffff05]">
                        <TableCell className="text-sm whitespace-nowrap text-[#d1d5db]">
                          {formatarData(meta.periodoInicio)} – {formatarData(meta.periodoFim)}
                          {meta.ativa && <Badge className="ml-2 bg-[#8b5cf6]/20 text-[#c4b5fd] border-none text-[10px]">Ativa</Badge>}
                        </TableCell>
                        <TableCell className="text-center font-bold" style={{ color: 'hsl(270, 70%, 75%)' }}>{meta.percentualMeta}%</TableCell>
                        <TableCell className="text-right text-sm text-[#9ca3af]">{formatarMoeda(prog.receitaPeriodo)}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-[#d1d5db]">{formatarMoeda(prog.valorMeta)}</TableCell>
                        <TableCell className="text-right text-sm text-[#9ca3af]">{formatarMoeda(prog.reinvestidoPeriodo)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${cor.badge} border-none text-xs`}>
                            {prog.atingida ? '✓ Atingida' : `${prog.percentualRealizado.toFixed(0)}%`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10 h-8 w-8 p-0"
                            onClick={() => onRemover(meta.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nova Meta */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="surface-card border-none text-white">
          <DialogHeader>
            <DialogTitle>Nova Meta de Reinvestimento</DialogTitle>
            <DialogDescription className="text-[#8b92a5]">
              Defina qual % da sua receita no período deve ser reinvestida em compras de estoque.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[#d1d5db]">Percentual da Meta *</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.percentualMeta}
                  onChange={e => setForm({ ...form, percentualMeta: e.target.value })}
                  className="pr-8 input-dark border-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-[#8b92a5]">%</span>
              </div>
              <p className="text-xs text-[#8b92a5] mt-1">
                Ex: 30% → se sua receita for R$1.000, a meta é reinvestir R$300 em estoque
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#d1d5db]">Início do Período *</Label>
                <Input
                  type="date"
                  value={form.periodoInicio}
                  onChange={e => setForm({ ...form, periodoInicio: e.target.value })}
                  className="input-dark mt-1 border-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
              <div>
                <Label className="text-[#d1d5db]">Fim do Período *</Label>
                <Input
                  type="date"
                  value={form.periodoFim}
                  onChange={e => setForm({ ...form, periodoFim: e.target.value })}
                  className="input-dark mt-1 border-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ background: 'hsl(270, 40%, 15%)', borderColor: 'hsl(270, 50%, 25%)' }}>
              <input
                type="checkbox"
                id="ativa"
                checked={form.ativa}
                onChange={e => setForm({ ...form, ativa: e.target.checked })}
                className="rounded cursor-pointer"
                style={{ accentColor: 'hsl(270, 70%, 55%)' }}
              />
              <label htmlFor="ativa" className="text-sm cursor-pointer" style={{ color: 'hsl(270, 70%, 75%)' }}>
                Definir como meta ativa (desativa a meta anterior)
              </label>
            </div>

            <div>
              <Label className="text-[#d1d5db]">Observações</Label>
              <Input
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Ex: Meta do mês de fevereiro"
                className="input-dark mt-1 border-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNovo(false)} className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white">Cancelar</Button>
              <Button type="submit" style={{ background: 'hsl(270, 70%, 55%)', color: 'white' }}>
                <Target className="w-4 h-4 mr-2" /> Definir Meta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
