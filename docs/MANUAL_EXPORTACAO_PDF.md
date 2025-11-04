# Manual de Exportação de PDFs - Food Cost System

## 📖 Visão Geral

O Food Cost System permite exportar relatórios profissionais das receitas em formato PDF. Esta funcionalidade é útil para:

- Compartilhar receitas com a equipe
- Arquivar documentação de receitas
- Apresentar custos e precificação
- Auditorias e controle de qualidade

---

## 🎯 Como Exportar PDFs

### Exportação Individual

**Passo 1:** Acesse a lista de receitas no sistema

**Passo 2:** Localize a receita desejada

**Passo 3:** Clique no menu de ações (três pontos) da receita

**Passo 4:** Selecione "Visualizar PDF" ou "Exportar para PDF"

**Passo 5:** O PDF será gerado e baixado automaticamente

---

### Exportação em Lote

**Passo 1:** Acesse a lista de receitas

**Passo 2:** Clique no botão "Exportar" no topo da lista

**Passo 3:** Selecione "Exportar para PDF" no dropdown

**Passo 4:** Escolha uma das opções:
- **Receita individual:** Exporta apenas uma receita selecionada
- **Receitas filtradas:** Exporta todas as receitas visíveis após aplicar filtros
- **Todas as receitas:** Exporta todas as receitas do sistema

**Passo 5:** Aguarde o processamento (indicador de loading será exibido)

**Passo 6:** Um arquivo ZIP será baixado contendo todos os PDFs

---

## 📄 Conteúdo do PDF

Cada PDF de receita contém:

### 1. Cabeçalho
- Logo IOGAR
- Nome do sistema
- Design com cores institucionais

### 2. Informações da Receita
- **Código:** Identificador único da receita
- **Nome:** Nome completo da receita
- **Categoria:** Classificação (Sobremesas, Pratos Principais, etc.)
- **Status:** Badge colorido indicando status atual
  - 🟢 Verde: Ativo
  - ⚫ Cinza: Inativo
  - 🟠 Laranja: Pendente
  - 🌸 Rosa: Processado

### 3. Dados Complementares
- **Rendimento:** Quantidade produzida
- **Tempo de Preparo:** Duração estimada em minutos
- **Responsável:** Chef ou pessoa responsável

### 4. Lista de Ingredientes
Tabela completa com:
- Nome do ingrediente
- Quantidade necessária
- Unidade de medida
- Preço unitário
- Custo total do ingrediente

### 5. Precificação e Custos
Seção destacada com:
- **CMV Total:** Custo de Mercadoria Vendida completo
- **CMV Unitário:** Custo por unidade/porção
- **Margem Sugerida:** Percentual de lucro recomendado
- **Preço Sugerido:** Valor de venda calculado
- **Preço de Venda Atual:** Preço praticado (se cadastrado)

### 6. Rodapé
- Data e hora de geração do relatório
- Identificação do sistema

---

## 🎨 Recursos Visuais

### Design Profissional
- Cores institucionais IOGAR (Verde e Rosa)
- Layout limpo e organizado
- Tipografia hierárquica clara

### Elementos Visuais
- ℹ️ Ícones identificando cada seção
- 🎨 Gradiente decorativo no cabeçalho
- 📊 Tabelas estilizadas com linhas zebradas
- 🏷️ Badges coloridos para status

---

## ⚙️ Configurações e Limites

### Limites de Exportação
- **Individual:** 1 receita por vez
- **Lote:** Máximo de 50 receitas por requisição
- **Tamanho:** Arquivos otimizados (aproximadamente 50-200KB por PDF)

### Tempo de Processamento
- **PDF Individual:** ~2-3 segundos
- **Lote (10 receitas):** ~10-15 segundos
- **Lote (50 receitas):** ~40-60 segundos

### Formato dos Arquivos
- **Individual:** `receita_[CODIGO].pdf`
- **Lote:** `receitas_[DATA_HORA].zip`

---

## 🔒 Permissões Necessárias

Para exportar PDFs, você precisa:

