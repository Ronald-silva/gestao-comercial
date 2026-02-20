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
    if (pct >= 80) return { barra: 'bg-green-500', texto: 'text-green-700', badge: 'bg-green-100 text-green-700' };
    if (pct >= 50) return { barra: 'bg-yellow-400', texto: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
    return { barra: 'bg-red-500', texto: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="space-y-6">
      {/* Meta Ativa — Card Destaque */}
      {metaAtiva && progressoAtivo ? (
        <>
          {/* Alerta de baixo investimento */}
          {progressoAtivo.percentualRealizado < 50 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800">Reinvestimento abaixo da meta!</p>
                <p className="text-sm text-orange-700 mt-0.5">
                  Você reinvestiu apenas <strong>{progressoAtivo.percentualRealizado.toFixed(0)}%</strong> da meta.
                  Faltam <strong>{formatarMoeda(progressoAtivo.faltando)}</strong> para atingir o alvo.
                  Compre mais estoque!
                </p>
              </div>
            </div>
          )}

          {/* Card progresso */}
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-violet-800">
                  <Target className="w-5 h-5" />
                  Meta Ativa — {metaAtiva.percentualMeta}% da Receita
                </CardTitle>
                <Badge className={getCorProgresso(progressoAtivo.percentualRealizado).badge}>
                  {progressoAtivo.atingida ? '✓ Atingida' : `${progressoAtivo.percentualRealizado.toFixed(0)}% realizado`}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {formatarData(metaAtiva.periodoInicio)} até {formatarData(metaAtiva.periodoFim)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progresso</span>
                  <span className={`font-bold ${getCorProgresso(progressoAtivo.percentualRealizado).texto}`}>
                    {progressoAtivo.percentualRealizado.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${getCorProgresso(progressoAtivo.percentualRealizado).barra}`}
                    style={{ width: `${Math.min(100, progressoAtivo.percentualRealizado)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Reinvestido: <strong>{formatarMoeda(progressoAtivo.reinvestidoPeriodo)}</strong> de <strong>{formatarMoeda(progressoAtivo.valorMeta)}</strong>
                </p>
              </div>

              {/* 3 cards de números */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border text-center">
                  <p className="text-xs text-gray-500">Receita no Período</p>
                  <p className="font-bold text-blue-700 text-lg">{formatarMoeda(progressoAtivo.receitaPeriodo)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border text-center">
                  <p className="text-xs text-gray-500">Meta ({metaAtiva.percentualMeta}%)</p>
                  <p className="font-bold text-violet-700 text-lg">{formatarMoeda(progressoAtivo.valorMeta)}</p>
                </div>
                <div className={`rounded-lg p-3 border text-center ${progressoAtivo.faltando > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className="text-xs text-gray-500">
                    {progressoAtivo.faltando > 0 ? 'Faltando' : 'Excedente'}
                  </p>
                  <p className={`font-bold text-lg ${progressoAtivo.faltando > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
        <Card className="border-dashed border-2 border-violet-200 bg-violet-50">
          <CardContent className="py-10 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-violet-400 opacity-50" />
            <p className="text-gray-600 font-medium">Nenhuma meta ativa</p>
            <p className="text-sm text-gray-500 mb-4">Defina uma meta de reinvestimento para acompanhar seu crescimento</p>
            <Button onClick={() => setModalNovo(true)} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" /> Definir Meta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Metas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Histórico de Metas
          </CardTitle>
          <Button onClick={() => setModalNovo(true)} className="bg-violet-600 hover:bg-violet-700">
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
                      <TableRow key={meta.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatarData(meta.periodoInicio)} – {formatarData(meta.periodoFim)}
                          {meta.ativa && <Badge className="ml-2 bg-violet-100 text-violet-700 text-[10px]">Ativa</Badge>}
                        </TableCell>
                        <TableCell className="text-center font-bold text-violet-700">{meta.percentualMeta}%</TableCell>
                        <TableCell className="text-right text-sm">{formatarMoeda(prog.receitaPeriodo)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatarMoeda(prog.valorMeta)}</TableCell>
                        <TableCell className="text-right text-sm">{formatarMoeda(prog.reinvestidoPeriodo)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${cor.badge} text-xs`}>
                            {prog.atingida ? '✓ Atingida' : `${prog.percentualRealizado.toFixed(0)}%`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta de Reinvestimento</DialogTitle>
            <DialogDescription>
              Defina qual % da sua receita no período deve ser reinvestida em compras de estoque.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Percentual da Meta *</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.percentualMeta}
                  onChange={e => setForm({ ...form, percentualMeta: e.target.value })}
                  className="pr-8"
                  required
                />
                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ex: 30% → se sua receita for R$1.000, a meta é reinvestir R$300 em estoque
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início do Período *</Label>
                <Input
                  type="date"
                  value={form.periodoInicio}
                  onChange={e => setForm({ ...form, periodoInicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Fim do Período *</Label>
                <Input
                  type="date"
                  value={form.periodoFim}
                  onChange={e => setForm({ ...form, periodoFim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-100">
              <input
                type="checkbox"
                id="ativa"
                checked={form.ativa}
                onChange={e => setForm({ ...form, ativa: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="ativa" className="text-sm text-violet-800 cursor-pointer">
                Definir como meta ativa (desativa a meta anterior)
              </label>
            </div>

            <div>
              <Label>Observações</Label>
              <Input
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Ex: Meta do mês de fevereiro"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNovo(false)}>Cancelar</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                <Target className="w-4 h-4 mr-2" /> Definir Meta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
