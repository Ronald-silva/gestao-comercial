import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Receipt, CheckCircle } from 'lucide-react';
import { formatarMoeda, formatarData, formasPagamento, statusPagamento } from '@/lib/utils';
import type { Produto, Venda, FormaPagamento } from '@/types';

interface VendasProps {
  produtos: Produto[];
  vendas: Venda[];
  onAdicionar: (venda: Omit<Venda, 'id' | 'criadoEm' | 'pagamento'>) => void;
  onRegistrarPagamento: (vendaId: string, parcelaNumero?: number) => void;
  onVerRecibo: (venda: Venda) => void;
}

export function Vendas({ produtos, vendas, onAdicionar, onRegistrarPagamento, onVerRecibo }: VendasProps) {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState<Venda | null>(null);

  const [formData, setFormData] = useState({
    produtoId: '',
    quantidade: '1',
    clienteNome: '',
    clienteContato: '',
    dataVenda: new Date().toISOString().split('T')[0],
    formaPagamento: 'pix' as FormaPagamento,
    numeroParcelas: '1',
    observacoes: '',
  });

  const vendasFiltradas = vendas.filter(v => {
    const matchBusca = v.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
                      v.produtoNome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFiltro === 'todas' || v.pagamento.status === statusFiltro;
    return matchBusca && matchStatus;
  });

  const produtoSelecionado = useMemo(() => 
    produtos.find(p => p.id === formData.produtoId),
    [produtos, formData.produtoId]
  );

  const valorTotal = useMemo(() => {
    if (!produtoSelecionado) return 0;
    return produtoSelecionado.precoVenda * parseInt(formData.quantidade || '1');
  }, [produtoSelecionado, formData.quantidade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoSelecionado) return;

    const venda = {
      produtoId: formData.produtoId,
      produtoNome: produtoSelecionado.nome,
      quantidade: parseInt(formData.quantidade),
      precoUnitario: produtoSelecionado.precoVenda,
      valorTotal,
      clienteNome: formData.clienteNome,
      clienteContato: formData.clienteContato,
      dataVenda: formData.dataVenda,
      formaPagamento: formData.formaPagamento,
      numeroParcelas: parseInt(formData.numeroParcelas),
      status: 'pendente' as const,
      observacoes: formData.observacoes,
    };

    onAdicionar(venda);
    resetForm();
    setModalAberto(false);
  };

  const resetForm = () => {
    setFormData({
      produtoId: '',
      quantidade: '1',
      clienteNome: '',
      clienteContato: '',
      dataVenda: new Date().toISOString().split('T')[0],
      formaPagamento: 'pix',
      numeroParcelas: '1',
      observacoes: '',
    });
  };

  const handleNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar vendas..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleNovo} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nova Venda */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Venda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="produto">Produto *</Label>
                <Select 
                  value={formData.produtoId} 
                  onValueChange={(v) => setFormData({ ...formData, produtoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem 
                        key={p.id} 
                        value={p.id}
                        disabled={p.quantidade === 0}
                      >
                        {p.quantidade === 0 ? '❌ ' : p.quantidade <= 3 ? '⚠️ ' : '✅ '}
                        {p.nome} - {formatarMoeda(p.precoVenda)} 
                        ({p.quantidade} em estoque)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {produtoSelecionado && (
                <div className={`col-span-2 p-3 rounded-lg ${
                  produtoSelecionado.quantidade === 0 
                    ? 'bg-red-50 border border-red-200' 
                    : produtoSelecionado.quantidade <= 3 
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm ${
                    produtoSelecionado.quantidade === 0 
                      ? 'text-red-800' 
                      : produtoSelecionado.quantidade <= 3 
                      ? 'text-orange-800'
                      : 'text-blue-800'
                  }`}>
                    <strong>Preço:</strong> {formatarMoeda(produtoSelecionado.precoVenda)} | 
                    <strong> Estoque:</strong> {' '}
                    <span className={produtoSelecionado.quantidade <= 3 ? 'font-bold' : ''}>
                      {produtoSelecionado.quantidade} unidades
                    </span>
                    {produtoSelecionado.quantidade === 0 && (
                      <span className="block mt-1 text-red-600 font-medium">⚠️ Produto sem estoque!</span>
                    )}
                    {produtoSelecionado.quantidade > 0 && produtoSelecionado.quantidade <= 3 && (
                      <span className="block mt-1 text-orange-600 font-medium">⚠️ Estoque baixo!</span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="quantidade">
                  Quantidade * 
                  {produtoSelecionado && (
                    <span className="text-xs text-gray-500 ml-1">
                      (máx: {produtoSelecionado.quantidade})
                    </span>
                  )}
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  max={produtoSelecionado?.quantidade || 1}
                  value={formData.quantidade}
                  onChange={(e) => {
                    const valor = parseInt(e.target.value) || 1;
                    const max = produtoSelecionado?.quantidade || 1;
                    setFormData({ ...formData, quantidade: Math.min(valor, max).toString() });
                  }}
                  disabled={!produtoSelecionado || produtoSelecionado.quantidade === 0}
                  required
                />
              </div>

              <div>
                <Label htmlFor="dataVenda">Data da Venda *</Label>
                <Input
                  id="dataVenda"
                  type="date"
                  value={formData.dataVenda}
                  onChange={(e) => setFormData({ ...formData, dataVenda: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                <Input
                  id="clienteNome"
                  value={formData.clienteNome}
                  onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                  placeholder="Nome completo do cliente"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="clienteContato">Contato do Cliente</Label>
                <Input
                  id="clienteContato"
                  value={formData.clienteContato}
                  onChange={(e) => setFormData({ ...formData, clienteContato: e.target.value })}
                  placeholder="Telefone, WhatsApp ou email"
                />
              </div>

              <div>
                <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                <Select 
                  value={formData.formaPagamento} 
                  onValueChange={(v) => setFormData({ ...formData, formaPagamento: v as FormaPagamento })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.formaPagamento === 'parcelado' || formData.formaPagamento === 'cartao') && (
                <div>
                  <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
                  <Input
                    id="numeroParcelas"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.numeroParcelas}
                    onChange={(e) => setFormData({ ...formData, numeroParcelas: e.target.value })}
                  />
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais"
                />
              </div>
            </div>

            {valorTotal > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-medium">Valor Total:</span>
                  <span className="text-2xl font-bold text-green-700">{formatarMoeda(valorTotal)}</span>
                </div>
                {parseInt(formData.numeroParcelas) > 1 && (
                  <p className="text-sm text-green-600 mt-1 text-center">
                    {formData.numeroParcelas}x de {formatarMoeda(valorTotal / parseInt(formData.numeroParcelas))}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={!produtoSelecionado || !formData.clienteNome || produtoSelecionado.quantidade === 0}
              >
                {produtoSelecionado?.quantidade === 0 ? 'Sem Estoque' : 'Registrar Venda'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={!!modalDetalhes} onOpenChange={() => setModalDetalhes(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {modalDetalhes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{modalDetalhes.clienteNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contato</p>
                  <p className="font-medium">{modalDetalhes.clienteContato || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Produto</p>
                  <p className="font-medium">{modalDetalhes.produtoNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quantidade</p>
                  <p className="font-medium">{modalDetalhes.quantidade}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data</p>
                  <p className="font-medium">{formatarData(modalDetalhes.dataVenda)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Forma de Pagamento</p>
                  <p className="font-medium">{formasPagamento[modalDetalhes.formaPagamento].label}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="text-xl font-bold">{formatarMoeda(modalDetalhes.valorTotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Recebido:</span>
                  <span className="text-green-600 font-medium">{formatarMoeda(modalDetalhes.pagamento.valorRecebido)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pendente:</span>
                  <span className="text-orange-600 font-medium">
                    {formatarMoeda(modalDetalhes.pagamento.valorTotal - modalDetalhes.pagamento.valorRecebido)}
                  </span>
                </div>
              </div>

              {modalDetalhes.pagamento.parcelas && modalDetalhes.pagamento.parcelas.length > 1 && (
                <div>
                  <h4 className="font-medium mb-2">Parcelas</h4>
                  <div className="space-y-2">
                    {modalDetalhes.pagamento.parcelas.map((parcela) => (
                      <div key={parcela.numero} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>Parcela {parcela.numero}</span>
                        <div className="flex items-center gap-3">
                          <span>{formatarMoeda(parcela.valor)}</span>
                          <span className="text-sm text-gray-500">Venc: {formatarData(parcela.dataVencimento)}</span>
                          {parcela.pago ? (
                            <Badge className="bg-green-100 text-green-700">Pago</Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                onRegistrarPagamento(modalDetalhes.id, parcela.numero);
                                setModalDetalhes({
                                  ...modalDetalhes,
                                  pagamento: {
                                    ...modalDetalhes.pagamento,
                                    parcelas: modalDetalhes.pagamento.parcelas?.map(p => 
                                      p.numero === parcela.numero 
                                        ? { ...p, pago: true, dataPagamento: new Date().toISOString().split('T')[0] }
                                        : p
                                    ),
                                    valorRecebido: modalDetalhes.pagamento.valorRecebido + parcela.valor,
                                    status: modalDetalhes.pagamento.valorRecebido + parcela.valor >= modalDetalhes.pagamento.valorTotal ? 'pago' : 'parcial'
                                  }
                                });
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Receber
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onVerRecibo(modalDetalhes)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Ver Recibo
                </Button>
                {modalDetalhes.pagamento.status !== 'pago' && !modalDetalhes.pagamento.parcelas && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      onRegistrarPagamento(modalDetalhes.id);
                      setModalDetalhes(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Receber Total
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            Histórico de Vendas ({vendasFiltradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🛒</span>
              <p className="text-gray-500">Nenhuma venda encontrada</p>
              <p className="text-sm text-gray-400 mt-1">Registre sua primeira venda para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasFiltradas.map((venda) => {
                    const forma = formasPagamento[venda.formaPagamento];
                    const status = statusPagamento[venda.pagamento.status];
                    
                    return (
                      <TableRow key={venda.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm">{formatarData(venda.dataVenda)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{venda.clienteNome}</p>
                            {venda.clienteContato && (
                              <p className="text-xs text-gray-500">{venda.clienteContato}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{venda.produtoNome}</p>
                          <p className="text-xs text-gray-500">{venda.quantidade}x {formatarMoeda(venda.precoUnitario)}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatarMoeda(venda.valorTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${forma.cor} text-white text-xs`}>
                            {forma.icone} {forma.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.cor.replace('bg-', 'bg-opacity-20 bg-')} ${status.textoCor}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setModalDetalhes(venda)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onVerRecibo(venda)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            {venda.pagamento.status !== 'pago' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRegistrarPagamento(venda.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
