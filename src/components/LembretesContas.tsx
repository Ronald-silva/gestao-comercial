import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatarMoeda, formatarData } from '@/lib/utils';
import type { Venda } from '@/types';

interface LembretesContasProps {
  vendas: Venda[];
  onRegistrarPagamento: (vendaId: string, valor: number, data: string, obs?: string) => void;
}

interface Conta {
  vendaId: string;
  clienteNome: string;
  clienteContato?: string;
  produtoNome: string;
  valorPendente: number;
  dataVencimento?: string;
  diasAtraso: number;
  parcelaNumero?: number;
}

export function LembretesContas({ vendas, onRegistrarPagamento }: LembretesContasProps) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const contasPendentes = vendas
      .filter(v => v.pagamento.status !== 'pago' && v.status !== 'cancelada')
      .map(v => {
        const parcelasPendentes = v.pagamento.parcelas?.filter(p => !p.pago) || [];
        const parcelaMaisProxima = parcelasPendentes[0];

        const diasAtraso = parcelaMaisProxima
          ? Math.floor((new Date(hoje).getTime() - new Date(parcelaMaisProxima.dataVencimento).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          vendaId: v.id,
          clienteNome: v.clienteNome,
          clienteContato: v.clienteContato,
          produtoNome: v.itens ? v.itens.map(i => i.produtoNome).join(', ') : 'Venda Antiga',
          valorPendente: v.pagamento.valorTotal - v.pagamento.valorRecebido,
          dataVencimento: parcelaMaisProxima?.dataVencimento,
          diasAtraso,
          parcelaNumero: parcelaMaisProxima?.numero,
        };
      })
      .filter(c => c.valorPendente > 0)
      .sort((a, b) => b.diasAtraso - a.diasAtraso);

    setContas(contasPendentes);
  }, [vendas]);

  const contasUrgentes = contas.filter(c => c.diasAtraso > 0);

  const handleWhatsApp = (conta: Conta) => {
    const telefone = conta.clienteContato?.replace(/\D/g, '');
    if (!telefone) {
      alert('Cliente não possui contato cadastrado');
      return;
    }

    const mensagem = encodeURIComponent(
      `Olá ${conta.clienteNome}! 👋\n\n` +
      `Passando para lembrar sobre o pagamento pendente:\n` +
      `📦 Produto: ${conta.produtoNome}\n` +
      `💰 Valor: ${formatarMoeda(conta.valorPendente)}\n` +
      (conta.diasAtraso > 0
        ? `⚠️ Vencido há ${conta.diasAtraso} dia(s)\n`
        : conta.diasAtraso === 0
        ? `📅 Vence hoje\n`
        : `📅 Vence em ${Math.abs(conta.diasAtraso)} dia(s)\n`
      ) +
      `\nPode me confirmar o pagamento? Obrigado! 🙏`
    );

    window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
  };

  const contasExibidas = mostrarTodos ? contas : contas.slice(0, 5);

  if (contas.length === 0) {
    return (
      <Card style={{ background: 'hsl(152,100%,41%,0.07)', borderColor: 'hsl(152,100%,41%,0.25)' }}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3" style={{ color: 'hsl(152,100%,41%)' }}>
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Todas as contas estão em dia!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[hsl(38,95%,54%)]" />
            Contas a Receber
            {contasUrgentes.length > 0 && (
              <Badge className="text-white text-xs border-0" style={{ background: 'hsl(352,100%,62%)' }}>
                {contasUrgentes.length} atrasadas
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {formatarMoeda(contas.reduce((sum, c) => sum + c.valorPendente, 0))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contasExibidas.map((conta) => {
            const isAtrasado = conta.diasAtraso > 0;
            const isHoje = conta.diasAtraso === 0;

            const bgColor = isAtrasado
              ? 'hsl(352,100%,62%,0.08)'
              : isHoje
              ? 'hsl(38,95%,54%,0.08)'
              : 'hsl(217,91%,60%,0.08)';
            const borderColor = isAtrasado
              ? 'hsl(352,100%,62%,0.25)'
              : isHoje
              ? 'hsl(38,95%,54%,0.25)'
              : 'hsl(217,91%,60%,0.25)';

            return (
              <div
                key={conta.vendaId}
                className="p-4 rounded-lg border"
                style={{ background: bgColor, borderColor }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{conta.clienteNome}</span>
                      {isAtrasado && (
                        <Badge className="text-white text-xs border-0" style={{ background: 'hsl(352,100%,62%)' }}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {conta.diasAtraso} dia{conta.diasAtraso !== 1 ? 's' : ''} atrasado
                        </Badge>
                      )}
                      {isHoje && (
                        <Badge className="text-[hsl(220,20%,4%)] text-xs border-0" style={{ background: 'hsl(38,95%,54%)' }}>
                          Vence hoje
                        </Badge>
                      )}
                      {conta.diasAtraso < 0 && (
                        <Badge className="text-white text-xs border-0" style={{ background: 'hsl(217,91%,60%)' }}>
                          Em {Math.abs(conta.diasAtraso)} dia{Math.abs(conta.diasAtraso) !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{conta.produtoNome}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-semibold">
                        {formatarMoeda(conta.valorPendente)}
                      </span>
                      {conta.dataVencimento && (
                        <span className="text-muted-foreground">
                          Venc: {formatarData(conta.dataVencimento)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conta.clienteContato && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsApp(conta)}
                        className="border hover:bg-[hsl(152,100%,41%,0.1)]"
                        style={{ color: 'hsl(152,100%,41%)', borderColor: 'hsl(152,100%,41%,0.3)' }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Confirmar baixa total de ${formatarMoeda(conta.valorPendente)}?`)) {
                          onRegistrarPagamento(
                            conta.vendaId,
                            conta.valorPendente,
                            new Date().toISOString().split('T')[0],
                            'Baixa via Lembrete'
                          );
                        }
                      }}
                      className="border hover:bg-[hsl(217,91%,60%,0.1)]"
                      style={{ color: 'hsl(217,91%,60%)', borderColor: 'hsl(217,91%,60%,0.3)' }}
                      title="Baixar valor total"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {contas.length > 5 && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-muted-foreground hover:text-foreground"
            onClick={() => setMostrarTodos(!mostrarTodos)}
          >
            {mostrarTodos ? 'Mostrar menos' : `Ver mais ${contas.length - 5} contas`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
