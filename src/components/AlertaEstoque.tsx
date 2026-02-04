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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          Alerta de Estoque
          <Badge className="bg-orange-500 text-white">{todosAlertas.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {produtosZerados.map(produto => (
            <div key={produto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <span className="text-xl">{categorias[produto.categoria].icone}</span>
                <div>
                  <p className="font-medium text-red-700">{produto.nome}</p>
                  <p className="text-xs text-red-500">Estoque zerado!</p>
                </div>
              </div>
              <Badge className="bg-red-500 text-white">0 un</Badge>
            </div>
          ))}

          {produtosEstoqueBaixo.map(produto => (
            <div key={produto.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <span className="text-xl">{categorias[produto.categoria].icone}</span>
                <div>
                  <p className="font-medium text-orange-700">{produto.nome}</p>
                  <p className="text-xs text-orange-500">Estoque baixo</p>
                </div>
              </div>
              <Badge className="bg-orange-500 text-white">
                <TrendingDown className="h-3 w-3 mr-1" />
                {produto.quantidade} un
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
