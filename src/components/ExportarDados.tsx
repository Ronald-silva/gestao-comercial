import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Produto, Venda } from '@/types';
import { formatarData } from '@/lib/utils';
import { useDados } from '@/hooks/useDados';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExportarDadosProps {
  produtos: Produto[];
  vendas: Venda[];
}

export function ExportarDados({ produtos, vendas }: ExportarDadosProps) {
  const { limparDados } = useDados();

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
      const vendasData = vendas.flatMap(v => {
        if (!v.itens || v.itens.length === 0) return [];
        
        return v.itens.map(item => {
          const produto = produtos.find(p => p.id === item.produtoId);
          const lucro = produto ? (item.precoUnitario - produto.precoCusto) * item.quantidade : 0;
          return {
            'Data': formatarData(v.dataVenda),
            'Recibo': v.id.substring(0, 8),
            'Cliente': v.clienteNome,
            'Contato': v.clienteContato || '-',
            'Produto': item.produtoNome,
            'Quantidade': item.quantidade,
            'Preço Unitário': item.precoUnitario,
            'Valor Item': item.quantidade * item.precoUnitario,
            'Custo Total': produto ? produto.precoCusto * item.quantidade : 0,
            'Lucro': lucro,
            'Margem (%)': item.precoUnitario > 0 ? ((lucro / (item.quantidade * item.precoUnitario)) * 100).toFixed(2) : 0,
            'Forma de Pagamento': v.formaPagamento,
            'Status Pagamento': v.pagamento.status,
            'Observações': v.observacoes || '-',
          };
        });
      });

      // Resumo
      const totalVendas = vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => sum + v.valorTotal, 0);
      const totalRecebido = vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => sum + v.pagamento.valorRecebido, 0);
      const totalCusto = vendas.filter(v => v.status !== 'cancelada').reduce((sum, v) => {
        return sum + (v.itens?.reduce((sumItem, item) => {
          const produto = produtos.find(p => p.id === item.produtoId);
          return sumItem + (produto ? produto.precoCusto * item.quantidade : 0);
        }, 0) || 0);
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
      
      const rows = vendas.flatMap(v => {
        if (!v.itens) return [];
        return v.itens.map(item => {
          const produto = produtos.find(p => p.id === item.produtoId);
          const lucro = produto ? (item.precoUnitario - produto.precoCusto) * item.quantidade : 0;
          return [
            formatarData(v.dataVenda),
            v.clienteNome,
            item.produtoNome,
            item.quantidade,
            item.quantidade * item.precoUnitario,
            v.formaPagamento,
            v.pagamento.status,
            lucro,
          ];
        });
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
    <div className="flex gap-1 sm:gap-2 items-center">
      <Button variant="outline" size="sm" onClick={exportarExcel} className="text-green-700 border-green-300 hover:bg-green-50 min-h-[44px] px-2 sm:px-3" title="Exportar Excel">
        <FileSpreadsheet className="h-4 w-4 sm:mr-2 shrink-0" />
        <span className="hidden sm:inline">Excel</span>
      </Button>
      <Button variant="outline" size="sm" onClick={exportarCSV} className="text-blue-700 border-blue-300 hover:bg-blue-50 min-h-[44px] px-2 sm:px-3" title="Exportar CSV">
        <FileText className="h-4 w-4 sm:mr-2 shrink-0" />
        <span className="hidden sm:inline">CSV</span>
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-50 min-h-[44px] px-2 sm:px-3" title="Limpar Dados">
            <Trash2 className="h-4 w-4 sm:mr-2 shrink-0" />
            <span className="hidden sm:inline">Resetar</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação irá apagar TODOS os dados (produtos, vendas, clientes) do seu navegador.
              Isso não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={limparDados} className="bg-red-600 hover:bg-red-700">
              Sim, apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
