import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { formatarMoeda, formatarData, categorias } from '@/lib/utils';
import type { Produto, CategoriaProduto } from '@/types';

interface ProdutosProps {
  produtos: Produto[];
  onAdicionar: (produto: Omit<Produto, 'id' | 'criadoEm'>) => void;
  onAtualizar: (id: string, dados: Partial<Produto>) => void;
  onRemover: (id: string) => void;
}

export function Produtos({ produtos, onAdicionar, onAtualizar, onRemover }: ProdutosProps) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: 'diversos' as CategoriaProduto,
    precoCusto: '',
    precoVenda: '',
    quantidade: '1',
    fornecedor: '',
    observacoes: '',
    dataCompra: new Date().toISOString().split('T')[0],
  });

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      p.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dados = {
      nome: formData.nome,
      descricao: formData.descricao,
      categoria: formData.categoria,
      precoCusto: parseFloat(formData.precoCusto) || 0,
      precoVenda: parseFloat(formData.precoVenda) || 0,
      quantidade: parseInt(formData.quantidade) || 1,
      fornecedor: formData.fornecedor,
      observacoes: formData.observacoes,
      dataCompra: formData.dataCompra,
    };

    if (produtoEditando) {
      onAtualizar(produtoEditando.id, dados);
    } else {
      onAdicionar(dados);
    }

    resetForm();
    setModalAberto(false);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: 'diversos',
      precoCusto: '',
      precoVenda: '',
      quantidade: '1',
      fornecedor: '',
      observacoes: '',
      dataCompra: new Date().toISOString().split('T')[0],
    });
    setProdutoEditando(null);
  };

  const handleEditar = (produto: Produto) => {
    setProdutoEditando(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      precoCusto: produto.precoCusto.toString(),
      precoVenda: produto.precoVenda.toString(),
      quantidade: produto.quantidade.toString(),
      fornecedor: produto.fornecedor || '',
      observacoes: produto.observacoes || '',
      dataCompra: produto.dataCompra,
    });
    setModalAberto(true);
  };

  const handleNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  const lucroPotencial = (precoCusto: number, precoVenda: number) => {
    const lucro = precoVenda - precoCusto;
    const margem = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;
    return { lucro, margem };
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
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="roupas">Roupas</SelectItem>
                  <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                  <SelectItem value="diversos">Diversos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
              <DialogTrigger asChild>
                <Button onClick={handleNovo} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{produtoEditando ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nome">Nome do Produto *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Camiseta Nike"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descrição do produto"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(v) => setFormData({ ...formData, categoria: v as CategoriaProduto })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roupas">Roupas</SelectItem>
                          <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                          <SelectItem value="diversos">Diversos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={formData.quantidade}
                        onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="precoCusto">Preço de Custo (R$) *</Label>
                      <Input
                        id="precoCusto"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precoCusto}
                        onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })}
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="precoVenda">Preço de Venda (R$) *</Label>
                      <Input
                        id="precoVenda"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precoVenda}
                        onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataCompra">Data da Compra</Label>
                      <Input
                        id="dataCompra"
                        type="date"
                        value={formData.dataCompra}
                        onChange={(e) => setFormData({ ...formData, dataCompra: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fornecedor">Fornecedor</Label>
                      <Input
                        id="fornecedor"
                        value={formData.fornecedor}
                        onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                        placeholder="Nome do fornecedor"
                      />
                    </div>
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
                  
                  {formData.precoCusto && formData.precoVenda && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Lucro estimado:</strong> {' '}
                        {formatarMoeda(lucroPotencial(parseFloat(formData.precoCusto), parseFloat(formData.precoVenda)).lucro)}
                        {' '} ({lucroPotencial(parseFloat(formData.precoCusto), parseFloat(formData.precoVenda)).margem.toFixed(1)}% margem)
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Meus Produtos ({produtosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Cadastre seu primeiro produto para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((produto) => {
                    const { lucro, margem } = lucroPotencial(produto.precoCusto, produto.precoVenda);
                    const categoria = categorias[produto.categoria];
                    
                    return (
                      <TableRow key={produto.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{produto.nome}</p>
                            {produto.descricao && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{produto.descricao}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${categoria.cor} text-white`}>
                            {categoria.icone} {categoria.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {formatarMoeda(produto.precoCusto)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatarMoeda(produto.precoVenda)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600 font-medium">
                            {formatarMoeda(lucro)}
                          </span>
                          <span className="text-xs text-gray-500 block">
                            {margem.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                            {produto.quantidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatarData(produto.dataCompra)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(produto)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este produto?')) {
                                  onRemover(produto.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
