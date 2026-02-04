import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { formatarMoeda, categorias } from '@/lib/utils';
import type { Produto, Venda } from '@/types';

interface RelatoriosProps {
  produtos: Produto[];
  vendas: Venda[];
}

export function Relatorios({ produtos, vendas }: RelatoriosProps) {
  const [periodo, setPeriodo] = useState('30');
  const [abaAtiva, setAbaAtiva] = useState('geral');

  const dados = useMemo(() => {
    const hoje = new Date();
    const diasAtras = new Date(hoje.getTime() - parseInt(periodo) * 24 * 60 * 60 * 1000);

    const vendasFiltradas = vendas.filter(v => 
      v.status !== 'cancelada' && new Date(v.dataVenda) >= diasAtras
    );

    // Totais
    const totalVendas = vendasFiltradas.reduce((sum, v) => sum + v.valorTotal, 0);
    const totalRecebido = vendasFiltradas.reduce((sum, v) => sum + v.pagamento.valorRecebido, 0);
    const totalPendente = totalVendas - totalRecebido;

    // Lucro
    const totalCusto = vendasFiltradas.reduce((sum, v) => {
      return sum + (v.itens?.reduce((sumItem, item) => {
        const produto = produtos.find(p => p.id === item.produtoId);
        return sumItem + (produto ? produto.precoCusto * item.quantidade : 0);
      }, 0) || 0);
    }, 0);
    const totalLucro = totalVendas - totalCusto;
    const margemLucro = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0;

    // Quantidade
    const quantidadeVendas = vendasFiltradas.length;
    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

    // Por categoria
    const vendasPorCategoria = vendasFiltradas.reduce((acc, v) => {
      v.itens?.forEach(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (!produto) return;
        
        const lucro = (item.precoUnitario - produto.precoCusto) * item.quantidade;
        const existente = acc.find(c => c.categoria === produto.categoria);
        
        if (existente) {
          existente.valor += item.quantidade * item.precoUnitario;
          existente.quantidade += item.quantidade;
          existente.lucro += lucro;
        } else {
          acc.push({
            categoria: produto.categoria,
            valor: item.quantidade * item.precoUnitario,
            quantidade: item.quantidade,
            lucro,
          });
        }
      });
      return acc;
    }, [] as { categoria: string; valor: number; quantidade: number; lucro: number }[]);

    // Produtos mais vendidos
    const produtosMaisVendidos = vendasFiltradas.reduce((acc, v) => {
      v.itens?.forEach(item => {
        const existente = acc.find(p => p.produtoId === item.produtoId);
        const produto = produtos.find(p => p.id === item.produtoId);
        const lucro = produto ? (item.precoUnitario - produto.precoCusto) * item.quantidade : 0;
        
        if (existente) {
          existente.quantidade += item.quantidade;
          existente.valor += item.quantidade * item.precoUnitario;
          existente.lucro += lucro;
        } else {
          acc.push({
            produtoId: item.produtoId,
            produtoNome: item.produtoNome,
            quantidade: item.quantidade,
            valor: item.quantidade * item.precoUnitario,
            lucro,
          });
        }
      });
      return acc;
    }, [] as { produtoId: string; produtoNome: string; quantidade: number; valor: number; lucro: number }[])
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

    // Clientes mais valiosos
    const clientesMaisValiosos = vendasFiltradas.reduce((acc, v) => {
      const existente = acc.find(c => c.nome === v.clienteNome);
      
      if (existente) {
        existente.compras += 1;
        existente.valor += v.valorTotal;
      } else {
        acc.push({
          nome: v.clienteNome,
          contato: v.clienteContato || '-',
          compras: 1,
          valor: v.valorTotal,
        });
      }
      return acc;
    }, [] as { nome: string; contato: string; compras: number; valor: number }[])
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

    // Formas de pagamento
    const formasPagamento = vendasFiltradas.reduce((acc, v) => {
      const existente = acc.find(f => f.forma === v.formaPagamento);
      
      if (existente) {
        existente.valor += v.valorTotal;
        existente.quantidade += 1;
      } else {
        acc.push({
          forma: v.formaPagamento,
          valor: v.valorTotal,
          quantidade: 1,
        });
      }
      return acc;
    }, [] as { forma: string; valor: number; quantidade: number }[])
    .sort((a, b) => b.valor - a.valor);

    // Evolução diária (últimos 7 dias)
    const evolucaoDiaria = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      data.setHours(0, 0, 0, 0);
      
      const vendasDia = vendasFiltradas.filter(v => {
        const dataVenda = new Date(v.dataVenda);
        dataVenda.setHours(0, 0, 0, 0);
        return dataVenda.getTime() === data.getTime();
      });
      
      const valorDia = vendasDia.reduce((sum, v) => sum + v.valorTotal, 0);
      const lucroDia = vendasDia.reduce((sum, v) => {
        return sum + (v.itens?.reduce((sumItem, item) => {
          const produto = produtos.find(p => p.id === item.produtoId);
          return sumItem + (produto ? (item.precoUnitario - produto.precoCusto) * item.quantidade : 0);
        }, 0) || 0);
      }, 0);
      
      evolucaoDiaria.push({
        data: data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        valor: valorDia,
        lucro: lucroDia,
        quantidade: vendasDia.length,
      });
    }

    return {
      totalVendas,
      totalRecebido,
      totalPendente,
      totalLucro,
      margemLucro,
      quantidadeVendas,
      ticketMedio,
      vendasPorCategoria,
      produtosMaisVendidos,
      clientesMaisValiosos,
      formasPagamento,
      evolucaoDiaria,
    };
  }, [vendas, produtos, periodo]);

  const cardsPrincipais = [
    {
      titulo: 'Total em Vendas',
      valor: formatarMoeda(dados.totalVendas),
      icone: DollarSign,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-100',
    },
    {
      titulo: 'Lucro Total',
      valor: formatarMoeda(dados.totalLucro),
      subvalor: `${dados.margemLucro.toFixed(1)}% margem`,
      icone: TrendingUp,
      cor: 'text-green-600',
      bgCor: 'bg-green-100',
    },
    {
      titulo: 'Quantidade de Vendas',
      valor: dados.quantidadeVendas.toString(),
      subvalor: `${formatarMoeda(dados.ticketMedio)} ticket médio`,
      icone: ShoppingCart,
      cor: 'text-purple-600',
      bgCor: 'bg-purple-100',
    },
    {
      titulo: 'A Receber',
      valor: formatarMoeda(dados.totalPendente),
      icone: TrendingDown,
      cor: 'text-orange-600',
      bgCor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsPrincipais.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.titulo}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgCor}`}>
                <card.icone className={`h-5 w-5 ${card.cor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.valor}</div>
              {card.subvalor && (
                <p className="text-xs text-gray-500 mt-1">{card.subvalor}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Abas */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          {/* Evolução Diária */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dados.evolucaoDiaria.map((dia, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-600 capitalize">{dia.data}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        <div 
                          className="bg-blue-500 h-full flex items-center justify-end px-2"
                          style={{ width: `${Math.max(5, (dia.valor / Math.max(...dados.evolucaoDiaria.map(d => d.valor))) * 100)}%` }}
                        >
                          {dia.valor > 0 && (
                            <span className="text-white text-xs font-medium whitespace-nowrap">
                              {formatarMoeda(dia.valor)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-500">
                      {dia.quantidade} venda{dia.quantidade !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vendas por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.vendasPorCategoria.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dados.vendasPorCategoria.map((cat) => {
                    const catInfo = categorias[cat.categoria as keyof typeof categorias];
                    return (
                      <div key={cat.categoria} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{catInfo.icone}</span>
                          <span className="font-medium">{catInfo.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatarMoeda(cat.valor)}</p>
                        <p className="text-sm text-gray-500">{cat.quantidade} itens vendidos</p>
                        <p className="text-sm text-green-600 mt-1">Lucro: {formatarMoeda(cat.lucro)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.produtosMaisVendidos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-3">
                  {dados.produtosMaisVendidos.map((produto, index) => (
                    <div key={produto.produtoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{produto.produtoNome}</p>
                          <p className="text-xs text-gray-500">{produto.quantidade} vendidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatarMoeda(produto.valor)}</p>
                        <p className="text-xs text-green-600">Lucro: {formatarMoeda(produto.lucro)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes Mais Valiosos</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.clientesMaisValiosos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-3">
                  {dados.clientesMaisValiosos.map((cliente, index) => (
                    <div key={cliente.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white text-sm font-bold rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{cliente.nome}</p>
                          <p className="text-xs text-gray-500">{cliente.contato}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatarMoeda(cliente.valor)}</p>
                        <p className="text-xs text-gray-500">{cliente.compras} compra{cliente.compras !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos">
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.formasPagamento.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-4">
                  {dados.formasPagamento.map((forma) => {
                    const percentual = (forma.valor / dados.totalVendas) * 100;
                    return (
                      <div key={forma.forma} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{forma.forma}</span>
                          <div className="text-right">
                            <span className="font-semibold">{formatarMoeda(forma.valor)}</span>
                            <span className="text-sm text-gray-500 ml-2">({percentual.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{forma.quantidade} transações</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
