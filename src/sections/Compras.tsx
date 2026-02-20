import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShoppingBag, ChevronDown, ChevronUp, PackageSearch, TrendingDown } from 'lucide-react';
import { formatarMoeda, formatarData, formasPagamento } from '@/lib/utils';
import type { Compra, ItemCompra, Produto, FormaPagamento } from '@/types';

interface ComprasProps {
  compras: Compra[];
  produtos: Produto[];
  onAdicionar: (dados: Omit<Compra, 'id' | 'criadoEm'>) => void;
  onRemover: (id: string) => void;
  getTotalInvestidoEstoque: () => number;
}

export function Compras({ compras, produtos, onAdicionar, onRemover, getTotalInvestidoEstoque }: ComprasProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [itemAtual, setItemAtual] = useState({ produtoId: '', produtoNome: '', quantidade: '1', precoUnitario: '' });
  const [form, setForm] = useState({
    fornecedor: '',
    data: new Date().toISOString().split('T')[0],
    formaPagamento: 'dinheiro' as FormaPagamento,
    observacoes: '',
  });

  const totalCarrinho = useMemo(() =>
    itens.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0),
    [itens]
  );

  const comprasMes = useMemo(() => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    return compras
      .filter(c => new Date(c.data) >= inicioMes)
      .reduce((sum, c) => sum + c.valorTotal, 0);
  }, [compras]);

  const fornecedoresUnicos = useMemo(() =>
    new Set(compras.map(c => c.fornecedor)).size,
    [compras]
  );

  const adicionarItem = () => {
    const qtd = parseInt(itemAtual.quantidade) || 1;
    const preco = parseFloat(itemAtual.precoUnitario) || 0;
    if (!itemAtual.produtoNome.trim() || preco <= 0) return;

    setItens(prev => [...prev, {
      produtoId: itemAtual.produtoId || undefined,
      produtoNome: itemAtual.produtoNome,
      quantidade: qtd,
      precoUnitario: preco,
    }]);
    setItemAtual({ produtoId: '', produtoNome: '', quantidade: '1', precoUnitario: '' });
  };

  const removerItem = (index: number) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleProdutoSelect = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      setItemAtual(prev => ({
        ...prev,
        produtoId,
        produtoNome: produto.nome,
        precoUnitario: produto.precoCusto.toString(),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) return;

    onAdicionar({
      fornecedor: form.fornecedor,
      itens,
      valorTotal: totalCarrinho,
      data: form.data,
      formaPagamento: form.formaPagamento,
      observacoes: form.observacoes,
    });

    setModalNovo(false);
    setItens([]);
    setForm({ fornecedor: '', data: new Date().toISOString().split('T')[0], formaPagamento: 'dinheiro', observacoes: '' });
  };

  const resetModal = () => {
    setModalNovo(false);
    setItens([]);
    setItemAtual({ produtoId: '', produtoNome: '', quantidade: '1', precoUnitario: '' });
    setForm({ fornecedor: '', data: new Date().toISOString().split('T')[0], formaPagamento: 'dinheiro', observacoes: '' });
  };

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Total Investido em Estoque</p>
            <p className="text-2xl font-bold text-cyan-700 mt-1">{formatarMoeda(getTotalInvestidoEstoque())}</p>
            <p className="text-xs text-gray-400 mt-1">Todas as compras</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Compras Este Mês</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{formatarMoeda(comprasMes)}</p>
            <p className="text-xs text-gray-400 mt-1">{compras.filter(c => {
              const ini = new Date(); ini.setDate(1); ini.setHours(0,0,0,0);
              return new Date(c.data) >= ini;
            }).length} compras</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Fornecedores</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{fornecedoresUnicos}</p>
            <p className="text-xs text-gray-400 mt-1">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-600" />
            Histórico de Compras
          </CardTitle>
          <Button onClick={() => setModalNovo(true)} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" /> Nova Compra
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      <PackageSearch className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Nenhuma compra registrada ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  compras.map(compra => (
                    <>
                      <TableRow
                        key={compra.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandida(expandida === compra.id ? null : compra.id)}
                      >
                        <TableCell className="whitespace-nowrap">{formatarData(compra.data)}</TableCell>
                        <TableCell className="font-medium">{compra.fornecedor}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {compra.itens.length === 1
                              ? compra.itens[0].produtoNome
                              : `${compra.itens.length} itens`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${compra.formaPagamento === 'pix' ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formasPagamento[compra.formaPagamento]?.label || compra.formaPagamento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-cyan-700">
                          {formatarMoeda(compra.valorTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {expandida === compra.id
                              ? <ChevronUp className="w-4 h-4 text-gray-400" />
                              : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                              onClick={e => { e.stopPropagation(); onRemover(compra.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandida === compra.id && (
                        <TableRow key={`${compra.id}-detalhes`} className="bg-gray-50">
                          <TableCell colSpan={6} className="py-3 px-4">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Itens desta compra:</p>
                              {compra.itens.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                                  <span>{item.produtoNome} × {item.quantidade}</span>
                                  <span className="font-medium">{formatarMoeda(item.quantidade * item.precoUnitario)}</span>
                                </div>
                              ))}
                              {compra.observacoes && (
                                <p className="text-xs text-gray-500 pt-1 italic">Obs: {compra.observacoes}</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nova Compra */}
      <Dialog open={modalNovo} onOpenChange={resetModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Compra</DialogTitle>
            <DialogDescription>
              Registre uma compra de estoque. O valor será lançado automaticamente no Caixa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dados da compra */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label>Fornecedor *</Label>
                <Input
                  value={form.fornecedor}
                  onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                  placeholder="Ex: Atacado Central"
                  required
                />
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
              <div>
                <Label>Forma de Pagamento *</Label>
                <Select value={form.formaPagamento} onValueChange={v => setForm({ ...form, formaPagamento: v as FormaPagamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adicionar itens */}
            <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Adicionar Itens</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Produto</Label>
                  <Select value={itemAtual.produtoId} onValueChange={handleProdutoSelect}>
                    <SelectTrigger><SelectValue placeholder="Produto cadastrado..." /></SelectTrigger>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-1"
                    placeholder="Ou nome livre..."
                    value={itemAtual.produtoNome}
                    onChange={e => setItemAtual({ ...itemAtual, produtoNome: e.target.value, produtoId: '' })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={itemAtual.quantidade}
                    onChange={e => setItemAtual({ ...itemAtual, quantidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Custo Unit. (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemAtual.precoUnitario}
                    onChange={e => setItemAtual({ ...itemAtual, precoUnitario: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={adicionarItem} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Item
              </Button>

              {/* Lista de itens */}
              {itens.length > 0 && (
                <div className="space-y-1 mt-2">
                  {itens.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white rounded p-2 text-sm border">
                      <span>{item.produtoNome} × {item.quantidade}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatarMoeda(item.quantidade * item.precoUnitario)}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removerItem(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1 font-bold text-cyan-700">
                    <span>Total da Compra:</span>
                    <span>{formatarMoeda(totalCarrinho)}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Observações</Label>
              <Input
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Ex: Compra no atacado bairro X"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={resetModal}>Cancelar</Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700"
                disabled={itens.length === 0 || !form.fornecedor}
              >
                <TrendingDown className="w-4 h-4 mr-2" /> Registrar Compra
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
