import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import { formatarMoeda, formatarData, formatarDataHora, gerarNumeroRecibo, formasPagamento } from '@/lib/utils';
import type { Venda } from '@/types';

interface ReciboProps {
  venda: Venda | null;
  aberto: boolean;
  onFechar: () => void;
}

export function Recibo({ venda, aberto, onFechar }: ReciboProps) {
  const reciboRef = useRef<HTMLDivElement>(null);

  if (!venda) return null;

  const numeroRecibo = gerarNumeroRecibo();
  const forma = formasPagamento[venda.formaPagamento];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !reciboRef.current) return;

    const reciboHTML = reciboRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo ${numeroRecibo}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          ${reciboHTML}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const reciboHTML = reciboRef.current?.innerHTML;
    if (!reciboHTML) return;

    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo ${numeroRecibo}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          ${reciboHTML}
        </body>
      </html>
    `], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recibo-${numeroRecibo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Lucro removido temporariamente
  // const lucro = produto ? (venda.precoUnitario - produto.precoCusto) * venda.quantidade : 0;

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Recibo de Venda</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={reciboRef} className="bg-white p-8 border-2 border-gray-200 rounded-lg">
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RECIBO DE VENDA</h1>
            <p className="text-lg text-gray-600">Nº {numeroRecibo}</p>
            <p className="text-sm text-gray-500 mt-1">Data de emissão: {formatarDataHora(new Date())}</p>
          </div>

          {/* Dados da Venda */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Vendedor</h3>
              <p className="text-gray-900 font-medium">Seu Negócio</p>
              <p className="text-gray-600 text-sm">CNPJ: 00.000.000/0000-00</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Cliente</h3>
              <p className="text-gray-900 font-medium">{venda.clienteNome}</p>
              {venda.clienteContato && (
                <p className="text-gray-600 text-sm">{venda.clienteContato}</p>
              )}
            </div>
          </div>

          {/* Detalhes da Venda */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Detalhes da Compra</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">Qtd</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Unitário</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {venda.itens.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 text-gray-900">{item.produtoNome}</td>
                    <td className="py-3 text-center text-gray-900">{item.quantidade}</td>
                    <td className="py-3 text-right text-gray-900">{formatarMoeda(item.precoUnitario)}</td>
                    <td className="py-3 text-right font-semibold text-gray-900">{formatarMoeda(item.quantidade * item.precoUnitario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagamento */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Forma de Pagamento</h3>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <span>{forma.icone}</span>
                {forma.label}
                {venda.numeroParcelas > 1 && ` - ${venda.numeroParcelas}x`}
              </p>
              <p className="text-gray-600 text-sm">Data da venda: {formatarData(venda.dataVenda)}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Valores</h3>
              <div className="space-y-1">
                <p className="text-gray-600 text-sm">Subtotal: {formatarMoeda(venda.valorTotal)}</p>
                <p className="text-2xl font-bold text-gray-900">{formatarMoeda(venda.valorTotal)}</p>
              </div>
            </div>
          </div>

          {/* Parcelas */}
          {venda.pagamento.parcelas && venda.pagamento.parcelas.length > 1 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Parcelas</h3>
              <div className="grid grid-cols-2 gap-2">
                {venda.pagamento.parcelas.map((parcela) => (
                  <div 
                    key={parcela.numero} 
                    className={`flex justify-between items-center p-2 rounded ${
                      parcela.pago ? 'bg-green-100' : 'bg-white border'
                    }`}
                  >
                    <span className="text-sm text-gray-600">
                      {parcela.numero}/{venda.pagamento.parcelas?.length}
                    </span>
                    <span className="font-medium text-gray-900">{formatarMoeda(parcela.valor)}</span>
                    <span className={`text-xs ${parcela.pago ? 'text-green-600' : 'text-gray-400'}`}>
                      {parcela.pago ? '✓ Pago' : `Venc: ${formatarData(parcela.dataVencimento)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status do Pagamento */}
          <div className={`p-4 rounded-lg mb-6 text-center ${
            venda.pagamento.status === 'pago' 
              ? 'bg-green-100 text-green-800' 
              : venda.pagamento.status === 'parcial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            <p className="font-bold text-lg uppercase">
              {venda.pagamento.status === 'pago' 
                ? '✓ PAGAMENTO CONFIRMADO' 
                : venda.pagamento.status === 'parcial'
                ? '⚠ PAGAMENTO PARCIAL'
                : '⏳ AGUARDANDO PAGAMENTO'}
            </p>
            {venda.pagamento.status !== 'pago' && (
              <p className="text-sm mt-1">
                Valor recebido: {formatarMoeda(venda.pagamento.valorRecebido)} de {formatarMoeda(venda.pagamento.valorTotal)}
              </p>
            )}
          </div>

          {/* Informações Internas (Removido temporariamente para suporte a múltiplos itens) */}

          {/* Rodapé */}
          <div className="text-center mt-8 pt-6 border-t border-gray-300">
            <p className="text-sm text-gray-500">Obrigado pela preferência!</p>
            <p className="text-xs text-gray-400 mt-1">Este recibo é um comprovante de transação comercial.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
