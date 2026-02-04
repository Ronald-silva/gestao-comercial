import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Unused
import { Plus, CheckCircle, HandCoins, History } from 'lucide-react';
import { formatarMoeda, formatarData } from '@/lib/utils';
import type { Emprestimo } from '@/types';

interface EmprestimosProps {
  emprestimos: Emprestimo[];
  onAdicionar: (dados: Omit<Emprestimo, 'id' | 'criadoEm' | 'pagamento' | 'taxaJuros' | 'valorTotal'>) => void;
  onRegistrarPagamento: (id: string, valor: number, data: string, obs?: string) => void;
}

export function Emprestimos({ emprestimos, onAdicionar, onRegistrarPagamento }: EmprestimosProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [modalPagamento, setModalPagamento] = useState<Emprestimo | null>(null);

  const [novoEmprestimo, setNovoEmprestimo] = useState({
    clienteNome: '',
    valorSolicitado: '',
    dataEmprestimo: new Date().toISOString().split('T')[0],
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observacoes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdicionar({
      clienteNome: novoEmprestimo.clienteNome,
      valorSolicitado: parseFloat(novoEmprestimo.valorSolicitado),
      dataEmprestimo: novoEmprestimo.dataEmprestimo,
      dataVencimento: novoEmprestimo.dataVencimento,
      observacoes: novoEmprestimo.observacoes,
      status: 'pendente'
    });
    setModalNovo(false);
    setNovoEmprestimo({
      clienteNome: '',
      valorSolicitado: '',
      dataEmprestimo: new Date().toISOString().split('T')[0],
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacoes: ''
    });
  };

  const handlePagamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPagamento) return;
    
    const form = e.target as HTMLFormElement;
    const valor = parseFloat((form.elements.namedItem('valor') as HTMLInputElement).value);
    const data = (form.elements.namedItem('data') as HTMLInputElement).value;
    const obs = (form.elements.namedItem('obs') as HTMLInputElement).value;

    onRegistrarPagamento(modalPagamento.id, valor, data, obs);
    setModalPagamento(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-indigo-600" />
            Gestão de Empréstimos
          </CardTitle>
          <Button onClick={() => setModalNovo(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Empréstimo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Empr.</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor Orig.</TableHead>
                  <TableHead className="text-right">Total (+10%)</TableHead>
                  <TableHead className="text-right">Falta Pagar</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum empréstimo registrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  emprestimos.map((emp) => {
                    const restante = emp.valorTotal - emp.pagamento.valorRecebido;
                    const atrasado = emp.status !== 'pago' && new Date(emp.dataVencimento) < new Date();
                    
                    return (
                      <TableRow key={emp.id} className={atrasado ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{emp.clienteNome}</TableCell>
                        <TableCell>{formatarData(emp.dataEmprestimo)}</TableCell>
                        <TableCell className={atrasado ? 'text-red-600 font-bold' : ''}>
                          {formatarData(emp.dataVencimento)}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">{formatarMoeda(emp.valorSolicitado)}</TableCell>
                        <TableCell className="text-right font-medium">{formatarMoeda(emp.valorTotal)}</TableCell>
                        <TableCell className="text-right font-bold text-orange-600">
                          {formatarMoeda(restante)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={emp.status === 'pago' ? 'default' : 'secondary'} 
                            className={
                              emp.status === 'pago' 
                                ? 'bg-green-100 text-green-700' 
                                : atrasado 
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }>
                            {emp.status === 'pago' ? 'Quitado' : atrasado ? 'Atrasado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setModalPagamento(emp)}>
                            {emp.status !== 'pago' ? "Baixar" : "Detalhes"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Novo Emprestimo */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome do Cliente *</Label>
              <Input 
                value={novoEmprestimo.clienteNome}
                onChange={e => setNovoEmprestimo({...novoEmprestimo, clienteNome: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Solicitado *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <Input 
                    type="number"
                    step="0.01"
                    className="pl-8"
                    value={novoEmprestimo.valorSolicitado}
                    onChange={e => setNovoEmprestimo({...novoEmprestimo, valorSolicitado: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded border border-blue-100 flex flex-col justify-center">
                <span className="text-xs text-blue-600">Valor Final (Com 10%)</span>
                <span className="font-bold text-blue-800 text-lg">
                  {novoEmprestimo.valorSolicitado ? formatarMoeda(parseFloat(novoEmprestimo.valorSolicitado) * 1.1) : 'R$ 0,00'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Empréstimo</Label>
                <Input 
                  type="date"
                  value={novoEmprestimo.dataEmprestimo}
                  onChange={e => setNovoEmprestimo({...novoEmprestimo, dataEmprestimo: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input 
                  type="date"
                  value={novoEmprestimo.dataVencimento}
                  onChange={e => setNovoEmprestimo({...novoEmprestimo, dataVencimento: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Input 
                value={novoEmprestimo.observacoes}
                onChange={e => setNovoEmprestimo({...novoEmprestimo, observacoes: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Confirmar Empréstimo</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pagamento/Detalhes */}
      <Dialog open={!!modalPagamento} onOpenChange={() => setModalPagamento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Pagamento</DialogTitle>
          </DialogHeader>
          {modalPagamento && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded text-sm">
                <div>
                  <p className="text-gray-500">Total a Pagar</p>
                  <p className="font-bold text-lg">{formatarMoeda(modalPagamento.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Restante</p>
                  <p className="font-bold text-lg text-orange-600">
                    {formatarMoeda(modalPagamento.valorTotal - modalPagamento.pagamento.valorRecebido)}
                  </p>
                </div>
              </div>

              {modalPagamento.valorTotal - modalPagamento.pagamento.valorRecebido > 0.01 && (
                <form onSubmit={handlePagamento} className="space-y-4 border-b pb-6">
                  <h4 className="font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> Novo Pagamento</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Valor</Label>
                      <Input name="valor" type="number" step="0.01" required />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                  </div>
                  <Input name="obs" placeholder="Obs: Dinheiro, Pix..." />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirmar Baixa
                  </Button>
                </form>
              )}

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2"><History className="w-4 h-4"/> Histórico</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {modalPagamento.pagamento.lancamentos.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum pagamento ainda.</p>
                  ) : (
                    modalPagamento.pagamento.lancamentos.map((l, i) => (
                      <div key={i} className="flex justify-between text-sm border p-2 rounded bg-white">
                        <span>{formatarData(l.data)}</span>
                        <span className="font-bold text-green-700">{formatarMoeda(l.valor)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