✅ Permissão de **Visualizar Receitas**

✅ Acesso ao **restaurante** da receita

**Nota:** Usuários só podem exportar receitas dos restaurantes aos quais têm acesso.

---

## ❓ Perguntas Frequentes

### 1. Posso exportar receitas sem ingredientes?
**Sim.** O PDF será gerado normalmente, indicando "Nenhum ingrediente cadastrado".

### 2. Posso exportar receitas com status "Pendente"?
**Sim.** Receitas pendentes (com insumos sem preço) podem ser exportadas. O status será destacado em laranja no PDF.

### 3. O que acontece se alguma receita não puder ser exportada no lote?
O sistema continua processando as demais e retorna um ZIP apenas com os PDFs gerados com sucesso. Receitas com erro são ignoradas silenciosamente.

### 4. Posso customizar o design do PDF?
Não diretamente. O design segue o padrão institucional IOGAR. Para necessidades específicas, entre em contato com o suporte.

### 5. Os PDFs ficam salvos no sistema?
Não. Os PDFs são gerados sob demanda e não ocupam espaço no servidor. Cada exportação gera um PDF novo com dados atualizados.

### 6. Posso exportar receitas de múltiplos restaurantes?
Sim, desde que você tenha permissão de acesso a todos os restaurantes das receitas selecionadas.

---

## 🐛 Solução de Problemas

### Problema: PDF não baixa automaticamente

**Soluções:**
1. Verifique se seu navegador não está bloqueando downloads
2. Verifique configurações de popup do navegador
3. Tente com outro navegador (Chrome, Firefox, Edge)
4. Limpe cache e cookies

### Problema: PDF aparece em branco

**Soluções:**
1. Atualize seu leitor de PDF
2. Tente abrir com Adobe Acrobat Reader
3. Baixe novamente o arquivo
4. Entre em contato com suporte se persistir

### Problema: Erro ao exportar em lote

**Causas comuns:**
- Lista de receitas vazia
- Mais de 50 receitas selecionadas
- Perda de conexão durante processamento

**Soluções:**
1. Verifique os filtros aplicados
2. Reduza a quantidade de receitas
3. Verifique sua conexão com internet
4. Tente exportar em grupos menores

### Problema: Valores incorretos no PDF

**Soluções:**
1. Verifique se os preços dos insumos estão atualizados
2. Recalcule o CMV da receita antes de exportar
3. Verifique se todos os ingredientes têm preço cadastrado
4. Entre em contato com suporte se os dados estiverem corretos no sistema

---

## 📞 Suporte

### Problemas Técnicos
Entre em contato com o suporte técnico:
- **Email:** suporte@iogar.com.br
- **Telefone:** (00) 0000-0000

### Dúvidas sobre Funcionalidades
Consulte:
- Manual completo do sistema
- Vídeos tutoriais (em breve)
- Base de conhecimento online

---

## 📝 Notas da Versão

### Versão 1.0 (Sprint 4 - Novembro 2025)

**Recursos Implementados:**
- ✅ Exportação individual de receitas
- ✅ Exportação em lote (até 50 receitas)
- ✅ Design profissional com identidade IOGAR
- ✅ Badges coloridos para status
- ✅ Ícones visuais por seção
- ✅ Gradiente decorativo no cabeçalho
- ✅ Arquivo ZIP para múltiplos PDFs
- ✅ Headers otimizados para download

**Próximas Melhorias (Planejadas):**
- 🔄 Gráficos de composição de custos
- 🔄 QR Code para acesso digital
- 🔄 Templates customizáveis
- 🔄 Exportação com fotos das receitas
- 🔄 Histórico de versões do PDF

---

## 📚 Materiais Complementares

- [Manual Completo do Sistema](./MANUAL_COMPLETO.md)
- [Guia de Permissões](./GUIA_PERMISSOES.md)
- [FAQ Geral](./FAQ.md)
- [Políticas de Uso](./POLITICAS.md)

---

**Desenvolvido por IOGAR**  
**Food Cost System v1.0**  
**Última atualização:** Novembro 2025