import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { formatarMoeda, formatarData, categorias } from '@/lib/utils';
import type { Produto, Venda } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface DashboardProps {
  produtos: Produto[];
  vendas: Venda[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Dashboard({ produtos, vendas }: DashboardProps) {
  const dados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Vendas filtradas
    const vendasConcluidas = vendas.filter(v => v.status !== 'cancelada');
    const vendasHoje = vendasConcluidas.filter(v => new Date(v.dataVenda) >= hoje);
    const vendasSemana = vendasConcluidas.filter(v => new Date(v.dataVenda) >= inicioSemana);
    const vendasMes = vendasConcluidas.filter(v => new Date(v.dataVenda) >= inicioMes);

    // Totais
    const totalVendas = vendasConcluidas.reduce((sum, v) => sum + v.valorTotal, 0);
    const totalRecebido = vendasConcluidas.reduce((sum, v) => sum + v.pagamento.valorRecebido, 0);
    const totalPendente = totalVendas - totalRecebido;

    // Lucro
    const totalCusto = vendasConcluidas.reduce((sum, v) => {
      const produto = produtos.find(p => p.id === v.produtoId);
      return sum + (produto ? produto.precoCusto * v.quantidade : 0);
    }, 0);
    const totalLucro = totalVendas - totalCusto;
    const margemLucro = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0;

    // Produtos mais vendidos
    const produtosVendidos = vendasConcluidas.reduce((acc, v) => {
      const existente = acc.find(p => p.produtoId === v.produtoId);
      const produto = produtos.find(p => p.id === v.produtoId);
      const lucro = produto ? (v.precoUnitario - produto.precoCusto) * v.quantidade : 0;
      
      if (existente) {
        existente.quantidadeVendida += v.quantidade;
        existente.lucroTotal += lucro;
      } else {
        acc.push({
          produtoId: v.produtoId,
          produtoNome: v.produtoNome,
          quantidadeVendida: v.quantidade,
          lucroTotal: lucro,
          margemLucro: produto ? ((v.precoUnitario - produto.precoCusto) / v.precoUnitario) * 100 : 0,
        });
      }
      return acc;
    }, [] as { produtoId: string; produtoNome: string; quantidadeVendida: number; lucroTotal: number; margemLucro: number }[]);

    const produtosMaisVendidos = produtosVendidos
      .sort((a, b) => b.lucroTotal - a.lucroTotal)
      .slice(0, 5);

    // Vendas recentes
    const vendasRecentes = vendasConcluidas.slice(0, 5);

    // Pagamentos pendentes
    const pagamentosPendentes = vendasConcluidas
      .filter(v => v.pagamento.status !== 'pago')
      .slice(0, 5);

    // Dados para gráfico de vendas por categoria
    const vendasPorCategoria = vendasConcluidas.reduce((acc, v) => {
      const produto = produtos.find(p => p.id === v.produtoId);
      if (!produto) return acc;
      
      const existente = acc.find(c => c.name === categorias[produto.categoria].label);
      if (existente) {
        existente.value += v.valorTotal;
      } else {
        acc.push({
          name: categorias[produto.categoria].label,
          value: v.valorTotal,
          color: categorias[produto.categoria].cor.replace('bg-', '#')
        });
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[]);

    // Dados para gráfico de evolução (últimos 7 dias)
    const evolucaoVendas = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const vendasDia = vendasConcluidas.filter(v => {
        const dataVenda = new Date(v.dataVenda);
        return dataVenda.toDateString() === data.toDateString();
      });
      const valorDia = vendasDia.reduce((sum, v) => sum + v.valorTotal, 0);
      evolucaoVendas.push({
        dia: data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        valor: valorDia,
        quantidade: vendasDia.length,
      });
    }

    // Dados para gráfico de formas de pagamento
    const pagamentosPorForma = vendasConcluidas.reduce((acc, v) => {
      const existente = acc.find(p => p.name === v.formaPagamento);
      if (existente) {
        existente.value += v.valorTotal;
      } else {
        acc.push({ name: v.formaPagamento, value: v.valorTotal });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

    // Status de pagamento
    const statusPagamento = [
      { name: 'Pago', value: totalRecebido },
      { name: 'Pendente', value: totalPendente },
    ];

    return {
      totalVendas,
      totalRecebido,
      totalPendente,
      totalLucro,
      margemLucro,
      vendasHoje: vendasHoje.reduce((sum, v) => sum + v.valorTotal, 0),
      vendasSemana: vendasSemana.reduce((sum, v) => sum + v.valorTotal, 0),
      vendasMes: vendasMes.reduce((sum, v) => sum + v.valorTotal, 0),
      produtosMaisVendidos,
      vendasRecentes,
      pagamentosPendentes,
      vendasPorCategoria,
      evolucaoVendas,
      pagamentosPorForma,
      statusPagamento,
    };
  }, [produtos, vendas]);

  const cards = [
    {
      titulo: 'Total em Vendas',
      valor: formatarMoeda(dados.totalVendas),
      icone: DollarSign,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-100',
    },
    {
      titulo: 'Total Recebido',
      valor: formatarMoeda(dados.totalRecebido),
      icone: TrendingUp,
      cor: 'text-green-600',
      bgCor: 'bg-green-100',
    },
    {
      titulo: 'A Receber',
      valor: formatarMoeda(dados.totalPendente),
      icone: AlertCircle,
      cor: 'text-orange-600',
      bgCor: 'bg-orange-100',
    },
    {
      titulo: 'Lucro Total',
      valor: formatarMoeda(dados.totalLucro),
      subvalor: `${dados.margemLucro.toFixed(1)}% margem`,
      icone: TrendingUp,
      cor: 'text-emerald-600',
      bgCor: 'bg-emerald-100',
    },
  ];

  const cardsPeriodo = [
    { titulo: 'Hoje', valor: formatarMoeda(dados.vendasHoje) },
    { titulo: 'Esta Semana', valor: formatarMoeda(dados.vendasSemana) },
    { titulo: 'Este Mês', valor: formatarMoeda(dados.vendasMes) },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="border-l-4 border-l-transparent hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{card.titulo}</CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgCor}`}>
                <card.icone className={`h-4 w-4 sm:h-5 sm:w-5 ${card.cor}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{card.valor}</div>
              {card.subvalor && (
                <p className="text-xs text-gray-500 mt-1">{card.subvalor}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards por Período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {cardsPeriodo.map((card, index) => (
          <Card key={index} className="bg-gradient-to-br from-gray-50 to-white">
            <CardHeader className="pb-1 sm:pb-2 px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Vendas {card.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
              <div className="text-base sm:text-xl font-bold text-gray-900">{card.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
              Evolução de Vendas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dados.evolucaoVendas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(v: number) => formatarMoeda(v)}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Vendas por Categoria */}
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
              Vendas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dados.vendasPorCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dados.vendasPorCategoria.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status de Pagamento */}
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
              Status de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dados.statusPagamento} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={(v) => `R$${v/1000}k`} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {dados.statusPagamento.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Formas de Pagamento */}
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 shrink-0" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dados.pagamentosPorForma}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
              Produtos Mais Rentáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {dados.produtosMaisVendidos.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">Nenhuma venda registrada ainda</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {dados.produtosMaisVendidos.map((produto, index) => (
                  <div key={produto.produtoId} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white text-xs font-bold rounded-full shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{produto.produtoNome}</p>
                        <p className="text-xs text-gray-500">{produto.quantidadeVendida} vendidos</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-green-600 text-sm sm:text-base">{formatarMoeda(produto.lucroTotal)}</p>
                      <p className="text-xs text-gray-500">{produto.margemLucro.toFixed(1)}% margem</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 shrink-0" />
              Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {dados.pagamentosPendentes.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">Nenhum pagamento pendente!</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {dados.pagamentosPendentes.map((venda) => (
                  <div key={venda.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-orange-50 rounded-lg border border-orange-100 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{venda.clienteNome}</p>
                      <p className="text-xs text-gray-500 truncate">{venda.produtoNome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-orange-600 text-sm sm:text-base">
                        {formatarMoeda(venda.pagamento.valorTotal - venda.pagamento.valorRecebido)}
                      </p>
                      <p className="text-xs text-gray-500">{formatarData(venda.dataVenda)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendas Recentes - scroll horizontal no mobile */}
      <Card>
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 sm:pb-6 pb-4">
          {dados.vendasRecentes.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm px-4">Nenhuma venda registrada ainda</p>
          ) : (
            <div className="overflow-x-auto scroll-touch -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Data</th>
                    <th className="text-left py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Cliente</th>
                    <th className="text-left py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Produto</th>
                    <th className="text-right py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Valor</th>
                    <th className="text-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.vendasRecentes.map((venda) => (
                    <tr key={venda.id} className="border-b hover:bg-gray-50">
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">{formatarData(venda.dataVenda)}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium max-w-[100px] sm:max-w-none truncate">{venda.clienteNome}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm max-w-[80px] sm:max-w-none truncate">{venda.produtoNome}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right font-semibold whitespace-nowrap">{formatarMoeda(venda.valorTotal)}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          venda.pagamento.status === 'pago' 
                            ? 'bg-green-100 text-green-700' 
                            : venda.pagamento.status === 'parcial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {venda.pagamento.status === 'pago' ? 'Pago' : venda.pagamento.status === 'parcial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
