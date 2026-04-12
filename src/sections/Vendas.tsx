import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Eye, Receipt, CheckCircle, Trash2, ShoppingCart, HandCoins, AlertTriangle } from 'lucide-react';
import { formatarMoeda, formatarData, statusPagamento } from '@/lib/utils';
import { useDados } from '@/hooks/useDados';
import type { Produto, Venda, Emprestimo, FormaPagamento, ItemVenda } from '@/types';

interface VendasProps {
  produtos: Produto[];
  vendas: Venda[];
  onAdicionar: (venda: Omit<Venda, 'id' | 'criadoEm' | 'pagamento'>) => void;
  onAdicionarEmprestimo: (dados: Omit<Emprestimo, 'id' | 'criadoEm' | 'pagamento' | 'valorTotal' | 'valorJurosPeriodico'>) => void;
  onRegistrarPagamento: (vendaId: string, valor: number, data: string, obs?: string) => void;
  onVerRecibo: (venda: Venda) => void;
}

export function Vendas({ produtos, vendas, onAdicionar, onAdicionarEmprestimo, onRegistrarPagamento, onVerRecibo }: VendasProps) {
  const { clientes } = useDados();
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

  // Estado para empréstimo opcional na mesma transação
  const [incluirEmprestimo, setIncluirEmprestimo] = useState(false);
  const [dadosEmprestimo, setDadosEmprestimo] = useState({
    valorSolicitado: '',
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    // Se houver empréstimo opcional, registrar também
    if (incluirEmprestimo && parseFloat(dadosEmprestimo.valorSolicitado) > 0) {
      onAdicionarEmprestimo({
        clienteNome: dadosVenda.clienteNome,
        tipoModalidade: 'amortizado',
        taxaJuros: 0.20,
        valorConcedido: parseFloat(dadosEmprestimo.valorSolicitado),
        dataConcessao: dadosVenda.dataVenda,
        dataVencimento: dadosEmprestimo.dataVencimento,
        observacoes: `Empréstimo vinculado à venda de ${dadosVenda.dataVenda}`,
        status: 'pendente',
      });
    }

    // Resetar tudo
    setCarrinho([]);
    setIncluirEmprestimo(false);
    setDadosEmprestimo({
      valorSolicitado: '',
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setDadosVenda({
      clienteNome: '',
      clienteContato: '',
      dataVenda: new Date().toISOString().split('T')[0],
      formaPagamento: 'pix',
      numeroParcelas: '1',
      observacoes: '',
    });
    setAbaAtiva('historico');
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
            <Card className="surface-card lg:col-span-1 border-t-4 border-t-blue-500 border-l-0 border-r-0 border-b-0">
              <CardHeader>
                <CardTitle className="text-lg text-white">1. Adicionar Produtos</CardTitle>
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
                    produtoSelecionado.quantidade === 0 ? 'bg-[#351010] border-red-900/50 text-[#ef4444]' : 'bg-[#101b35] border-blue-900/50 text-[#60a5fa]'
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
            <Card className="surface-card lg:col-span-2 border-t-4 border-t-green-500 border-l-0 border-r-0 border-b-0 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center text-white">
                  <span>2. Carrinho e Pagamento</span>
                  <Badge variant="secondary" className="text-base px-3 py-1 bg-[#2a2d36] text-white border-none">
                    Total: {formatarMoeda(valorTotalCarrinho)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6">
                
                {/* Tabela Carrinho */}
                <div className="border border-[#ffffff10] rounded-md overflow-hidden surface-card-2 min-h-[150px]">
                  {carrinho.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-[#8b92a5]">
                      <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                      <p>O carrinho está vazio</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-[#00000020]">
                        <TableRow className="border-[#ffffff10]">
                          <TableHead className="text-[#8b92a5]">Produto</TableHead>
                          <TableHead className="w-20 text-center text-[#8b92a5]">Qtd</TableHead>
                          <TableHead className="text-right text-[#8b92a5]">Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {carrinho.map((item, idx) => (
                          <TableRow key={idx} className="border-[#ffffff10] hover:bg-[#ffffff05]">
                            <TableCell className="font-medium text-[#d1d5db]">{item.produtoNome}</TableCell>
                            <TableCell className="text-center text-[#9ca3af]">{item.quantidade}</TableCell>
                            <TableCell className="text-right text-[#9ca3af]">{formatarMoeda(item.quantidade * item.precoUnitario)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => removerDoCarrinho(idx)} className="text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10 h-8 w-8 p-0">
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
                      <Label htmlFor="cliente" className="text-[#d1d5db]">Nome do Cliente *</Label>
                      <Input
                        id="cliente"
                        value={dadosVenda.clienteNome}
                        onChange={e => setDadosVenda({...dadosVenda, clienteNome: e.target.value})}
                        required
                        placeholder="Ex: João Silva"
                        className="input-dark mt-1 border-none"
                      />
                      {(() => {
                        const match = clientes.find(c => c.nome.toLowerCase() === dadosVenda.clienteNome.toLowerCase());
                        if (!match || match.score !== 'lento') return null;
                        return (
                          <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-md" style={{ background: 'hsl(38,95%,54%,0.12)', border: '1px solid hsl(38,95%,54%,0.25)' }}>
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(38,95%,54%)' }} />
                            <p className="text-xs" style={{ color: 'hsl(38,95%,54%)' }}>
                              Cliente com pagamento lento — última compra levou {match.tempoMedioPagamento}d em média. Considere exigir pagamento à vista.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <Label htmlFor="contato" className="text-[#d1d5db]">Contato</Label>
                      <Input 
                        id="contato" 
                        value={dadosVenda.clienteContato}
                        onChange={e => setDadosVenda({...dadosVenda, clienteContato: e.target.value})}
                        placeholder="(00) 00000-0000"
                        className="input-dark mt-1 border-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[#d1d5db]">Data</Label>
                        <Input 
                          type="date" 
                          value={dadosVenda.dataVenda}
                          onChange={e => setDadosVenda({...dadosVenda, dataVenda: e.target.value})}
                          required
                          className="input-dark mt-1 border-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div>
                        <Label className="text-[#d1d5db]">Pagamento *</Label>
                        <Select 
                          value={dadosVenda.formaPagamento} 
                          onValueChange={(v) => setDadosVenda({ ...dadosVenda, formaPagamento: v as FormaPagamento })}
                        >
                          <SelectTrigger className="input-dark border-none mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1b23] border-[#374151] text-white">
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
                        <Label className="text-[#d1d5db]">Parcelas</Label>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={dadosVenda.numeroParcelas}
                          onChange={(e) => setDadosVenda({ ...dadosVenda, numeroParcelas: e.target.value })}
                          className="input-dark mt-1 border-none"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label className="text-[#d1d5db]">Observações</Label>
                    <Input
                      value={dadosVenda.observacoes}
                      onChange={e => setDadosVenda({...dadosVenda, observacoes: e.target.value})}
                      className="input-dark mt-1 border-none"
                    />
                  </div>
                </form>

                {/* Seção opcional: Empréstimo na mesma transação */}
                <div className={`rounded-lg border-2 transition-colors ${incluirEmprestimo ? 'border-[#8b5cf6] bg-[#8b5cf6]/10' : 'border-dashed border-[#ffffff20] bg-transparent'}`}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 p-3 text-left"
                    onClick={() => setIncluirEmprestimo(!incluirEmprestimo)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${incluirEmprestimo ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'border-[#4b5563]'}`}>
                      {incluirEmprestimo && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <HandCoins className={`w-4 h-4 shrink-0 ${incluirEmprestimo ? 'text-[#a78bfa]' : 'text-[#9ca3af]'}`} />
                    <span className={`text-sm font-medium ${incluirEmprestimo ? 'text-[#c4b5fd]' : 'text-[#9ca3af]'}`}>
                      Incluir também um empréstimo em dinheiro para esta cliente
                    </span>
                  </button>

                  {incluirEmprestimo && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[#d1d5db]">Valor Emprestado (R$) *</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2.5 text-[#9ca3af] text-sm">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00"
                            value={dadosEmprestimo.valorSolicitado}
                            onChange={e => setDadosEmprestimo({ ...dadosEmprestimo, valorSolicitado: e.target.value })}
                            className="pl-8 input-dark border-none"
                          />
                        </div>
                        <p className="text-xs text-[#a78bfa] mt-1">+20% de juros será aplicado automaticamente</p>
                      </div>
                      <div>
                        <Label className="text-[#d1d5db]">Vencimento do Empréstimo *</Label>
                        <Input
                          type="date"
                          value={dadosEmprestimo.dataVencimento}
                          onChange={e => setDadosEmprestimo({ ...dadosEmprestimo, dataVencimento: e.target.value })}
                          className="input-dark mt-1 border-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="surface-card-2 border-t border-[#ffffff10] p-4 flex justify-end gap-3 mt-auto">
                 <Button variant="outline" type="button" onClick={() => {
                   setCarrinho([]);
                   setItemAtual({...itemAtual, produtoId: ''});
                 }} className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white">
                   Limpar
                 </Button>
                 <Button 
                   type="submit" 
                   form="form-venda" 
                   className="bg-[#10b981] hover:bg-[#059669] text-white min-w-[150px]"
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
          <Card className="surface-card border-none">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <CardTitle className="text-white">Histórico de Transações</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#9ca3af]" />
                    <Input 
                      placeholder="Buscar por cliente ou produto..." 
                      className="pl-9 input-dark border-none" 
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                    />
                  </div>
                  <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                    <SelectTrigger className="w-[130px] input-dark border-none">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b23] border-[#374151] text-white">
                      <SelectItem value="todas">Todos</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#ffffff10] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#00000020]">
                    <TableRow className="border-[#ffffff10]">
                      <TableHead className="text-[#8b92a5]">Data</TableHead>
                      <TableHead className="text-[#8b92a5]">Cliente</TableHead>
                      <TableHead className="text-[#8b92a5]">Resumo</TableHead>
                      <TableHead className="text-right text-[#8b92a5]">Total</TableHead>
                      <TableHead className="text-center text-[#8b92a5]">Status</TableHead>
                      <TableHead className="text-right text-[#8b92a5]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasFiltradas.length === 0 ? (
                      <TableRow className="border-[#ffffff10] hover:bg-transparent">
                        <TableCell colSpan={6} className="text-center py-8 text-[#8b92a5]">
                          Nenhuma venda encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendasFiltradas.map((venda) => (
                        <TableRow key={venda.id} className="border-[#ffffff10] hover:bg-[#ffffff05]">
                          <TableCell className="whitespace-nowrap text-[#d1d5db]">{formatarData(venda.dataVenda)}</TableCell>
                          <TableCell>
                            <div className="font-medium text-white">{venda.clienteNome}</div>
                            <div className="text-xs text-[#9ca3af]">{venda.clienteContato}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-[#d1d5db]">
                              {venda.itens?.length || 0} itens
                            </div>
                            <div className="text-xs text-[#8b92a5] truncate max-w-[200px]">
                              {venda.itens?.map(i => i.produtoNome).join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-white">
                            {formatarMoeda(venda.valorTotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={venda.pagamento.status === 'pago' ? 'default' : 'secondary'} className={
                              venda.pagamento.status === 'pago' ? 'bg-[#10b981]/10 text-[#10b981] border-none hover:bg-[#10b981]/20' : 'bg-[#f59e0b]/10 text-[#f59e0b] border-none hover:bg-[#f59e0b]/20'
                            }>
                              {statusPagamento[venda.pagamento.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setModalDetalhes(venda)} className="hover:bg-[#ffffff05]">
                                <Eye className="w-4 h-4 text-[#3b82f6]" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onVerRecibo(venda)} className="hover:bg-[#ffffff05]">
                                <Receipt className="w-4 h-4 text-[#a855f7]" />
                              </Button>
                              {venda.pagamento.status !== 'pago' && (
                                <Button variant="ghost" size="icon" onClick={() => setModalDetalhes(venda)} className="hover:bg-[#ffffff05]">
                                  <CheckCircle className="w-4 h-4 text-[#10b981]" />
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
        <DialogContent className="max-w-[700px] surface-card border-none text-white overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl">Gerenciar Pagamento</DialogTitle>
            <DialogDescription className="text-[#8b92a5]">
              Registre pagamentos parciais ou totais para esta venda.
            </DialogDescription>
          </DialogHeader>
          {modalDetalhes && (
            <div className="p-6 pt-2 space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 surface-card-2 border border-[#ffffff10] rounded-lg">
                <div>
                  <p className="text-xs text-[#8b92a5] uppercase">Cliente</p>
                  <p className="font-medium truncate text-white">{modalDetalhes.clienteNome}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8b92a5] uppercase">Total Venda</p>
                  <p className="font-medium text-[#3b82f6]">{formatarMoeda(modalDetalhes.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8b92a5] uppercase">Já Recebido</p>
                  <p className="font-medium text-[#10b981]">{formatarMoeda(modalDetalhes.pagamento.valorRecebido)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8b92a5] uppercase">A Receber</p>
                  <p className="font-bold text-[#f59e0b]">
                    {formatarMoeda(modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Novo Pagamento */}
                <div className="space-y-4">
                  <h4 className="font-medium border-b border-[#ffffff10] pb-2 flex items-center gap-2 text-white">
                    <Plus className="w-4 h-4" /> Registrar Pagamento
                  </h4>
                  
                  {modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido <= 0.01 ? (
                    <div className="p-4 bg-[#10b981]/10 text-[#10b981] rounded-md text-center border border-[#10b981]/20">
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
                        <Label className="text-[#d1d5db]">Valor do Pagamento</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2.5 text-[#9ca3af]">R$</span>
                          <Input 
                            name="valor"
                            type="number" 
                            step="0.01" 
                            max={modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido}
                            defaultValue={(modalDetalhes.valorTotal - modalDetalhes.pagamento.valorRecebido).toFixed(2)}
                            className="pl-8 font-bold text-lg input-dark border-none"
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[#d1d5db]">Data do Pagamento</Label>
                        <Input name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="input-dark mt-1 border-none" style={{ colorScheme: 'dark' }} />
                      </div>
                      <div>
                        <Label className="text-[#d1d5db]">Observação (Opcional)</Label>
                        <Input name="obs" placeholder="Ex: Pix, Adiantamento..." className="input-dark mt-1 border-none" />
                      </div>
                      <Button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white">
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
                        <p className="text-center text-[#8b92a5] text-sm py-4">Nenhum pagamento registrado.</p>
                      ) : (
                        modalDetalhes.pagamento.lancamentos.map((lanc, i) => (
                          <div key={i} className="flex justify-between items-center p-3 surface-card-2 border border-[#ffffff10] rounded-lg">
                            <div>
                              <p className="font-bold text-[#10b981]">{formatarMoeda(lanc.valor)}</p>
                              <p className="text-xs text-[#9ca3af]">{formatarData(lanc.data)}</p>
                            </div>
                            {lanc.observacao && (
                              <p className="text-xs text-[#8b92a5] italic max-w-[100px] truncate">{lanc.observacao}</p>
                            )}
                          </div>
                        ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="parcelas" className="space-y-3 mt-4">
                      {modalDetalhes.pagamento.parcelas?.map((p, i) => (
                        <div key={i} className={`flex justify-between items-center p-3 border border-[#ffffff10] rounded-lg ${p.pago ? 'bg-[#10b981]/5 border-[#10b981]/20' : 'surface-card-2'}`}>
                          <div>
                            <span className="text-sm font-medium text-white">Parcela {p.numero}</span>
                            <p className="text-xs text-[#9ca3af]">Venc: {formatarData(p.dataVencimento)}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-medium text-white">{formatarMoeda(p.valor)}</p>
                             {p.pago ? (
                               <Badge className="bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 border-none text-[10px]">Pago</Badge>
                             ) : (
                               <Badge variant="outline" className="text-[10px] text-[#9ca3af] border-[#ffffff20]">Pendente</Badge>
                             )}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end border-t border-[#ffffff10] pt-4">
                <Button variant="outline" onClick={() => setModalDetalhes(null)} className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white">Fechar</Button>
                <Button onClick={() => onVerRecibo(modalDetalhes)} className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"> <Receipt className="w-4 h-4 mr-2" /> Recibo</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
