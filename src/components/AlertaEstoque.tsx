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
    <Card style={{ borderColor: 'hsl(38,95%,54%,0.3)' }}>
      <CardHeader className="pb-2 sm:pb-3 px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base" style={{ color: 'hsl(38,95%,54%)' }}>
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          Alerta de Estoque
          <Badge className="text-xs text-[hsl(220,20%,4%)] font-semibold" style={{ background: 'hsl(38,95%,54%)' }}>
            {todosAlertas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="space-y-2">
          {produtosZerados.map(produto => (
            <div
              key={produto.id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border gap-2"
              style={{
                background: 'hsl(352,100%,62%,0.08)',
                borderColor: 'hsl(352,100%,62%,0.25)',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-lg sm:text-xl shrink-0">{categorias[produto.categoria].icone}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate" style={{ color: 'hsl(352,100%,62%)' }}>
                    {produto.nome}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(352,100%,62%,0.7)' }}>Estoque zerado!</p>
                </div>
              </div>
              <Badge className="shrink-0 text-xs border-0 font-semibold" style={{ background: 'hsl(352,100%,62%)', color: 'white' }}>
                0 un
              </Badge>
            </div>
          ))}

          {produtosEstoqueBaixo.map(produto => (
            <div
              key={produto.id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border gap-2"
              style={{
                background: 'hsl(38,95%,54%,0.08)',
                borderColor: 'hsl(38,95%,54%,0.25)',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-lg sm:text-xl shrink-0">{categorias[produto.categoria].icone}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate" style={{ color: 'hsl(38,95%,54%)' }}>
                    {produto.nome}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(38,95%,54%,0.7)' }}>Estoque baixo</p>
                </div>
              </div>
              <Badge className="shrink-0 text-xs border-0 font-semibold" style={{ background: 'hsl(38,95%,54%)', color: 'hsl(220,20%,4%)' }}>
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
