import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Produto, Venda } from '@/types';
import { formatarData } from '@/lib/utils';

interface ExportarDadosProps {
  produtos: Produto[];
  vendas: Venda[];
}

export function ExportarDados({ produtos, vendas }: ExportarDadosProps) {
  const exportarExcel = () => {
    try {
      // Planilha de Produtos
      const produtosData = produtos.map(p => ({
        'Nome': p.nome,
        'Descrição': p.descricao,
        'Categoria': p.categoria,
        'Preço de Custo': p.precoCusto,
        'Preço de Venda': p.precoVenda,
        'Lucro Unitário': p.precoVenda - p.precoCusto,
        'Margem (%)': ((p.precoVenda - p.precoCusto) / p.precoVenda * 100).toFixed(2),
        'Quantidade': p.quantidade,
        'Fornecedor': p.fornecedor || '-',
        'Data da Compra': formatarData(p.dataCompra),
      }));

      // Planilha de Vendas
      const vendasData = vendas.map(v => {
        const produto = produtos.find(p => p.id === v.produtoId);
        const lucro = produto ? (v.precoUnitario - produto.precoCusto) * v.quantidade : 0;
        return {
          'Data': formatarData(v.dataVenda),
          'Cliente': v.clienteNome,
          'Contato': v.clienteContato || '-',
          'Produto': v.produtoNome,
          'Quantidade': v.quantidade,
          'Preço Unitário': v.precoUnitario,
          'Valor Total': v.valorTotal,
          'Custo Total': produto ? produto.precoCusto * v.quantidade : 0,
          'Lucro': lucro,
          'Margem (%)': ((lucro / v.valorTotal) * 100).toFixed(2),
          'Forma de Pagamento': v.formaPagamento,
          'Parcelas': v.numeroParcelas,
          'Status Pagamento': v.pagamento.status,
          'Valor Recebido': v.pagamento.valorRecebido,
          'Valor Pendente': v.pagamento.valorTotal - v.pagamento.valorRecebido,
          'Observações': v.observacoes || '-',
        };
      });

      // Resumo
      const totalVendas = vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => sum + v.valorTotal, 0);
      const totalRecebido = vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => sum + v.pagamento.valorRecebido, 0);
      const totalCusto = vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => {
        const produto = produtos.find(p => p.id === v.produtoId);
        return sum + (produto ? produto.precoCusto * v.quantidade : 0);
      }, 0);
      const totalLucro = totalVendas - totalCusto;

      const resumoData = [{
        'Métrica': 'Total em Vendas',
        'Valor': totalVendas,
      }, {
        'Métrica': 'Total Recebido',
        'Valor': totalRecebido,
      }, {
        'Métrica': 'Total a Receber',
        'Valor': totalVendas - totalRecebido,
      }, {
        'Métrica': 'Custo Total',
        'Valor': totalCusto,
      }, {
        'Métrica': 'Lucro Total',
        'Valor': totalLucro,
      }, {
        'Métrica': 'Margem Média (%)',
        'Valor': totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(2) : 0,
      }, {
        'Métrica': 'Total de Produtos',
        'Valor': produtos.length,
      }, {
        'Métrica': 'Total de Vendas',
        'Valor': vendas.filter(v => v.status !== 'cancelada').length,
      }];

      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      const wsResumo = XLSX.utils.json_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      
      const wsProdutos = XLSX.utils.json_to_sheet(produtosData);
      XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos');
      
      const wsVendas = XLSX.utils.json_to_sheet(vendasData);
      XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas');

      // Download
      const data = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Gestao_Vendas_${data}.xlsx`);
      
      toast.success('Dados exportados para Excel com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const exportarCSV = () => {
    try {
      // CSV de Vendas (mais usado)
      const headers = ['Data', 'Cliente', 'Produto', 'Quantidade', 'Valor Total', 'Forma Pagamento', 'Status', 'Lucro'];
      
      const rows = vendas.map(v => {
        const produto = produtos.find(p => p.id === v.produtoId);
        const lucro = produto ? (v.precoUnitario - produto.precoCusto) * v.quantidade : 0;
        return [
          formatarData(v.dataVenda),
          v.clienteNome,
          v.produtoNome,
          v.quantidade,
          v.valorTotal,
          v.formaPagamento,
          v.pagamento.status,
          lucro,
        ];
      });

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Dados exportados para CSV com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar CSV');
      console.error(error);
    }
  };

  return (
    <div className="flex gap-1 sm:gap-2">
      <Button variant="outline" size="sm" onClick={exportarExcel} className="text-green-700 border-green-300 hover:bg-green-50 min-h-[44px] px-2 sm:px-3" title="Exportar Excel">
        <FileSpreadsheet className="h-4 w-4 sm:mr-2 shrink-0" />
        <span className="hidden sm:inline">Excel</span>
      </Button>
      <Button variant="outline" size="sm" onClick={exportarCSV} className="text-blue-700 border-blue-300 hover:bg-blue-50 min-h-[44px] px-2 sm:px-3" title="Exportar CSV">
        <FileText className="h-4 w-4 sm:mr-2 shrink-0" />
        <span className="hidden sm:inline">CSV</span>
      </Button>
    </div>
  );
}
