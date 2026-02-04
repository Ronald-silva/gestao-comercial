import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import type { Produto } from '@/types';
import { categorias } from '@/lib/utils';

interface AlertaEstoqueProps {
  produtos: Produto[];
}

export function AlertaEstoque({ produtos }: AlertaEstoqueProps) {
  const produtosEstoqueBaixo = produtos.filter(p => p.quantidade <= 3 && p.quantidade > 0);
  const produtosZerados = produtos.filter(p => p.quantidade === 0);

  const todosAlertas = [...produtosZerados, ...produtosEstoqueBaixo];

  if (todosAlertas.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-300">
      <CardHeader className="pb-2 sm:pb-3 px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-orange-700 text-sm sm:text-base">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          Alerta de Estoque
          <Badge className="bg-orange-500 text-white text-xs">{todosAlertas.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="space-y-2">
          {produtosZerados.map(produto => (
            <div key={produto.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-red-50 rounded-lg border border-red-200 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-lg sm:text-xl shrink-0">{categorias[produto.categoria].icone}</span>
                <div className="min-w-0">
                  <p className="font-medium text-red-700 text-sm sm:text-base truncate">{produto.nome}</p>
                  <p className="text-xs text-red-500">Estoque zerado!</p>
                </div>
              </div>
              <Badge className="bg-red-500 text-white shrink-0 text-xs">0 un</Badge>
            </div>
          ))}

          {produtosEstoqueBaixo.map(produto => (
            <div key={produto.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-orange-50 rounded-lg border border-orange-200 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-lg sm:text-xl shrink-0">{categorias[produto.categoria].icone}</span>
                <div className="min-w-0">
                  <p className="font-medium text-orange-700 text-sm sm:text-base truncate">{produto.nome}</p>
                  <p className="text-xs text-orange-500">Estoque baixo</p>
                </div>
              </div>
              <Badge className="bg-orange-500 text-white shrink-0 text-xs">
                <TrendingDown className="h-3 w-3 mr-1 inline" />
                {produto.quantidade} un
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
