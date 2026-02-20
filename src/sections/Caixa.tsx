import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Wallet, Zap, Banknote, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatarMoeda, formatarData, tiposMovimentacao } from '@/lib/utils';
import type { MovimentacaoCaixa, TipoMovimentacaoCaixa, Venda } from '@/types';

interface CaixaProps {
  movimentacoes: MovimentacaoCaixa[];
  vendas: Venda[];
  onAdicionar: (dados: Omit<MovimentacaoCaixa, 'id' | 'criadoEm'>) => void;
  onRemover: (id: string) => void;
  getSaldoCaixa: () => { saldoPix: number; saldoDinheiro: number; saldoTotal: number };
}

const TIPOS_LISTA = Object.entries(tiposMovimentacao).map(([key, val]) => ({
  value: key as TipoMovimentacaoCaixa,
  ...val,
}));

export function Caixa({ movimentacoes, vendas, onAdicionar, onRemover, getSaldoCaixa }: CaixaProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'pix' | 'dinheiro'>('todos');
  const [filtroDirecao, setFiltroDirecao] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [form, setForm] = useState({
    tipo: '' as TipoMovimentacaoCaixa | '',
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    vendaId: '',
    observacoes: '',
  });

  const saldos = useMemo(() => getSaldoCaixa(), [movimentacoes]);

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(m => {
      const okCanal = filtroCanal === 'todos' || m.canal === filtroCanal;
      const okDirecao = filtroDirecao === 'todos' || m.direcao === filtroDirecao;
      return okCanal && okDirecao;
    });
  }, [movimentacoes, filtroCanal, filtroDirecao]);

  const handleTipoChange = (tipo: TipoMovimentacaoCaixa) => {
    const info = tiposMovimentacao[tipo];
    setForm(prev => ({
      ...prev,
      tipo,
      descricao: info.label,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipo || !form.valor || !form.descricao) return;

    const info = tiposMovimentacao[form.tipo];
    onAdicionar({
      tipo: form.tipo,
      canal: info.canal as 'pix' | 'dinheiro',
      direcao: info.direcao as 'entrada' | 'saida',
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data: form.data,
      vendaId: form.vendaId || undefined,
      observacoes: form.observacoes || undefined,
    });

    resetModal();
  };

  const resetModal = () => {
    setModalNovo(false);
    setForm({ tipo: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], vendaId: '', observacoes: '' });
  };

  const totalEntradas = useMemo(() =>
    movimentacoes.filter(m => m.direcao === 'entrada').reduce((s, m) => s + m.valor, 0),
    [movimentacoes]
  );

  const totalSaidas = useMemo(() =>
    movimentacoes.filter(m => m.direcao === 'saida').reduce((s, m) => s + m.valor, 0),
    [movimentacoes]
  );

  return (
    <div className="space-y-6">
      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`border-l-4 ${saldos.saldoPix < 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Saldo PIX
              </p>
              {saldos.saldoPix < 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`text-2xl font-bold ${saldos.saldoPix < 0 ? 'text-red-600' : 'text-green-700'}`}>
              {formatarMoeda(saldos.saldoPix)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Conta bancária / app</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${saldos.saldoDinheiro < 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Caixa Dinheiro
              </p>
              {saldos.saldoDinheiro < 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`text-2xl font-bold ${saldos.saldoDinheiro < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {formatarMoeda(saldos.saldoDinheiro)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Dinheiro físico em mãos</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${saldos.saldoTotal < 0 ? 'border-l-red-500' : 'border-l-teal-500'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Total Geral
              </p>
              {saldos.saldoTotal < 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`text-2xl font-bold ${saldos.saldoTotal < 0 ? 'text-red-600' : 'text-teal-700'}`}>
              {formatarMoeda(saldos.saldoTotal)}
            </p>
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              <span className="text-green-600">↑ {formatarMoeda(totalEntradas)}</span>
              <span className="text-red-500">↓ {formatarMoeda(totalSaidas)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            Movimentações de Caixa
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={filtroCanal} onValueChange={v => setFiltroCanal(v as typeof filtroCanal)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroDirecao} onValueChange={v => setFiltroDirecao(v as typeof filtroDirecao)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setModalNovo(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" /> Nova Movimentação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Canal</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Nenhuma movimentação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  movimentacoesFiltradas.map(mov => {
                    const info = tiposMovimentacao[mov.tipo];
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap text-sm">{formatarData(mov.data)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${info?.bgCor || 'bg-gray-100'} ${info?.cor || 'text-gray-700'} border-0`}>
                            {info?.label || mov.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{mov.descricao}</TableCell>
                        <TableCell className="text-center">
                          {mov.canal === 'pix'
                            ? <span className="text-xs font-medium text-green-600 flex items-center justify-center gap-1"><Zap className="w-3 h-3" />PIX</span>
                            : <span className="text-xs font-medium text-emerald-600 flex items-center justify-center gap-1"><Banknote className="w-3 h-3" />Dinheiro</span>
                          }
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {mov.direcao === 'entrada' ? (
                            <span className="text-green-600 flex items-center justify-end gap-1">
                              <ArrowUpCircle className="w-4 h-4" /> {formatarMoeda(mov.valor)}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center justify-end gap-1">
                              <ArrowDownCircle className="w-4 h-4" /> {formatarMoeda(mov.valor)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            onClick={() => onRemover(mov.id)}
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

      {/* Modal Nova Movimentação */}
      <Dialog open={modalNovo} onOpenChange={resetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída no caixa. O canal (PIX ou Dinheiro) é definido automaticamente pelo tipo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de Movimentação *</Label>
              <Select value={form.tipo} onValueChange={v => handleTipoChange(v as TipoMovimentacaoCaixa)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Entradas</div>
                  {TIPOS_LISTA.filter(t => t.direcao === 'entrada').map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase mt-1">Saídas</div>
                  {TIPOS_LISTA.filter(t => t.direcao === 'saida').map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.tipo && (
                <p className="text-xs text-gray-500 mt-1">
                  Canal: <strong>{tiposMovimentacao[form.tipo].canal === 'pix' ? 'PIX' : 'Dinheiro físico'}</strong>
                </p>
              )}
            </div>

            <div>
              <Label>Descrição *</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhe a movimentação"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })}
                  required
                />
              </div>
            </div>

            {(form.tipo === 'entrada_venda_pix' || form.tipo === 'entrada_venda_dinheiro') && vendas.length > 0 && (
              <div>
                <Label>Vincular à Venda (opcional)</Label>
                <Select value={form.vendaId} onValueChange={v => setForm({ ...form, vendaId: v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {vendas.slice(0, 20).map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.clienteNome} — {formatarMoeda(v.valorTotal)} ({formatarData(v.dataVenda)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Input
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={resetModal}>Cancelar</Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!form.tipo || !form.valor}
              >
                <Plus className="w-4 h-4 mr-2" /> Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
