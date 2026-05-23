# Ideias de Design — Consulta CNPJ

<response>
<probability>0.07</probability>
<idea>
**Design Movement:** Neo-Brutalism Corporativo
**Core Principles:**
- Bordas sólidas e espessas como elemento estrutural
- Tipografia pesada e assertiva para dados críticos
- Sombras offset (box-shadow deslocado) em vez de difusas
- Contraste alto entre fundo e elementos de dados

**Color Philosophy:** Fundo branco puro (#FFFFFF), texto quase-preto (#111111), acento amarelo-limão (#F5E642) para estados ativos e CTAs. A cor serve como sinalização, não decoração.

**Layout Paradigm:** Coluna única centrada com largura máxima de 720px. Cada seção de dados é um bloco com borda esquerda espessa colorida como indicador semântico (verde = ativo, vermelho = irregular).

**Signature Elements:**
- Bordas 2px solid black em todos os cards
- Box-shadow offset: `4px 4px 0px #111`
- Labels em uppercase com letter-spacing largo

**Interaction Philosophy:** Feedback imediato e óbvio. O botão "consultar" tem animação de press (translateY(2px) + shadow menor). Erros são exibidos em blocos vermelhos sólidos.

**Animation:** Entrada dos cards com slide-up de 200ms ease-out. Skeleton loader com pulse simples.

**Typography System:** `Space Grotesk` (bold 700) para títulos e valores; `IBM Plex Mono` para CNPJ, CEP e dados técnicos.
</idea>
</response>

<response>
<probability>0.06</probability>
<idea>
**Design Movement:** Data Dashboard Minimalista — Estilo Governo Digital Moderno
**Core Principles:**
- Hierarquia de informação clara através de tamanho e peso tipográfico
- Uso de cor apenas para semântica (status, alertas, categorias)
- Espaçamento generoso como sinal de confiança e clareza
- Cards com separação visual por sombra sutil, sem bordas

**Color Philosophy:** Fundo cinza-pedra muito claro (`#F8F7F5`), cards brancos com sombra suave. Azul-índigo (`#3B4FD8`) como cor primária institucional. Verde-esmeralda para status ativo, âmbar para pendente, vermelho para irregular.

**Layout Paradigm:** Layout assimétrico de duas colunas no desktop: coluna esquerda estreita com o formulário de busca fixo (sticky), coluna direita larga com os resultados. No mobile, empilha verticalmente.

**Signature Elements:**
- Pill badges coloridos para status da empresa
- Linha divisória com gradiente para separar seções
- Número do CNPJ em fonte mono grande no topo do resultado

**Interaction Philosophy:** Transições suaves de 250ms. O campo de CNPJ tem focus ring azul-índigo. Loading state com skeleton animado que imita o layout do resultado.

**Animation:** Resultado entra com fade + translateY(-8px) em 300ms. Cada card de detalhe tem stagger de 40ms. Hover nos itens da lista dinâmica com background highlight suave.

**Typography System:** `Plus Jakarta Sans` (600/700) para headings; `Inter` (400/500) para corpo; `JetBrains Mono` para valores técnicos (CNPJ, CEP, datas).
</idea>
</response>

<response>
<probability>0.08</probability>
<idea>
**Design Movement:** Editorial Técnico — Inspirado em relatórios financeiros digitais
**Core Principles:**
- Grid de 12 colunas com alinhamento preciso
- Tipografia serifada para títulos confere autoridade
- Dados numéricos e técnicos em destaque visual
- Fundo escuro (dark mode) como padrão para reduzir fadiga em consultas frequentes

**Color Philosophy:** Fundo `#0F1117` (quase-preto azulado), superfícies `#1A1D27`, texto primário `#E8EAF0`. Acento ciano-elétrico `#00D4FF` para interações e valores importantes. Verde `#22C55E` para status ativo.

**Layout Paradigm:** Header fixo com logo e campo de busca integrado. Abaixo, grid de cards com larguras variadas (alguns 1/3, outros 2/3) para criar ritmo visual. A seção de dados dinâmicos usa um layout de tabela estilizada.

**Signature Elements:**
- Linhas horizontais finas como separadores (1px, opacity 0.15)
- Valores numéricos em fonte mono com cor de acento
- Badge de "status" com glow sutil (box-shadow com cor semântica)

**Interaction Philosophy:** Hover states com transição de cor de fundo de 150ms. Botão de consulta com efeito de ripple. JSON viewer com syntax highlighting.

**Animation:** Entrada do resultado com curtain reveal (clip-path de cima para baixo). Contador de campos preenchidos anima o número com spring.

**Typography System:** `Playfair Display` (700) para o título principal; `Sora` (400/600) para corpo e labels; `Fira Code` para dados técnicos.
</idea>
</response>

## Escolha Final

**Abordagem 2: Data Dashboard Minimalista — Estilo Governo Digital Moderno**

Layout assimétrico no desktop com formulário sticky à esquerda e resultados à direita. Paleta institucional azul-índigo com semântica de cores para status. Tipografia Plus Jakarta Sans + JetBrains Mono. Cards com sombra suave, sem bordas pesadas. Animações de entrada com stagger nos cards de detalhe.
