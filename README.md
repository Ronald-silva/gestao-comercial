# Gestão de Vendas Pro

Um sistema tático de **aceleração e controle de capital de giro**, desenhado primariamente para operadores e vendedores que buscam multiplicar seu capital através do controle rigoroso de lucros, retenção de métricas precisas de velocidade e alocação estratégica de lucros e empréstimos.

Diferente de sistemas de PDV tradicionais, o **Gestão de Vendas Pro** responde a cinco perguntas fundamentais em tempo real:
1. Quanto dinheiro tenho disponível para reinvestir *agora*?
2. Quanto dinheiro está travado em rua (inadimplência ou parcelas)?
3. Qual é o meu giro de capital (vezes que o valor investido foi multiplicado)?
4. Qual é o tempo médio de retorno sobre meu custo?
5. Qual deve ser o próximo passo tático para maximizar minha taxa de juros compostos?

---

## 🎨 Arquitetura Visual (Dark-First)

O projeto adota a premissa de um **"Dark-First" Design System**, desenvolvido para alta visibilidade noturna, menor fadiga de longo uso, e um senso imersivo de "sala de controle". 

Elementos-chave da interface:
* **Backgrounds Profundos**: Uso da paleta `#0b0c10` a `#1a1b23` limitando emissão de luz excessiva (backgrounds brancos).
* **Superfícies (Surface Cards)**: Contornos de destaque leves (`#ffffff10`) e fundos contrastantes leves para componentes.
* **Componentes de Ação Rápida**: Cores brilhantes sinalizativas (`#10b981` para saúde financeira/sucesso, `#f59e0b` para atenção/giro, `#ef4444` para avisos graves).
* **Gráficos Integrados**: Acompanhamento de KPIs sem "quebra" da imersão nas cores (utilizando paletas sombreadas nativas).

---

## 🚀 Módulos Principais

* **Dashboard**: O cockpit. Mostra de imediato a distribuição do capital (travado vs disponível), KPIs vitais (giro de capital e tempo de retorno), e alertas inteligentes do sistema alertando para dinheiro paralisado na praça ou falta de estoque.
* **Vendas**: Foco exclusivo em velocidade e clareza. Possibilidade de vendas a caminho com acompanhamento preciso sobre pagamentos parciais no tempo.
* **Empréstimos / Crédito de Capital**: Uma "ilha" dentro do sistema para controle total de dinheiros emprestados, separando **Juro Amortizado** (onde a dívida é quitada parcela a parcela) de **Juro Recorrente** (onde se recolhe lucro quinzenal mantendo a dívida base ativa e "rendendo").
* **Compras**: Gestão de compras e recargas de estoque rápidas que impactam ativamente o controle do que é alocado x disponível.
* **Metas (Juros Compostos)**: Uma simulação em tempo real para visualizar qual volume o capital irá gerar nos próximos anos sob taxas compostas diárias.

---

## 🛠 Tecnologias e Stack

* **React + Vite**: Engine ultra-rápida de Single Page Application (SPA).
* **TypeScript**: Controle e tipagem de dados críticos matemáticos para não haver erros de arredondamento.
* **Tailwind CSS**: Estilização "Dark-First" com uso utilitário.
* **Lucide React**: Biblioteca iconográfica nativa limpa.
* **Recharts**: Solução completa e adaptada para gráficos integrados de saúde financeira e evolução de recebimentos.

---

## 💻 Instalação & Uso

```bash
# Instalação das dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev

# Fazer a "Build" final
npm run build
```

---

_Aplicativo moldado sob medida para foco na ação financeira, retenção de métricas de capital de giro e conversão acelerada através de design imersivo e sem distrações._
