import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, AlertCircle, Zap } from 'lucide-react';
import { formatarMoeda, categorias } from '@/lib/utils';
import { useDados } from '@/hooks/useDados';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import type { Produto, Venda } from '@/types';

const GREEN = 'hsl(152, 100%, 41%)';
const RED   = 'hsl(352, 100%, 62%)';
const AMBER = 'hsl(38, 95%, 54%)';
const BLUE  = 'hsl(217, 91%, 60%)';
const MUTED = 'hsl(215, 15%, 45%)';

interface RelatoriosProps {
  produtos: Produto[];
  vendas: Venda[];
}

export function Relatorios({ produtos, vendas }: RelatoriosProps) {
  const [periodo, setPeriodo] = useState('30');
  const [abaAtiva, setAbaAtiva] = useState('geral');

  const {
    getAgingRecebiveis, getProjecaoFluxoCaixa, getInsightsProdutos,
  } = useDados();

  const aging = useMemo(() => getAgingRecebiveis(), [getAgingRecebiveis]);
  const projecao = useMemo(() => getProjecaoFluxoCaixa(30), [getProjecaoFluxoCaixa]);
  const { lista: insightsProdutos } = useMemo(() => getInsightsProdutos(), [getInsightsProdutos]);

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
      cor: 'text-[#3b82f6]',
      bgCor: 'bg-[#3b82f6]/10',
    },
    {
      titulo: 'Lucro Total',
      valor: formatarMoeda(dados.totalLucro),
      subvalor: `${dados.margemLucro.toFixed(1)}% margem`,
      icone: TrendingUp,
      cor: 'text-[#10b981]',
      bgCor: 'bg-[#10b981]/10',
    },
    {
      titulo: 'Quantidade de Vendas',
      valor: dados.quantidadeVendas.toString(),
      subvalor: `${formatarMoeda(dados.ticketMedio)} ticket médio`,
      icone: ShoppingCart,
      cor: 'text-[#a855f7]',
      bgCor: 'bg-[#a855f7]/10',
    },
    {
      titulo: 'A Receber',
      valor: formatarMoeda(dados.totalPendente),
      icone: TrendingDown,
      cor: 'text-[#f59e0b]',
      bgCor: 'bg-[#f59e0b]/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="surface-card border-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-[#8b92a5]" />
            <span className="text-sm font-medium text-[#d1d5db]">Período:</span>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-48 input-dark border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b23] border-[#374151] text-white">
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
          <Card key={index} className="surface-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#8b92a5]">{card.titulo}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgCor}`}>
                <card.icone className={`h-5 w-5 ${card.cor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{card.valor}</div>
              {card.subvalor && (
                <p className="text-xs text-[#8b92a5] mt-1">{card.subvalor}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Abas */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList className="grid grid-cols-7 w-full bg-[#1a1b23] p-1 rounded-lg border border-[#ffffff10]">
          <TabsTrigger value="geral"       className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Geral</TabsTrigger>
          <TabsTrigger value="produtos"    className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Produtos</TabsTrigger>
          <TabsTrigger value="clientes"    className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Clientes</TabsTrigger>
          <TabsTrigger value="pagamentos"  className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Pagamentos</TabsTrigger>
          <TabsTrigger value="recebiveis"  className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Recebíveis</TabsTrigger>
          <TabsTrigger value="fluxo"       className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Fluxo 30d</TabsTrigger>
          <TabsTrigger value="eficiencia"  className="data-[state=active]:bg-[#2a2d36] data-[state=active]:text-white text-[#8b92a5] text-xs">Eficiência</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          {/* Evolução Diária */}
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white">Evolução dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dados.evolucaoDiaria.map((dia, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-[#8b92a5] capitalize">{dia.data}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-[#ffffff10] rounded-lg overflow-hidden flex">
                        <div 
                          className="bg-[#3b82f6] h-full flex items-center justify-end px-2 transition-all duration-500 ease-out"
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
                    <div className="w-16 text-right text-sm text-[#8b92a5]">
                      {dia.quantidade} venda{dia.quantidade !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vendas por Categoria */}
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white">Performance por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.vendasPorCategoria.length === 0 ? (
                <p className="text-[#8b92a5] text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dados.vendasPorCategoria.map((cat) => {
                    const catInfo = categorias[cat.categoria as keyof typeof categorias];
                    return (
                      <div key={cat.categoria} className="p-4 surface-card-2 border border-[#ffffff10] rounded-lg">
                        <div className="flex items-center gap-2 mb-2 text-white">
                          <span>{catInfo.icone}</span>
                          <span className="font-medium">{catInfo.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatarMoeda(cat.valor)}</p>
                        <p className="text-sm text-[#8b92a5]">{cat.quantidade} itens vendidos</p>
                        <p className="text-sm text-[#10b981] mt-1">Lucro: {formatarMoeda(cat.lucro)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white">Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.produtosMaisVendidos.length === 0 ? (
                <p className="text-[#8b92a5] text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-3">
                  {dados.produtosMaisVendidos.map((produto, index) => (
                    <div key={produto.produtoId} className="flex items-center justify-between p-3 surface-card-2 border border-[#ffffff10] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-[#3b82f6]/20 text-[#3b82f6] text-sm font-bold rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-white">{produto.produtoNome}</p>
                          <p className="text-xs text-[#8b92a5]">{produto.quantidade} vendidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatarMoeda(produto.valor)}</p>
                        <p className="text-xs text-[#10b981]">Lucro: {formatarMoeda(produto.lucro)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white">Top 10 Clientes Mais Valiosos</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.clientesMaisValiosos.length === 0 ? (
                <p className="text-[#8b92a5] text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-3">
                  {dados.clientesMaisValiosos.map((cliente, index) => (
                    <div key={cliente.nome} className="flex items-center justify-between p-3 surface-card-2 border border-[#ffffff10] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-[#8b5cf6]/20 text-[#a78bfa] text-sm font-bold rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-white">{cliente.nome}</p>
                          <p className="text-xs text-[#8b92a5]">{cliente.contato}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatarMoeda(cliente.valor)}</p>
                        <p className="text-xs text-[#8b92a5]">{cliente.compras} compra{cliente.compras !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos">
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white">Formas de Pagamento Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.formasPagamento.length === 0 ? (
                <p className="text-[#8b92a5] text-center py-4">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-4">
                  {dados.formasPagamento.map((forma) => {
                    const percentual = (forma.valor / dados.totalVendas) * 100;
                    return (
                      <div key={forma.forma} className="space-y-2">
                        <div className="flex justify-between items-center text-white">
                          <span className="font-medium capitalize">{forma.forma}</span>
                          <div className="text-right">
                            <span className="font-semibold">{formatarMoeda(forma.valor)}</span>
                            <span className="text-sm text-[#8b92a5] ml-2">({percentual.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-3 bg-[#ffffff10] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3b82f6] rounded-full transition-all"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#8b92a5]">{forma.quantidade} transações</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: RECEBÍVEIS (AGING) ─────────────────────── */}
        <TabsContent value="recebiveis" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Corrente (0d)', value: aging.corrente, color: GREEN },
              { label: 'Atraso 1–30d',  value: aging.dias30,   color: AMBER },
              { label: 'Atraso 31–60d', value: aging.dias60,   color: 'hsl(25,95%,53%)' },
              { label: 'Atraso +60d',   value: aging.acima60,  color: RED },
            ].map(b => (
              <div key={b.label} className="kpi-card p-4">
                <p className="text-xs font-medium mb-2" style={{ color: MUTED }}>{b.label}</p>
                <p className="text-financial-md font-mono font-bold" style={{ color: b.color }}>
                  {formatarMoeda(b.value)}
                </p>
              </div>
            ))}
          </div>

          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white text-sm">Distribuição do Capital Travado por Faixa de Atraso</CardTitle>
            </CardHeader>
            <CardContent>
              {(aging.corrente + aging.dias30 + aging.dias60 + aging.acima60) === 0 ? (
                <p className="text-[#8b92a5] text-center py-8">Nenhum receb��vel pendente</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { faixa: 'Corrente', valor: aging.corrente,  fill: GREEN },
                    { faixa: '1–30d',    valor: aging.dias30,    fill: AMBER },
                    { faixa: '31–60d',   valor: aging.dias60,    fill: 'hsl(25,95%,53%)' },
                    { faixa: '+60d',     valor: aging.acima60,   fill: RED },
                  ]} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <XAxis dataKey="faixa" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatarMoeda(v)} contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8 }} labelStyle={{ color: MUTED }} itemStyle={{ color: AMBER }} />
                    <Bar dataKey="valor" radius={[4,4,0,0]}>
                      {[GREEN, AMBER, 'hsl(25,95%,53%)', RED].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: FLUXO DE CAIXA 30 DIAS ─────────────────── */}
        <TabsContent value="fluxo">
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white text-sm">Projeção de Caixa — Próximos 30 dias</CardTitle>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Considera parcelas de vendas a vencer e contas a pagar cadastradas
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={projecao.filter((_, i) => i % 2 === 0)} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BLUE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" tick={{ fontSize: 9, fill: MUTED }} axisLine={false} tickLine={false}
                    tickFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatarMoeda(v), name === 'saldoCumulativo' ? 'Saldo' : name === 'entradas' ? 'Entradas' : 'Saídas']}
                    labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                    contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8 }}
                    labelStyle={{ color: MUTED }} itemStyle={{ color: AMBER }}
                  />
                  <Area type="monotone" dataKey="saldoCumulativo" stroke={BLUE} strokeWidth={2}
                    fill="url(#gradSaldo)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              {projecao.some(d => d.saldoCumulativo < 0) && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg" style={{ background: `${RED}15`, border: `1px solid ${RED}25` }}>
                  <AlertCircle className="h-4 w-4 shrink-0" style={{ color: RED }} />
                  <p className="text-xs" style={{ color: RED }}>
                    Proje��ão indica saldo negativo em alguns dias — revise contas a pagar ou acelere cobranças
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: EFICIÊNCIA POR PRODUTO ──────────────────── */}
        <TabsContent value="eficiencia">
          <Card className="surface-card border-none">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: AMBER }} />
                Eficiência de Capital por Produto
              </CardTitle>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                R$/dia = lucro médio por unidade ÷ dias médios para receber
              </p>
            </CardHeader>
            <CardContent>
              {insightsProdutos.length === 0 ? (
                <p className="text-[#8b92a5] text-center py-8">Nenhuma venda registrada ainda</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 pb-2 border-b text-xs font-medium uppercase tracking-widest" style={{ color: MUTED, borderColor: 'hsl(220,15%,14%)' }}>
                    <span className="col-span-2">Produto</span>
                    <span className="text-right">Margem</span>
                    <span className="text-right">Retorno médio</span>
                    <span className="text-right">R$/dia</span>
                  </div>
                  {[...insightsProdutos]
                    .sort((a, b) => (b.lucroRsPerDia ?? 0) - (a.lucroRsPerDia ?? 0))
                    .map((p, i) => {
                      const cor = i === 0 ? GREEN : p.lucroRsPerDia && p.lucroRsPerDia > 0 ? AMBER : MUTED;
                      return (
                        <div key={p.produtoId} className="grid grid-cols-5 gap-2 py-2 border-b items-center" style={{ borderColor: 'hsl(220,15%,11%)' }}>
                          <span className="col-span-2 text-sm truncate" style={{ color: 'hsl(210,20%,88%)' }}>
                            {i === 0 && <span className="mr-1 text-[10px]" style={{ color: GREEN }}>★</span>}
                            {p.produtoNome}
                          </span>
                          <span className="text-right text-sm font-mono" style={{ color: p.margemLucro < 15 ? RED : GREEN }}>
                            {p.margemLucro.toFixed(1)}%
                          </span>
                          <span className="text-right text-sm font-mono" style={{ color: BLUE }}>
                            {p.tempoMedioVenda ? `${p.tempoMedioVenda}d` : '—'}
                          </span>
                          <span className="text-right text-sm font-mono font-bold" style={{ color: cor }}>
                            {p.lucroRsPerDia != null ? `R$${p.lucroRsPerDia.toFixed(2)}` : '—'}
                          </span>
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
