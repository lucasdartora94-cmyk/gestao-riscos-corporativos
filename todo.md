# Sistema de Gestão de Riscos Corporativos - TODO

## Banco de Dados / Schema
- [x] Tabela `risks` com todos os 23 campos obrigatórios da matriz
- [x] Campos calculados persistidos: inherentRisk, inherentRiskLevel, residualRisk, residualRiskLevel, suggestedDecision
- [x] Migração SQL aplicada via webdev_execute_sql

## Backend (tRPC Routers)
- [x] Router `risks.create` - criar risco com validação Zod
- [x] Router `risks.list` - listar com filtros (macroprocesso, categoria, nível, status, busca)
- [x] Router `risks.getById` - buscar risco por ID
- [x] Router `risks.update` - atualizar risco
- [x] Router `risks.updateStatus` - atualizar apenas o status do plano de ação
- [x] Router `risks.delete` - excluir risco (admin ou owner)
- [x] Router `risks.exportExcel` - exportar para Excel compatível com modelo
- [x] Router `risks.dashboard` - dados agregados para dashboard
- [x] Lógica de cálculo: risco inerente = impacto × probabilidade
- [x] Lógica de cálculo: risco residual = risco inerente × fator de eficácia
- [x] Lógica de classificação: nível de risco (Baixo, Médio, Alto, Muito Alto, Crítico)
- [x] Lógica de sugestão de decisão: Aceitar, Monitorar, Mitigar, Escalonar
- [x] Controle de acesso: admin vê todos; usuário vê apenas os seus

## Frontend - Layout e Navegação
- [x] AppLayout com sidebar elegante (dark sidebar + light content)
- [x] Tema visual sofisticado (cores OKLCH, tipografia Inter+Playfair, shadows)
- [x] Rota `/` - Dashboard executivo
- [x] Rota `/login` - Página de login
- [x] Rota `/riscos` - Listagem da matriz de riscos
- [x] Rota `/riscos/novo` - Formulário de cadastro
- [x] Rota `/riscos/:id` - Detalhe do risco
- [x] Rota `/riscos/:id/editar` - Edição do risco
- [x] Rota `/plano-de-acao` - Painel de plano de ação

## Frontend - Formulário de Cadastro (23 campos)
- [x] Campo 1: Código do macroprocesso
- [x] Campo 2: Código do risco
- [x] Campo 3: Qual o risco? (descrição)
- [x] Campo 4: O que pode acontecer? (evento)
- [x] Campo 5: Categoria do risco (select com 6 categorias)
- [x] Campo 6: Descrição financeiro/conformidade
- [x] Campo 7: Impacto (1-5 com labels e seletor visual colorido)
- [x] Campo 8: Probabilidade (1-5 com labels e seletor visual colorido)
- [x] Campo 9: Risco inerente (calculado automaticamente em tempo real)
- [x] Campo 10: Controles internos existentes
- [x] Campo 11: Eficácia do controle (5 opções visuais coloridas)
- [x] Campo 12: Risco residual (calculado automaticamente em tempo real)
- [x] Campo 13: Causas do risco
- [x] Campo 14: Classificação da causa
- [x] Campo 15: Categoria da causa (select com 7 categorias)
- [x] Campo 16: Consequências do risco
- [x] Campo 17: Classificação da consequência
- [x] Campo 18: Categoria da consequência (select com 6 categorias)
- [x] Campo 19: Ação de tratamento (4 botões visuais: Aceitar/Monitorar/Mitigar/Escalonar)
- [x] Campo 20: Plano de ação (descrição)
- [x] Campo 21: Prazo de implementação (date)
- [x] Campo 22: Responsável
- [x] Campo 23: Status das ações (select: Pendente/Em andamento/Concluído/Atrasado)
- [x] Painel de cálculo em tempo real no topo do formulário
- [x] Sugestão automática de decisão (Aceitar/Monitorar/Mitigar/Escalonar)

## Frontend - Listagem e Filtros
- [x] Tabela responsiva com colunas principais
- [x] Filtro por macroprocesso
- [x] Filtro por categoria do risco
- [x] Filtro por nível de risco residual
- [x] Filtro por status das ações
- [x] Busca por texto livre
- [x] Badges coloridos por nível de risco (RiskBadge, StatusBadge, DecisionBadge)
- [x] Ações: visualizar, editar, excluir (com confirmação)
- [x] Paginação

## Frontend - Dashboard Executivo
- [x] Heatmap 5×5 de risco inerente com legenda de cores
- [x] Heatmap 5×5 de risco residual com legenda de cores
- [x] Gráfico de barras horizontais por categoria de risco
- [x] Gráfico de pizza por nível de risco residual
- [x] Gráfico de pizza por status das ações
- [x] Gráfico de barras por decisão sugerida
- [x] Cards de KPIs: total, críticos, muito altos, em tratamento, concluídos, atrasados
- [x] Estado vazio com CTA para cadastrar primeiro risco

## Frontend - Painel de Plano de Ação
- [x] Listagem de todos os planos de ação
- [x] Status: Pendente, Em andamento, Concluído, Atrasado
- [x] Indicador visual de prazo (vencido, próximo, ok)
- [x] Filtro por status e busca por texto
- [x] Atualização de status inline via dropdown
- [x] Cards KPI clicáveis para filtrar por status

## Exportação Excel
- [x] Instalação do pacote exceljs
- [x] Geração de arquivo .xlsx com 26 colunas
- [x] Cabeçalho principal colorido (azul escuro)
- [x] Cabeçalhos das colunas formatados
- [x] Formatação de células (cores por nível de risco, zebra striping)
- [x] Download via base64 no cliente

## Autenticação e Controle de Acesso
- [x] Login via Manus OAuth
- [x] Admin/owner: acesso total a todos os riscos
- [x] Usuário comum: acesso apenas aos seus registros
- [x] Proteção de rotas no frontend (redirect para login)
- [x] Proteção de procedures no backend (protectedProcedure)

## Testes
- [x] Testes unitários para cálculo de risco inerente (18 testes passando)
- [x] Testes unitários para cálculo de risco residual
- [x] Testes unitários para classificação de nível de risco
- [x] Testes unitários para sugestão de decisão
- [x] Testes para auth.logout
- [x] Zero erros TypeScript (tsc --noEmit)

## Correções
- [x] Corrigir `<a>` aninhado no Login.tsx (Button asChild)
- [x] Corrigir `<a>` aninhado no AppLayout.tsx (Link sem <a> interno)

## Melhorias Identificadas
- [x] Adicionar filtro por responsável no painel de plano de ação
- [x] Aumentar pageSize do painel de plano de ação para suportar mais de 100 registros (500)
- [x] Adicionar testes de router para risks.create
- [x] Adicionar testes de router para risks.list com filtros
