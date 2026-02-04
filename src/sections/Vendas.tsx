import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Eye, Receipt, CheckCircle, Trash2, ShoppingCart } from 'lucide-react';
import { formatarMoeda, formatarData, statusPagamento } from '@/lib/utils';
import type { Produto, Venda, FormaPagamento, ItemVenda } from '@/types';

interface VendasProps {
  produtos: Produto[];
  vendas: Venda[];
  onAdicionar: (venda: Omit<Venda, 'id' | 'criadoEm' | 'pagamento'>) => void;
  onRegistrarPagamento: (vendaId: string, valor: number, data: string, obs?: string) => void;
  onVerRecibo: (venda: Venda) => void;
}

export function Vendas({ produtos, vendas, onAdicionar, onRegistrarPagamento, onVerRecibo }: VendasProps) {
  const [abaAtiva, setAbaAtiva] = useState('nova');
  
  // Estados para Nova Venda
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [itemAtual, setItemAtual] = useState({
    produtoId: '',
    quantidade: '1',
  });
  
  const [dadosVenda, setDadosVenda] = useState({
    clienteNome: '',
    clienteContato: '',
    dataVenda: new Date().toISOString().split('T')[0],
    formaPagamento: 'pix' as FormaPagamento,
    numeroParcelas: '1',
    observacoes: '',
  });

  // Estados para Histórico
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('todas');
  const [modalDetalhes, setModalDetalhes] = useState<Venda | null>(null);

  // --- LÓGICA DO CARRINHO ---

  const produtoSelecionado = useMemo(() => 
    produtos.find(p => p.id === itemAtual.produtoId),
    [produtos, itemAtual.produtoId]
  );

  const adicionarAoCarrinho = () => {
    if (!produtoSelecionado) return;

    const qtd = parseInt(itemAtual.quantidade);
    
    // Verificar se já existe no carrinho para somar
    const itemExistenteIndex = carrinho.findIndex(i => i.produtoId === produtoSelecionado.id);
    
    if (itemExistenteIndex >= 0) {
      // Validar estoque total (carrinho + nova qtd)
      const qtdAtualNoCarrinho = carrinho[itemExistenteIndex].quantidade;
      if (qtdAtualNoCarrinho + qtd > produtoSelecionado.quantidade) {
        alert(`Estoque insuficiente! Você já tem ${qtdAtualNoCarrinho} no carrinho. Estoque total: ${produtoSelecionado.quantidade}`);
        return;
      }
      
      const novoCarrinho = [...carrinho];
      novoCarrinho[itemExistenteIndex].quantidade += qtd;
      setCarrinho(novoCarrinho);
    } else {
      setCarrinho([
        ...carrinho, 
        {
          produtoId: produtoSelecionado.id,
          produtoNome: produtoSelecionado.nome,
          quantidade: qtd,
          precoUnitario: produtoSelecionado.precoVenda,
        }
      ]);
    }

    // Resetar campos do item
    setItemAtual({ ...itemAtual, quantidade: '1', produtoId: '' });
  };

  const removerDoCarrinho = (index: number) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const valorTotalCarrinho = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0);
  }, [carrinho]);

  const finalizarVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (carrinho.length === 0) return;

    const venda = {
      itens: carrinho,
      valorTotal: valorTotalCarrinho,
      clienteNome: dadosVenda.clienteNome,
      clienteContato: dadosVenda.clienteContato,
      dataVenda: dadosVenda.dataVenda,
      formaPagamento: dadosVenda.formaPagamento,
      numeroParcelas: parseInt(dadosVenda.numeroParcelas),
      status: 'pendente' as const,
      observacoes: dadosVenda.observacoes,
    };

    onAdicionar(venda);
    
    // Resetar tudo
    setCarrinho([]);
    setDadosVenda({
      clienteNome: '',
      clienteContato: '',
      dataVenda: new Date().toISOString().split('T')[0],
      formaPagamento: 'pix',
      numeroParcelas: '1',
      observacoes: '',
    });
    setAbaAtiva('historico'); // Ir para histórico para ver a venda
  };

  // --- LÓGICA DO HISTÓRICO ---

  const vendasFiltradas = vendas.filter(v => {
    const matchBusca = v.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
                      (v.itens && v.itens.some(i => i.produtoNome.toLowerCase().includes(busca.toLowerCase()))) ||
                      v.id.includes(busca);
    const matchStatus = statusFiltro === 'todas' || v.pagamento.status === statusFiltro;
    return matchBusca && matchStatus;
  });

  return (
    <div className="space-y-6">
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="nova">Nova Venda</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Vendas</TabsTrigger>
        </TabsList>

        {/* ABA NOVA VENDA */}
        <TabsContent value="nova">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Esquerda: Adicionar Produtos */}
            <Card className="lg:col-span-1 border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">1. Adicionar Produtos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Selecione o Produto</Label>
                  <Select 
                    value={itemAtual.produtoId} 
                    onValueChange={(v) => setItemAtual({ ...itemAtual, produtoId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem 
                          key={p.id} 
                          value={p.id}
                          disabled={p.quantidade === 0}
                        >
                          {p.quantidade === 0 ? '❌ ' : p.quantidade <= 3 ? '⚠️ ' : '✅ '}
                          {p.nome} ({formatarMoeda(p.precoVenda)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {produtoSelecionado && (
                  <div className={`p-3 rounded-lg border ${
                    produtoSelecionado.quantidade === 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className="text-sm font-medium">
                      Estoque: {produtoSelecionado.quantidade} | Preço: {formatarMoeda(produtoSelecionado.precoVenda)}
                    </p>
                  </div>
                )}

                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    max={produtoSelecionado?.quantidade || 1}
                    value={itemAtual.quantidade}
                    onChange={(e) => setItemAtual({ ...itemAtual, quantidade: e.target.value })}
                    disabled={!produtoSelecionado}
                  />
                </div>

                <Button 
                  onClick={adicionarAoCarrinho} 
                  className="w-full"
                  disabled={!produtoSelecionado || parseInt(itemAtual.quantidade) < 1}
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>

            {/* Centro/Direita: Carrinho e Finalização */}
            <Card className="lg:col-span-2 border-t-4 border-t-green-500 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>2. Carrinho e Pagamento</span>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    Total: {formatarMoeda(valorTotalCarrinho)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6">
                
                {/* Tabela Carrinho */}
                <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[150px]">
                  {carrinho.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400">
                      <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                      <p>O carrinho está vazio</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-20 text-center">Qtd</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {carrinho.map((item, idx) => (
                          <TableRow key={idx} className="bg-white">
                            <TableCell className="font-medium">{item.produtoNome}</TableCell>
                            <TableCell className="text-center">{item.quantidade}</TableCell>
                            <TableCell className="text-right">{formatarMoeda(item.quantidade * item.precoUnitario)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => removerDoCarrinho(idx)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Formulário Cliente e Pagamento */}
                <form id="form-venda" onSubmit={finalizarVenda} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cliente">Nome do Cliente *</Label>
                      <Input 
                        id="cliente" 
                        value={dadosVenda.clienteNome}
                        onChange={e => setDadosVenda({...dadosVenda, clienteNome: e.target.value})}
                        required
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contato">Contato</Label>
                      <Input 
                        id="contato" 
                        value={dadosVenda.clienteContato}
                        onChange={e => setDadosVenda({...dadosVenda, clienteContato: e.target.value})}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Data</Label>
                        <Input 
                          type="date" 
                          value={dadosVenda.dataVenda}
                          onChange={e => setDadosVenda({...dadosVenda, dataVenda: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label>Pagamento *</Label>
                        <Select 
                          value={dadosVenda.formaPagamento} 
                          onValueChange={(v) => setDadosVenda({ ...dadosVenda, formaPagamento: v as FormaPagamento })}
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
                    </div>

                    {(dadosVenda.formaPagamento === 'parcelado' || dadosVenda.formaPagamento === 'cartao') && (
                      <div>
                        <Label>Parcelas</Label>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={dadosVenda.numeroParcelas}
                          onChange={(e) => setDadosVenda({ ...dadosVenda, numeroParcelas: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Observações</Label>
                    <Input 
                      value={dadosVenda.observacoes}
                      onChange={e => setDadosVenda({...dadosVenda, observacoes: e.target.value})}
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t p-4 flex justify-end gap-3">
                 <Button variant="outline" type="button" onClick={() => {
                   setCarrinho([]);
                   setItemAtual({...itemAtual, produtoId: ''});
                 }}>
                   Limpar
                 </Button>
                 <Button 
                   type="submit" 
                   form="form-venda" 
                   className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                   disabled={carrinho.length === 0 || !dadosVenda.clienteNome}
                 >
                   <CheckCircle className="w-4 h-4 mr-2" /> Finalizar Venda
                 </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* ABA HISTÓRICO */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <CardTitle>Histórico de Transações</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Buscar por cliente ou produto..." 
                      className="pl-9" 
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                    />
                  </div>
                  <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todos</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Resumo</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhuma venda encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendasFiltradas.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell className="whitespace-nowrap">{formatarData(venda.dataVenda)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{venda.clienteNome}</div>
                            <div className="text-xs text-gray-500">{venda.clienteContato}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {venda.itens?.length || 0} itens
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                              {venda.itens?.map(i => i.produtoNome).join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatarMoeda(venda.valorTotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={venda.pagamento.status === 'pago' ? 'default' : 'secondary'} className={
                              venda.pagamento.status === 'pago' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }>
                              {statusPagamento[venda.pagamento.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setModalDetalhes(venda)}>
                                <Eye className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onVerRecibo(venda)}>
                                <Receipt className="w-4 h-4 text-purple-500" />
                              </Button>
                              {venda.pagamento.status !== 'pago' && (
                                <Button variant="ghost" size="icon" onClick={() => setModalDetalhes(venda)}>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DETALHES FINANCEIROS REFORMULADO */}
      <Dialog open={!!modalDetalhes} onOpenChange={() => setModalDetalhes(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Venda</DialogTitle>
          </DialogHeader>
          {modalDetalhes && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Cliente</p>
                  <p className="font-medium truncate">{modalDetalhes.clienteNome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Venda</p>
                  <p className="font-medium text-blue-600">{formatarMoeda(modalDetalhes.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Já Recebido</p>
                  <p className="font-medium text-green-600">{formatarMoeda(modalDetalhes.pagamento.valorRecebido)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">A Receber</p>
                  <p className="font-bold text-orange-600">
                    {formatarMoeda(modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Novo Pagamento */}
                <div className="space-y-4">
                  <h4 className="font-medium border-b pb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Registrar Pagamento
                  </h4>
                  
                  {modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido <= 0.01 ? (
                    <div className="p-4 bg-green-100 text-green-800 rounded-md text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold">Venda Quitada!</p>
                      <p className="text-sm">Não há débitos pendentes.</p>
                    </div>
                  ) : (
                    <form 
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const valor = parseFloat((form.elements.namedItem('valor') as HTMLInputElement).value);
                        const data = (form.elements.namedItem('data') as HTMLInputElement).value;
                        const obs = (form.elements.namedItem('obs') as HTMLInputElement).value;
                        
                        onRegistrarPagamento(modalDetalhes.id, valor, data, obs);
                        setModalDetalhes(null); // Fecha modal após pagar
                      }}
                    >
                      <div>
                        <Label>Valor do Pagamento</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                          <Input 
                            name="valor"
                            type="number" 
                            step="0.01" 
                            max={modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido}
                            defaultValue={(modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido).toFixed(2)}
                            className="pl-8 font-bold text-lg"
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Data do Pagamento</Label>
                        <Input name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                      </div>
                      <div>
                        <Label>Observação (Opcional)</Label>
                        <Input name="obs" placeholder="Ex: Pix, Adiantamento..." />
                      </div>
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        Confirmar Baixa
                      </Button>
                    </form>
                  )}
                </div>

                {/* Lado Direito: Histórico e Parcelas */}
                <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
                  <Tabs defaultValue="historico">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="historico">Histórico</TabsTrigger>
                      <TabsTrigger value="parcelas">Parcelas Originais</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="historico" className="space-y-3 mt-4">
                      {(!modalDetalhes.pagamento.lancamentos || modalDetalhes.pagamento.lancamentos.length === 0) ? (
                        <p className="text-center text-gray-500 text-sm py-4">Nenhum pagamento registrado.</p>
                      ) : (
                        modalDetalhes.pagamento.lancamentos.map((lanc, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-white border rounded shadow-sm">
                            <div>
                              <p className="font-bold text-green-700">{formatarMoeda(lanc.valor)}</p>
                              <p className="text-xs text-gray-500">{formatarData(lanc.data)}</p>
                            </div>
                            {lanc.observacao && (
                              <p className="text-xs text-gray-400 italic max-w-[100px] truncate">{lanc.observacao}</p>
                            )}
                          </div>
                        ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="parcelas" className="space-y-3 mt-4">
                      {modalDetalhes.pagamento.parcelas?.map((p, i) => (
                        <div key={i} className={`flex justify-between items-center p-2 border rounded ${p.pago ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                          <div>
                            <span className="text-sm font-medium">Parcela {p.numero}</span>
                            <p className="text-xs text-gray-500">Venc: {formatarData(p.dataVencimento)}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-medium">{formatarMoeda(p.valor)}</p>
                             {p.pago ? (
                               <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">Pago</Badge>
                             ) : (
                               <Badge variant="outline" className="text-[10px]">Pendente</Badge>
                             )}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setModalDetalhes(null)}>Fechar</Button>
                <Button onClick={() => onVerRecibo(modalDetalhes)}> <Receipt className="w-4 h-4 mr-2" /> Recibo</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
