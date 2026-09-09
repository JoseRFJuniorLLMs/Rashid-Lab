# SPEC.md — Rashid-Nezhmetdinov

## Sacrifice Discovery, Analysis & Study Laboratory

**Status:** Implementação proposta
**Versão da SPEC:** 2.0 — Consolidada com Sacrifice Forecast Engine
**Escopo:** redesign completo de produto, lógica enxadrística, detecção, descoberta e previsão de sacrifícios, estudo, arquitetura, segurança, dados, calibração estatística, testes, performance e distribuição.
**Repositório-alvo:** `JoseRFJuniorLLMs/Rashid-Nezhmetdinov`
**Princípio:** evoluir o fork do Nibbler para um produto com identidade própria, centrado em **descobrir, validar, explicar, comparar e treinar sacrifícios de xadrez**.

---

# 0. Resumo executivo

O projeto não deve ser apenas uma GUI de Stockfish/Lc0 com ícones de “Brilliant”.

Ele deve virar um laboratório enxadrístico especializado em uma pergunta:

> **Quando, por que e como vale a pena entregar material?**

O produto final deve conseguir:

1. analisar uma partida normalmente;
2. detectar sacrifícios realmente jogados;
3. distinguir sacrifício verdadeiro de pseudo-sacrifício, combinação forçada ou simples erro;
4. prever quando uma posição está evoluindo para um sacrifício;
5. estimar horizonte, pressão sacrificial, peça provável, alvo, zona e motivo;
6. procurar sacrifícios que **não foram jogados**;
7. analisar a aceitação e a recusa do sacrifício;
8. medir a compensação ao longo do tempo;
9. classificar o motivo tático/posicional;
10. comparar Stockfish e Lc0;
11. transformar posições descobertas em exercícios;
12. estudar estilos de jogadores como Nezhmetdinov, Tal, Alekhine, Morphy, Kasparov etc.;
13. construir estatísticas sobre “assinaturas de sacrifício”;
14. calibrar e fazer backtesting das previsões;
15. exportar os resultados como PGN anotado e dados estruturados.

O conceito central do produto deverá ser:

> **Sacrifice Research Engine + Chess Study Lab**

e não “Nibbler com Game Review”.

---

# 1. Auditoria do estado atual

## 1.1 Identidade

Problemas atuais:

- README raiz ainda descreve essencialmente o Nibbler original.
- `package.json` ainda usa o nome `NibblerX`.
- título HTML ainda usa `Nibbler`.
- diversas funções novas convivem com nomenclatura legada.
- o produto não deixa claro, visual ou conceitualmente, que seu diferencial é o estudo de sacrifícios.
- elementos inspirados em outras plataformas aparecem sem um sistema visual unificado.

### Requisito

Adotar identidade própria em todo o produto.

Nome recomendado de interface:

**Rashid Lab**

Nome longo:

**Rashid Nezhmetdinov — Sacrifice Research Lab**

O nome do repositório pode continuar sendo `Rashid-Nezhmetdinov`.

Não copiar visual, ícones, nomenclatura proprietária ou experiência de Chess.com. O produto deve ter linguagem própria.

---

## 1.2 Código

O projeto atual tem sinais claros de crescimento incremental:

- `main.js` é grande e acumula responsabilidades;
- renderer dividido em arquivos numerados depende de ordem global de carregamento;
- houve bug real recente causado pela ordem de criação de `hub`;
- `node_eval/node_eval.js` mistura:
  - cálculo material;
  - heurísticas posicionais;
  - classificação de lances;
  - abertura;
  - popup;
  - imagens;
  - lógica de sacrifício;
  - regras de “brilliant”;
- `nibbler.html` contém grande quantidade de markup, SVG e elementos de revisão;
- existem estilos inline criados por JavaScript;
- `nibbler.css` cresceu sem um design system formal;
- não existe suíte moderna de testes unitários/integrados configurada em `package.json`;
- o projeto possui utilidades como `perft`, mas isso não substitui regressão automatizada do produto.

### Requisito

A implementação deve ser evolutiva, mas eliminar dependência crescente de globais e ordem arbitrária de scripts.

---

## 1.3 Segurança Electron

Estado atual crítico:

```js
contextIsolation: false
nodeIntegration: true
```

Além disso, módulos do renderer usam diretamente:

```js
require("https")
```

Isso deve ser tratado como dívida técnica P0.

### Estado obrigatório

Renderer:

```text
nodeIntegration = false
contextIsolation = true
sandbox = true
```

Acesso privilegiado somente por:

```text
renderer
   ↓
preload
   ↓ contextBridge
IPC tipado e allowlisted
   ↓
main process
```

Nenhum `require("fs")`, `require("https")`, `child_process` ou acesso arbitrário a Node deve permanecer acessível ao renderer.

---

# 2. Objetivos de produto

## 2.1 Objetivo principal

Criar o melhor ambiente desktop especializado em:

- sacrifícios;
- iniciativa;
- compensação;
- cálculo;
- descoberta de ideias não jogadas;
- treinamento baseado em partidas reais.

## 2.2 Objetivos secundários

Manter e melhorar:

- análise Stockfish;
- análise Lc0;
- MultiPV;
- PGN;
- FEN;
- variações;
- Chess960;
- engine UCI customizada;
- importação Lichess;
- importação Chess.com;
- modo humano;
- análise completa de partida;
- biblioteca de jogadores;
- opening explorer;
- gráficos.

---

# 3. Princípios não negociáveis

1. **Engine primeiro, IA textual depois.**
2. LLM nunca decide se um sacrifício é correto.
3. Toda classificação deve ser reproduzível.
4. Resultado deve registrar parâmetros da engine.
5. Sacrifício não pode ser detectado apenas comparando material imediatamente antes/depois.
6. Centipawns não devem ser a única métrica.
7. Preferir WDL / expected score para medir impacto.
8. Stockfish e Lc0 devem ser complementares.
9. Uma classificação precisa explicar **por que** foi gerada.
10. Toda nova feature deve possuir teste ou fixture de regressão.
11. UI não deve bloquear durante análise profunda.
12. Datasets grandes não devem obrigatoriamente fazer parte do bundle.
13. Nenhuma feature nova deve reintroduzir Node.js direto no renderer.
14. Não realizar rewrite total cego antes de criar testes de caracterização.

---

# 4. Modos principais do produto

A aplicação terá cinco modos principais.

## 4.1 ANALYZE

Análise tradicional de uma posição ou partida.

Exibe:

- tabuleiro;
- eval;
- WDL;
- MultiPV;
- melhor linha;
- árvore de variantes;
- material;
- abertura;
- tablebase quando aplicável;
- motivos;
- classificação dos lances.

---

## 4.2 SACRIFICE LAB

Centro do produto.

Funções:

- detectar sacrifício atual;
- avaliar sacrifícios candidatos;
- comparar candidatos;
- mostrar aceitação/recusa;
- mostrar custo material;
- mostrar compensação;
- mostrar horizonte de recuperação;
- mostrar unicidade;
- mostrar dificuldade/surpresa;
- classificar tipo;
- calcular `Rashid Score`.

---

## 4.3 DISCOVER

Procura ideias que não foram jogadas.

Entrada:

- posição;
- PGN;
- coleção de partidas;
- jogador;
- pasta de PGNs.

Saída:

- ranking de sacrifícios candidatos;
- posições críticas;
- oportunidades perdidas;
- “hidden sacrifices”;
- ideias encontradas apenas em profundidades maiores;
- sacrifícios descobertos por Stockfish;
- sacrifícios descobertos por Lc0;
- consenso ou divergência das engines.

---

## 4.4 STUDY

Transforma descobertas em treinamento.

Modos:

- encontre o sacrifício;
- calcule a aceitação;
- calcule a recusa;
- escolha entre dois sacrifícios;
- qual é a compensação?;
- identifique o motivo;
- encontre a continuação;
- sacrifício correto ou especulativo?;
- ataque ou final?;
- cálculo sem engine.

---

## 4.5 CORPUS

Análise estatística de jogadores e coleções.

Exemplos:

- Nezhmetdinov;
- Tal;
- Alekhine;
- Morphy;
- Fischer;
- Kasparov;
- Leela;
- partidas pessoais.

---

# 5. Redesign visual

## 5.1 Direção visual

Evitar aparência genérica de dashboard SaaS e evitar clone de Chess.com/Lichess.

Conceito:

**laboratório escuro + tabuleiro clássico + instrumentação científica.**

Paleta dark sugerida:

```css
--bg-0: #090b0e;
--bg-1: #10141a;
--bg-2: #171c24;
--bg-3: #202733;

--text-0: #f2ede3;
--text-1: #c4c7cf;
--text-2: #88919f;

--rashid-gold: #d3a82b;
--attack-red: #e15c4a;
--initiative-orange: #d9883d;
--positive-teal: #32b7a1;
--analysis-blue: #5887c7;
--purple: #8b73d6;
```

Tabuleiro clássico próprio:

```css
--board-light: #e6d5b8;
--board-dark: #8b5e43;
```

Criar também tema claro.

---

## 5.2 Design tokens

Criar:

```text
ui/tokens.css
ui/theme-dark.css
ui/theme-light.css
```

Tokens obrigatórios:

- cores;
- tipografia;
- spacing;
- radius;
- shadows;
- z-index;
- duração de animações;
- tamanhos do tabuleiro;
- densidade de painéis.

Eliminar progressivamente:

- `style.cssText` criado em JS;
- cores hardcoded;
- tamanhos duplicados;
- estilos inline no HTML.

---

# 6. Layout principal

Desktop:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Command Bar | Engine | Profile | Search | Position | Settings     │
├───────────────┬───────────────────────────┬────────────────────────┤
│               │                           │                        │
│ Evaluation    │                           │ Analysis / Sacrifice   │
│ WDL Bar       │          BOARD            │                        │
│               │                           │ Candidate 1            │
│               │                           │ Candidate 2            │
│               │                           │ Candidate 3            │
├───────────────┴───────────────────────────┼────────────────────────┤
│ TIMELINE / EVAL / MATERIAL / INITIATIVE  │ Explain / Motifs       │
├───────────────────────────────────────────┴────────────────────────┤
│ Moves | PGN | Variations | Study | Corpus | Discover              │
└────────────────────────────────────────────────────────────────────┘
```

Painéis devem ser:

- redimensionáveis;
- recolhíveis;
- persistidos por usuário;
- restaurados ao iniciar.

---

# 7. Tabuleiro

## 7.1 Overlays

Criar camadas independentes:

```text
Board
 ├─ PiecesLayer
 ├─ LastMoveLayer
 ├─ EngineArrowLayer
 ├─ CandidateArrowLayer
 ├─ AttackMapLayer
 ├─ DefenderLayer
 ├─ SacrificeLayer
 ├─ KingZoneLayer
 ├─ HeatmapLayer
 ├─ AnnotationLayer
 └─ TrainingLayer
```

Atalhos permitem ativar/desativar cada overlay.

---

## 7.2 Sacrifice overlay

Quando um sacrifício for detectado:

- peça vítima recebe halo dourado/vermelho;
- casa onde material é entregue recebe marcador;
- capturador provável recebe contorno;
- linha de aceitação aparece como seta pontilhada;
- compensação aparece em casas relevantes.

Exemplo:

```text
Nxf7!!
victim: Knight
cost: 3.2
accepted by: Kxf7
compensation:
  + exposed king
  + forced checks
  + rook entry
  + mate threat
```

---

## 7.3 Attack Map

Mostrar:

- número de atacantes;
- número de defensores;
- pressão;
- casas críticas;
- king ring;
- linhas abertas;
- diagonais;
- pins;
- overloaded defenders.

Nunca usar apenas “cor bonita”.

Tooltip deve explicar a razão.

---

# 8. Sacrifice Engine

Esta é a parte mais importante da implementação.

---

# 8.1 Definição operacional

Um lance é um **candidato a sacrifício** quando cria deliberadamente a possibilidade de o adversário obter vantagem material local ou temporária, enquanto a avaliação objetiva do jogador não se deteriora de forma incompatível com a compensação pretendida.

Não basta:

```text
material_after < material_before
```

Também é necessário investigar:

```text
offer
acceptance
best response
material deficit
duration
compensation
evaluation
uniqueness
```

---

# 8.2 Taxonomia

Cada sacrifício deve possuir `kind`.

Valores:

```text
PAWN_GAMBIT
MINOR_PIECE
EXCHANGE
ROOK
QUEEN
MULTI_PIECE
MATERIAL_RETURN
CLEARANCE
DEFLECTION
ATTRACTION
INTERFERENCE
DECOY
DEMOLITION
KING_HUNT
LINE_OPENING
DEVELOPMENT
INITIATIVE
POSITIONAL
PASSED_PAWN
PROMOTION
FORTRESS
PERPETUAL
DEFENSIVE
STALEMATE
ENDGAME_TRANSITION
DESPERADO
COUNTER_SACRIFICE
```

Um evento pode possuir múltiplos motivos.

---

# 8.3 Tipos de validade

```text
SOUND
PLAYABLE
SPECULATIVE
DUBIOUS
UNSOUND
FORCED
DRAWING
WINNING
```

Separar completamente isso de `kind`.

Exemplo:

```json
{
  "kind": ["QUEEN", "KING_HUNT", "DEFLECTION"],
  "soundness": "SOUND"
}
```

---

# 8.4 Sacrifício verdadeiro vs pseudo-sacrifício

## TRUE_SACRIFICE

Material permanece inferior durante um horizonte significativo e a compensação não é simples recuperação imediata.

## PSEUDO_SACRIFICE

Material é aparentemente entregue, mas é recuperado de forma forçada quase imediatamente.

## COMBINATION

Sacrifício faz parte de sequência tática forçada que recupera material ou dá mate.

## SPECULATIVE_SACRIFICE

Compensação existe, porém engine mostra perda objetiva relevante.

## BLUNDER

Material é perdido sem compensação suficiente.

A UI deve deixar isso explícito.

---

# 9. Candidate Generation

Para cada posição `P`:

```text
legal_moves(P)
```

executar filtro barato antes da análise profunda.

---

## 9.1 Candidate triggers

Um lance entra na fila de candidatos quando pelo menos uma condição ocorre:

### A. Negative SEE

Static Exchange Evaluation negativa após o lance.

### B. Offered piece

O lance deixa uma própria peça capturável e a captura apresenta SEE positivo ao adversário.

### C. Capture-sacrifice

A peça captura material menor e pode ser recapturada.

### D. Exchange-sacrifice

Torre por peça menor.

### E. Queen offer

Dama fica capturável por material inferior.

### F. Newly hanging

Uma peça antes segura se torna materialmente vulnerável.

### G. Forced material concession

A linha principal perde material por design em até `N` plies.

### H. Quiet sacrifice

Lance sem captura/check deixa material de alto valor disponível.

### I. Defensive sacrifice

Entrega material para evitar derrota, obter fortaleza ou empate.

---

# 10. Acceptance Search

A falha mais comum de detectores simples é chamar qualquer peça pendurada de sacrifício.

Para cada candidato `m`:

```text
P -> m -> P1
```

enumerar respostas adversárias.

Identificar:

```text
best_accepting_response
best_declining_response
```

## Acceptance é válida quando:

- captura ou sequência ganha material;
- resposta está dentro de margem objetiva aceitável da melhor resposta;
- não é uma captura obviamente perdedora;
- material ganho permanece por tempo suficiente.

Guardar:

```json
{
  "acceptanceMove": "...",
  "acceptanceRank": 1,
  "acceptanceWDL": {},
  "declineMove": "...",
  "declineWDL": {}
}
```

---

# 11. Material timeline

Criar série:

```text
ply
material_balance
piece_vector
```

Não utilizar somente escala 1/3/3/5/9 fixa.

Manter duas métricas:

## Nominal material

Configurável:

```text
P = 1.00
N = 3.20
B = 3.33
R = 5.10
Q = 9.50
```

## Engine-derived material context

Usar evaluation/WDL para complementar.

Guardar vetor:

```json
{
  "white": {
    "p": 6,
    "n": 1,
    "b": 2,
    "r": 2,
    "q": 1
  },
  "black": {}
}
```

---

# 12. Recovery Horizon

Definir:

```text
recovery_horizon = primeiro ply em que o déficit material
retorna para dentro da tolerância configurada
```

Exemplo:

```text
Nxf7
material delta: -3.2
deficit persists: 9 plies
recovered at ply: +10
```

Se recuperação for imediata em sequência forçada:

```text
pseudo-sacrifice / combination
```

Se não houver recuperação e posição continuar forte:

```text
true positional sacrifice
```

---

# 13. Avaliação por WDL

Não usar somente centipawns.

Guardar:

```json
{
  "cp": 34,
  "mate": null,
  "wdl": {
    "win": 0.41,
    "draw": 0.45,
    "loss": 0.14
  }
}
```

Calcular:

```text
expected_score = win + 0.5 * draw
```

Então:

```text
loss = EP_before - EP_after
```

Isso evita erros como tratar:

```text
+7.0 -> +5.0
```

como equivalente a:

```text
+0.7 -> -1.3
```

---

# 14. Engine Consensus

Suportar dois analisadores principais.

## 14.1 Stockfish

Função:

- força tática;
- SEE;
- WDL;
- MultiPV;
- tablebase;
- validação objetiva.

## 14.2 Lc0

Função:

- avaliação neural;
- política;
- avaliação posicional;
- divergência estratégica;
- busca alternativa.

Resultado:

```json
{
  "stockfish": {},
  "lc0": {},
  "consensus": {
    "status": "AGREE | DISAGREE | PARTIAL",
    "confidence": 0.0
  }
}
```

---

# 15. Engine disagreement

Divergência é uma feature, não um erro.

Criar painel:

```text
STOCKFISH             LC0

Nxf7  +0.42           Nxf7  +0.18
Qh5   +0.31           Qh5   +0.47
```

Detectar:

```text
rank disagreement
WDL disagreement
PV disagreement
policy/eval tension
```

Permitir “Deep Compare”.

---

# 16. Sacrifice Deep Validation

Pipeline:

```text
Stage 0  Static Filter
Stage 1  Quick Engine
Stage 2  Acceptance Search
Stage 3  MultiPV Validation
Stage 4  Deep Search
Stage 5  Second Engine
Stage 6  Motif Classification
Stage 7  Explanation
Stage 8  Cache
```

## Profile QUICK

Para análise em tempo real.

Exemplo:

```text
depth 14–18
MultiPV 3
```

## Profile DEEP

Para partida.

```text
depth 22–28 ou limite por nodes
MultiPV 5
```

## Profile RESEARCH

Para confirmação.

```text
node budget alto
MultiPV 8+
Stockfish + Lc0
```

Não fixar apenas depth. Usuário deve poder usar nodes/time.

---

# 17. Stability check

Um sacrifício somente recebe alta confiança se a classificação for estável.

Guardar snapshots:

```text
depth 16
depth 20
depth 24
depth 28
```

Comparar:

- melhor lance;
- WDL;
- material;
- PV;
- classificação.

Campo:

```json
{
  "stability": 0.93,
  "firstStableDepth": 21
}
```

Sacrifício que só aparece como bom em baixa profundidade deve receber alerta.

---

# 18. Uniqueness

Medir quanto o sacrifício é necessário.

```text
best EP
second best EP
third best EP
```

```text
uniqueness = best - second
```

Categorias:

```text
FORCED
UNIQUE
CLEAR_BEST
ONE_OF_SEVERAL
OPTIONAL
```

Isso diferencia:

- sacrifício necessário;
- sacrifício bonito mas redundante.

---

# 19. Surprise / Findability

Criar `surpriseScore`.

Sinais:

1. frequência do lance em banco de partidas;
2. frequência da posição;
3. ranking MultiPV;
4. profundidade onde o lance estabiliza;
5. se é check;
6. se é captura;
7. se é quiet move;
8. magnitude material entregue;
9. opcional: modelo de jogada humana por faixa de Elo.

Movimentos quietos e raros podem receber maior surpresa do que checks óbvios.

---

# 20. Compensation Model

A compensação precisa ser explicada por componentes.

Objeto:

```json
{
  "material": -3.2,
  "kingSafety": +2.4,
  "initiative": +1.8,
  "mobility": +0.6,
  "development": +0.5,
  "space": +0.4,
  "passedPawns": 0,
  "bishopPair": 0,
  "openLines": +0.8,
  "forcedThreat": +2.1,
  "mateThreat": false
}
```

Os scores NÃO substituem engine eval.

Eles servem para explicação.

---

# 21. King Safety

Substituir heurística simples de peões próximos ao rei.

Medir:

- king ring attacks;
- attackers;
- weighted attacker value;
- queen proximity;
- rook access;
- open files adjacentes;
- open diagonals;
- pawn shield;
- pawn storm;
- legal king squares;
- forcing checks;
- mate threats.

---

# 22. Mobility

Não usar apenas:

```text
board.movegen().length
```

sem controlar corretamente o lado analisado.

Calcular separadamente:

```text
white mobility
black mobility
```

e, opcionalmente:

```text
safe mobility
```

descontando casas imediatamente perdedoras.

---

# 23. Center Control

Não contar apenas peças ocupando d4/e4/d5/e5.

Criar mapas de ataque.

Medir:

```text
attacks on:
d4 e4 d5 e5

extended:
c3 d3 e3 f3
c4 f4
c5 f5
c6 d6 e6 f6
```

---

# 24. Open Lines

Distinguir:

```text
open file
semi-open file
open diagonal
rook access
queen access
bishop battery
x-ray
```

Uma coluna sem peão próprio não é automaticamente uma vantagem.

---

# 25. Initiative

Criar `initiativeScore`.

Sinais:

- checks disponíveis;
- forcing captures;
- threats;
- tempo sobre peças;
- king danger;
- opponent forced moves;
- PV branching factor;
- opponent mobility restriction.

Métrica interessante:

```text
forcedness = 1 - normalized_good_reply_count
```

Posição onde adversário possui apenas uma resposta razoável tem alta iniciativa.

---

# 26. Motif Classifier

Suportar motivos:

```text
attraction
deflection
clearance
interference
overloading
removal_of_defender
xray
pin
skewer
fork
discovered_attack
double_check
desperado
zwischenzug
king_hunt
greek_gift
back_rank
line_opening
diagonal_opening
file_opening
decoy
promotion
underpromotion
passed_pawn
fortress
perpetual
stalemate
```

Um sacrifício pode possuir vários motivos.

---

# 27. Motif detection architecture

Cada detector:

```ts
interface MotifDetector {
  id: string
  detect(ctx: PositionContext): MotifEvidence[]
}
```

Evidence:

```json
{
  "motif": "DEFLECTION",
  "confidence": 0.91,
  "pieces": ["f6", "g7"],
  "squares": ["h7"],
  "reason": "..."
}
```

Não criar uma função gigantesca com todos os motivos.

---

# 28. Rashid Score

Criar score próprio do produto.

Escala:

```text
0–100
```

Componentes iniciais:

```text
Soundness        25
Sacrifice Cost   15
Uniqueness       15
Surprise         15
Compensation     15
Forcedness       10
Aesthetic         5
```

Fórmula configurável.

Exemplo:

```text
RASHID SCORE 93

Soundness       24/25
Sacrifice       14/15
Uniqueness      15/15
Surprise        13/15
Compensation    14/15
Forcedness       9/10
Aesthetic        4/5
```

### Regras

- Nunca usar Rashid Score para determinar correção.
- `Soundness` deriva da análise objetiva.
- `Aesthetic` deve ser explicável.
- pesos devem viver em configuração, não hardcoded espalhados pelo renderer.

---

# 29. Discovery Engine

Este módulo procura sacrifícios não jogados.

Para cada posição de uma partida:

```text
1. reconstruir posição
2. gerar candidates
3. quick score
4. descartar lixo
5. deep validate top candidates
6. comparar com lance jogado
```

Resultado:

```text
Move 23
Played: Qd2
Hidden sacrifice: Rxf7!
Rashid Score: 88
Expected Score gain: +0.21
```

---

# 30. Sacrifice Opportunity

Diferenciar:

```text
PLAYED_SACRIFICE
MISSED_SACRIFICE
ALTERNATIVE_SACRIFICE
DEFENSIVE_SACRIFICE
SPECULATIVE_IDEA
```

Isso cria uma experiência que praticamente nenhuma GUI tradicional oferece de forma especializada.

---

# 31. Corpus Scanner

Entrada:

```text
PGN file
directory
player database
Lichess import
Chess.com import
```

Pipeline deve funcionar em background.

Exibir:

```text
2,431 games
188,040 positions
4,902 candidates
742 deep validations
137 sound sacrifices
```

---

# 32. Player Sacrifice Signature

Para cada jogador:

```json
{
  "games": 1000,
  "sacrifices": 86,
  "sacrificesPer100Games": 8.6,
  "queenSacRate": 0.07,
  "exchangeSacRate": 0.24,
  "acceptedRate": 0.63,
  "soundRate": 0.81,
  "averageRashidScore": 74,
  "favoriteMotifs": [
    "KING_HUNT",
    "DEFLECTION"
  ]
}
```

---

# 33. Comparador de jogadores

Tela:

```text
NEZHMETDINOV   TAL   ALEKHINE   MORPHY
```

Comparar:

- sacrifícios/100 partidas;
- peça sacrificada;
- abertura;
- fase da partida;
- motivo;
- taxa de aceitação;
- resultado;
- correção;
- surpresa;
- Rashid Score;
- king attacks;
- exchange sacs.

Visualizações:

- radar;
- histogramas;
- timeline;
- matriz jogador × motivo.

---

# 34. Dataset interno

Criar catálogo local.

Não carregar PGNs enormes inteiros no DOM.

Arquitetura:

```text
PGN
 ↓ streaming parser
GameIndex
 ↓
SQLite
```

Banco recomendado:

```text
rashid.db
```

---

# 35. Schema SQLite

## games

```sql
id
source
event
site
date
round
white
black
white_elo
black_elo
result
eco
opening
pgn_path
pgn_offset
pgn_length
hash
```

## positions

```sql
id
game_id
ply
fen
position_hash
```

## engine_runs

```sql
id
engine
engine_version
network_hash
options_hash
search_type
search_value
created_at
```

## move_evals

```sql
position_id
move_uci
engine_run_id
rank
cp
mate
win
draw
loss
nodes
depth
seldepth
pv
```

## sacrifices

```sql
id
position_id
move_uci
classification
piece
material_cost
recovery_horizon
soundness
rashid_score
confidence
```

## motifs

```sql
sacrifice_id
motif
confidence
evidence_json
```

## training

```sql
position_id
mode
attempts
successes
last_attempt
next_review
difficulty
```

---

# 36. Position cache

Criar chave:

```text
normalized FEN
engine binary hash
network hash
engine options hash
search budget
MultiPV
```

Não repetir análise já calculada.

---

# 37. Analysis Cache

Níveis:

```text
L1 memory
L2 SQLite
L3 optional persisted analysis files
```

Evitar recomputar coleção inteira depois de reiniciar.

---

# 38. Datasets grandes

PGNs gigantes não devem necessariamente ficar dentro do instalador.

Criar:

```text
Dataset Manager
```

Pacotes:

```text
Nezhmetdinov
Tal
Alekhine
Morphy
Kasparov
TCEC
Lc0
Lichess Sacrifices
```

Cada pacote:

```json
{
  "name": "...",
  "version": "...",
  "sha256": "...",
  "size": 123,
  "license": "...",
  "source": "..."
}
```

Permitir instalar/remover.

---

# 39. Lichess Puzzle Dataset

Adicionar importador opcional da base pública de puzzles do Lichess.

Usar themes, especialmente:

```text
sacrifice
attraction
clearance
deflection
interference
fork
pin
xRayAttack
kingsideAttack
exposedKing
quietMove
```

Uso:

- treinamento;
- validação do motif classifier;
- testes positivos;
- benchmark.

Não assumir que os labels são perfeitos.

---

# 40. Gold Corpus

Criar dataset curado próprio:

```text
tests/corpus/sacrifices/
```

Categorias:

```text
true/
pseudo/
speculative/
blunder/
queen/
exchange/
positional/
defensive/
mate/
rejected/
```

Cada fixture:

```json
{
  "fen": "...",
  "move": "Rxf7",
  "expected": {
    "candidate": true,
    "trueSacrifice": true,
    "kind": ["ROOK", "KING_HUNT"],
    "soundness": "SOUND"
  }
}
```

---

# 41. Explain Engine

Explicação deve vir de fatos calculados.

Formato:

```json
{
  "facts": [
    "White gives up a rook for a knight",
    "Black's king loses two pawn defenders",
    "White obtains three forcing checks",
    "The material deficit persists for 7 plies"
  ]
}
```

Depois gerar linguagem natural.

---

# 42. Explain sem LLM

Implementar templates primeiro.

Exemplo:

```text
Rxf7! oferece uma torre por um cavalo.
Após Kxf7, o rei preto fica exposto e as brancas obtêm
três lances forçados consecutivos. A engine mantém 61% de
expected score apesar do déficit de aproximadamente 2 pontos.
```

---

# 43. IA opcional

Depois dos fatos estruturados, permitir:

```text
local LLM
remote LLM provider
disabled
```

Uso permitido:

- explicar;
- resumir;
- criar exercício;
- comparar planos;
- gerar anotação PGN textual.

Uso proibido:

- decidir legalidade;
- decidir avaliação;
- decidir se sacrifício é sound;
- inventar linhas.

Toda linha citada pela IA deve existir na árvore analisada.

---

# 44. Study Mode

## 44.1 Find the Sacrifice

Mostrar posição sem engine.

Usuário joga.

Responder:

```text
correct
near miss
interesting alternative
incorrect
```

---

## 44.2 Accept the Sacrifice

Depois de encontrar o lance:

```text
Opponent accepts.
Calculate the continuation.
```

---

## 44.3 Decline the Sacrifice

Treinar variantes onde o adversário recusa.

---

## 44.4 Explain the Compensation

Usuário escolhe:

```text
king attack
material recovery
passed pawn
fortress
initiative
development
```

Pode haver múltiplas respostas.

---

# 45. Spaced Repetition

Implementar scheduler.

Campos:

```text
difficulty
stability
retrievability
last_review
next_review
```

Pode usar algoritmo FSRS ou equivalente, isolado atrás de interface.

---

# 46. Métricas pessoais

Dashboard:

```text
Sacrifice Vision
Calculation Accuracy
Average Solve Time
Accepted-line Accuracy
Declined-line Accuracy
Motif Accuracy
Queen Sacrifice Accuracy
Exchange Sacrifice Accuracy
```

Heatmap:

```text
motif × performance
```

---

# 47. Blunder Review especializado

Em vez de apenas:

```text
Mistake
Blunder
```

mostrar:

```text
MISSED SACRIFICE
FALSE SACRIFICE
PREMATURE SACRIFICE
WRONG ACCEPTANCE
WRONG FOLLOW-UP
FAILED CALCULATION
```

---

# 48. Timeline

Criar timeline central da partida.

Camadas:

```text
Evaluation
Expected Score
Material
Initiative
King Danger
Sacrifice Events
Mistakes
Opening/Middlegame/Endgame
```

Eventos de sacrifício aparecem como marcadores.

Clique:

```text
jump to position
```

---

# 49. Material Investment Graph

Novo gráfico exclusivo:

Eixo X:

```text
ply
```

Eixo Y:

```text
material investment
```

Exemplo:

```text
0
-1 pawn
-3 knight
-5 rook
```

Overlay:

```text
expected score
```

Objetivo:

visualizar situações onde alguém fica materialmente pior enquanto sua posição melhora.

Este gráfico deve ser uma assinatura visual do Rashid Lab.

---

# 50. Compensation Timeline

Para um sacrifício selecionado:

```text
Move       Material  WDL   King danger  Initiative
Nxf7       -3.2      54%   +1.8         +2.1
...Kxf7    -3.2      58%   +3.0         +2.8
Qh5+       -3.2      65%   +4.1         +3.2
...
```

---

# 51. Candidate Comparison

Selecionar até três movimentos:

```text
Nxf7
Bxh7
Qh5
```

Comparar:

- WDL;
- cp;
- material cost;
- sacrifice type;
- recovery horizon;
- king danger;
- uniqueness;
- surprise;
- Rashid Score;
- PV.

---

# 52. Opening integration

Substituir lookup ad hoc por serviço dedicado.

Modelo:

```ts
OpeningService.lookup(position): OpeningInfo
```

Usar dataset ECO completo.

Mostrar:

```text
ECO
family
variation
subvariation
distance from book
```

---

# 53. Sacrifice by Opening

No Corpus:

```text
Sicilian Najdorf      18.4 sacs / 100 games
King's Indian         15.9
French Winawer        13.1
...
```

Permitir explorar posições recorrentes.

---

# 54. Query/Filter

Criar busca estruturada.

Exemplos de UI:

```text
piece = queen
soundness = sound
rashid_score > 80
phase = middlegame
motif = deflection
player = Tal
```

Posteriormente aceitar DSL:

```text
piece:queen score:>80 motif:deflection
```

---

# 55. Pesquisa por posição

Indexar `position_hash`.

Permitir:

```text
same position
transposition
similar material
same opening
same sacrifice motif
```

Busca de similaridade geométrica pode ser futura.

---

# 56. Export

Formatos:

## PGN

Adicionar comentários e NAG.

Evitar tags não padronizadas quando comentário PGN for suficiente.

Permitir custom headers opcionais:

```text
[RashidScore "91"]
[Sacrifice "Queen"]
[Motifs "Deflection,KingHunt"]
```

## JSON

Schema versionado.

## CSV

Para pesquisa estatística.

## HTML report

Relatório visual exportável.

---

# 57. Engine Manager

Criar módulo de domínio independente.

```text
EngineManager
 ├─ discover()
 ├─ launch()
 ├─ stop()
 ├─ analyse()
 ├─ cancel()
 ├─ health()
 └─ profile()
```

---

# 58. UCI transport

Criar parser robusto.

Eventos:

```text
uciok
readyok
info
bestmove
option
id
```

Parser de `info` deve suportar:

```text
depth
seldepth
multipv
score cp
score mate
wdl
nodes
nps
hashfull
tbhits
time
pv
```

---

# 59. Engine job queue

Análises profundas nunca devem congelar a interface.

```text
priority queue
```

Prioridades:

```text
P0 current position
P1 user deep analysis
P2 sacrifice validation
P3 full game
P4 corpus scan
P5 background enrichment
```

---

# 60. Cancellation

Toda análise precisa ser cancelável.

Quando posição muda:

```text
cancel stale job
```

Não permitir que resultado antigo sobrescreva posição nova.

Usar:

```text
jobId
positionHash
generation
```

---

# 61. Engine crash recovery

Se processo UCI morrer:

```text
detect exit
mark job failed
restart engine
restore options
retry max 1
```

Depois:

```text
surface error
```

Nunca loop infinito.

---

# 62. Resource profiles

Perfis:

```text
Laptop
Desktop
Workstation
Custom
```

Controlam:

- threads;
- hash;
- number of concurrent engines;
- node budget;
- Lc0 backend.

---

# 63. Tablebases

Integrar Syzygy quando disponível.

Para <= 7 peças:

```text
DTZ
WDL
```

Sacrifícios de final precisam usar tablebase como autoridade quando possível.

---

# 64. Performance

Metas iniciais:

## UI

```text
interaction response < 50 ms
board move rendering < 16 ms target
panel switch < 100 ms
```

## PGN

```text
10k games catalogued without blocking UI
```

## Search

```text
library filter < 100 ms for 100k indexed games
```

## Engine

Resultado incremental deve começar a aparecer imediatamente após receber `info`.

---

# 65. Worker model

Trabalho pesado:

```text
PGN parsing
corpus indexing
motif classification
stats
```

deve rodar fora do renderer principal.

Usar:

- worker threads;
- utility process;
- main process services.

---

# 66. Electron security migration

Criar:

```text
src/main/
src/preload/
src/renderer/
```

BrowserWindow:

```js
webPreferences: {
  preload,
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true
}
```

---

# 67. Preload API

Expor apenas:

```ts
window.rashid = {
  engines: {...},
  files: {...},
  imports: {...},
  database: {...},
  settings: {...}
}
```

Não expor:

```text
ipcRenderer
require
fs
shell
child_process
```

---

# 68. IPC validation

Cada canal deve:

- validar argumentos;
- validar origem;
- normalizar paths;
- limitar hosts remotos;
- limitar tamanho;
- tratar timeout.

Schema validation recomendado.

---

# 69. Import Service

Mover lógica de:

```text
renderer/96_import.js
```

para:

```text
main/services/import/
```

Adapters:

```text
LichessProvider
ChessComProvider
LocalPGNProvider
```

Renderer somente pede:

```ts
rashid.imports.fetchGames({
  provider,
  username,
  count
})
```

---

# 70. Network allowlist

Hosts permitidos inicialmente:

```text
lichess.org
api.chess.com
```

Qualquer novo domínio deve ser explicitamente cadastrado.

---

# 71. Content Security Policy

Ativar CSP restritiva.

Meta mínima:

```text
default-src 'self'
script-src 'self'
style-src 'self'
img-src 'self' data:
connect-src 'self'
```

Conexões de rede devem preferencialmente ocorrer no main process.

---

# 72. Arquitetura alvo

```text
src/
├─ main/
│  ├─ app/
│  ├─ windows/
│  ├─ ipc/
│  ├─ engines/
│  ├─ database/
│  ├─ imports/
│  ├─ datasets/
│  └─ settings/
│
├─ preload/
│  ├─ index.ts
│  └─ api-types.ts
│
├─ renderer/
│  ├─ app/
│  ├─ board/
│  ├─ analysis/
│  ├─ sacrifice/
│  ├─ study/
│  ├─ corpus/
│  ├─ explorer/
│  ├─ components/
│  └─ styles/
│
├─ chess/
│  ├─ position/
│  ├─ pgn/
│  ├─ fen/
│  ├─ material/
│  └─ motifs/
│
├─ domain/
│  ├─ sacrifice/
│  ├─ evaluation/
│  ├─ study/
│  └─ corpus/
│
└─ shared/
   ├─ types/
   ├─ schemas/
   ├─ logging/
   └─ utils/
```

---

# 73. TypeScript

Migrar progressivamente para TypeScript.

Config:

```text
strict = true
noImplicitAny = true
noUncheckedIndexedAccess = true
```

Não converter todo o projeto num único commit.

Ordem:

```text
new modules → TypeScript
boundaries → TypeScript
legacy adapters
legacy core last
```

---

# 74. Global state

Eliminar gradualmente dependência de `hub` global.

Criar serviços e store.

Estado:

```text
PositionState
GameState
AnalysisState
EngineState
SacrificeState
StudyState
LayoutState
```

`hub` pode sobreviver temporariamente como adapter.

---

# 75. Event Bus

Eventos tipados:

```text
position.changed
game.loaded
analysis.updated
analysis.completed
sacrifice.detected
engine.started
engine.crashed
study.answer
```

Evitar chamadas DOM cruzadas e mutação global implícita.

---

# 76. UI framework

Não fazer rewrite de framework apenas por estética.

Prioridade:

```text
TypeScript + módulos + componentes claros
```

Se framework for adotado depois, utilizar camada de domínio independente do framework.

A engine, PGN, sacrifice detector e banco não podem depender de React/Vue/Svelte.

---

# 77. HTML

Quebrar `nibbler.html`.

Criar componentes/templates:

```text
AppShell
BoardPanel
AnalysisPanel
SacrificePanel
Timeline
MoveList
StudyPanel
CorpusPanel
EngineStatus
```

Remover grandes SVGs inline duplicados.

Ícones:

```text
assets/icons/
```

---

# 78. CSS

Separar:

```text
tokens.css
base.css
layout.css
board.css
analysis.css
sacrifice.css
study.css
corpus.css
components/
```

Não adicionar um quarto arquivo de overrides para corrigir o terceiro.

---

# 79. Acessibilidade

Obrigatório:

- keyboard navigation;
- focus visible;
- tooltip;
- contraste AA;
- não depender apenas de cor;
- suporte a zoom;
- opção reduzir movimento;
- tamanhos de texto escaláveis.

Atalhos:

```text
← →     navegar lances
↑ ↓     variantes
Space   start/stop engine
D       deep analysis
S       sacrifice lab
T       study
F       flip
E       toggle eval
A       attack map
```

---

# 80. Responsividade desktop

Suportar:

```text
1280×720 mínimo funcional
1920×1080 recomendado
4K
```

Evitar tabuleiro preso em tamanho fixo.

Layout deve priorizar tabuleiro e esconder painéis secundários quando necessário.

---

# 81. Command Palette

Adicionar:

```text
Ctrl+K
```

Comandos:

```text
Open PGN
Load FEN
Import Lichess
Import Chess.com
Start Deep Analysis
Scan Sacrifices
Open Study
Switch Engine
Toggle Attack Map
Export
```

---

# 82. Busca global

Buscar:

- jogador;
- partida;
- abertura;
- FEN;
- motivo;
- sacrifício;
- collection.

---

# 83. Logging

Implementar logger estruturado.

```json
{
  "time": "...",
  "level": "info",
  "module": "engine",
  "event": "analysis.completed",
  "positionHash": "...",
  "durationMs": 2410
}
```

Nunca usar `console.log` como telemetria principal.

---

# 84. Debug panel

Developer mode:

```text
Engine stdout
Engine stderr
IPC calls
Jobs
Cache
DB
Renderer FPS
Memory
```

---

# 85. Testes

Criar camadas.

## Unit

```text
material
SEE
FEN
PGN
WDL
RashidScore
motif detectors
sacrifice classification
```

## Integration

```text
UCI parser
engine manager
SQLite
imports
cache
```

## Regression

```text
known positions
```

## E2E

```text
launch
open PGN
move
analyse
scan sacrifice
study
export
```

---

# 86. Test runner

Adicionar:

```text
Vitest
```

E2E:

```text
Playwright
```

Se Electron E2E exigir adapter específico, encapsular.

---

# 87. Engine stub

Testes não podem depender sempre de Stockfish real.

Criar:

```text
FakeUciEngine
```

Fixtures:

```text
uci
id
option
readyok
info ...
bestmove
```

Permite testar parser, cancelamento e jobs deterministicamente.

---

# 88. Perft

Preservar testes perft existentes e incorporá-los ao CI.

Casos:

- initial position;
- castling;
- en passant;
- promotion;
- checks;
- Chess960 quando aplicável.

---

# 89. Sacrifice regression corpus

Meta inicial:

```text
>= 200 posições
```

Distribuição:

```text
50 true sound
30 pseudo
30 blunders
20 speculative
20 exchange
10 queen
10 rejected sacrifices
10 defensive
20 difficult negatives
```

Meta posterior:

```text
>= 1000
```

---

# 90. False positives obrigatórios

Testar:

1. peça simplesmente pendurada;
2. recaptura imediata;
3. troca equivalente;
4. posição já +10 onde qualquer sacrifício ganha;
5. mate em 1 onde material é irrelevante;
6. sacrifício que opponent não deve aceitar;
7. engine horizon effect;
8. captura forçada;
9. desperado;
10. stalemate trick.

---

# 91. Benchmarks

Criar:

```text
bench/
```

Medir:

```text
PGN parse games/s
positions/s quick scan
candidates/s
DB inserts/s
cache hit rate
UI frame time
```

Benchmark de engine deve registrar hardware e opções.

---

# 92. CI

GitHub Actions:

```text
lint
typecheck
unit
integration
perft
security
build-windows
build-linux
```

E2E completo pode rodar em workflow separado.

---

# 93. Code quality

Adicionar:

```text
ESLint
Prettier
TypeScript
commitlint existente
```

Regras:

- zero novo global implícito;
- zero `eval`;
- zero Node API direta no renderer;
- zero catch vazio;
- zero promise sem handling em boundary crítico.

---

# 94. Dependency policy

Manter dependências pequenas.

Antes de adicionar package:

- justificar;
- verificar manutenção;
- verificar licença;
- verificar tamanho;
- verificar CVEs.

---

# 95. Supply chain

Adicionar:

```text
npm audit
dependency review
SBOM
lockfile
```

Release:

```text
SHA256
```

Posteriormente:

- assinatura;
- provenance;
- code signing.

---

# 96. README

README novo deve começar com:

```text
Rashid Lab is a desktop chess research environment specialized
in discovering, validating and studying sacrifices.
```

Seções:

1. screenshot;
2. conceito;
3. sacrifice engine;
4. Stockfish + Lc0;
5. screenshots;
6. instalação;
7. engines;
8. datasets;
9. privacy;
10. architecture;
11. development;
12. license;
13. attribution ao Nibbler.

---

# 97. Attribution

Como o projeto deriva do Nibbler, preservar corretamente:

- licença;
- copyright;
- atribuições;
- histórico quando legalmente necessário.

Não apagar atribuição para parecer projeto escrito do zero.

Identidade própria não significa apagar proveniência.

---

# 98. Migração dos arquivos atuais

## `files/main.js`

Separar em:

```text
main/index
main/window
main/menu
main/engine
main/ipc
main/settings
```

---

## `files/node_eval/node_eval.js`

Separar em:

```text
domain/evaluation/
domain/sacrifice/
domain/motifs/
renderer/annotations/
renderer/popups/
```

Nenhuma regra de domínio deve depender diretamente de DOM ou `Image`.

---

## `files/renderer/96_import.js`

Mover networking para main process.

Renderer vira apenas UI.

---

## `files/nibbler.html`

Virar AppShell/componentes.

---

## `files/nibbler.css`

Virar design system modular.

---

## `files/renderer/40_position.js`

Preservar inicialmente atrás de adapter.

Adicionar testes antes de refatorar profundamente.

---

## `files/renderer/51_node.js`

Criar tipos claros para árvore de análise e nós PGN.

---

## `files/renderer/52_sorted_moves.js`

Migrar para serviço puro:

```text
MoveRankingService
```

---

## `files/renderer/55_winrate_graph.js`

Evoluir para Timeline.

---

## arquivos PGN

Não usar diretório como banco de UI em escala.

Indexar metadados em SQLite.

---

# 99. Sacrifice Forecast Engine

O `Sacrifice Forecast Engine` é módulo de primeira classe do produto.

Objetivo:

> estimar se uma posição está evoluindo para uma entrega voluntária de material, quais peças e zonas estão envolvidas, em qual horizonte isso tende a ocorrer e quais linhas concretas sustentam a previsão.

Ele NÃO deve produzir uma probabilidade arbitrária a partir de pesos visuais.

Toda previsão precisa ter:

```text
definition
evidence
search tree
calibration model
confidence
horizon
engine/profile provenance
```

Saída principal:

```json
{
  "potential": 0.87,
  "forecast": {
    "horizonPlies": 8,
    "probability": 0.64
  },
  "likelyPieces": [],
  "likelyTargets": [],
  "likelyMotifs": [],
  "zones": {},
  "candidateLines": [],
  "calibration": {}
}
```

---

# 100. Duas noções diferentes de previsão

O produto deve separar rigorosamente:

## OBJECTIVE_SACRIFICE_FORECAST

Pergunta:

> Em quantos futuros enxadristicamente plausíveis existe um sacrifício correto ou jogável dentro do horizonte H?

Fonte:

- Stockfish;
- Lc0;
- MultiPV;
- policy;
- search tree;
- sacrifice detector.

## BEHAVIORAL_SACRIFICE_FORECAST

Pergunta:

> Qual a probabilidade de um humano, ou um perfil específico de jogador, realizar um sacrifício nesta posição ou nos próximos H plies?

Fonte:

- corpus;
- rating;
- jogador;
- contexto;
- modelo humano.

Nunca misturar os dois números.

UI:

```text
Objective sacrifice forecast     71%
Tal-style behavioral forecast    58%
```

---

# 101. Unidade temporal

A unidade canônica será `ply`.

Exemplos:

```text
H = 1   próximo lance do lado a jogar
H = 2   um lance completo
H = 6   três lances completos
H = 10  cinco lances completos
```

A UI pode mostrar “lances”, mas armazenamento/API usa `plies`.

Horizontes padrão:

```text
H1  = 1 ply
H2  = 2 plies
H4  = 4 plies
H6  = 6 plies
H8  = 8 plies
H12 = 12 plies
```

---

# 102. Definição do evento previsto

Uma previsão só pode ser avaliada se o evento `SACRIFICE` possuir definição reproduzível.

Evento:

```text
S(P, line, H) = 1
```

quando dentro dos próximos `H` plies existir movimento classificado pelo Sacrifice Engine como:

```text
TRUE_SACRIFICE
PSEUDO_SACRIFICE
COMBINATION
SPECULATIVE_SACRIFICE
DEFENSIVE_SACRIFICE
```

Configuração deve permitir escolher subconjunto.

Preset recomendado para previsão principal:

```text
TRUE_SACRIFICE
COMBINATION
DEFENSIVE_SACRIFICE
```

Separadamente:

```text
forecastAnySacrifice
forecastSoundSacrifice
forecastTrueSacrifice
```

---

# 103. Sacrifice Potential Score

`SacrificePotential` mede a geometria da posição ANTES da validação de linhas concretas.

Ele NÃO é probabilidade.

Escala:

```text
0–100
```

Componentes:

```text
King Exposure
Attacker Density
Defender Overload
Forcing Move Density
Open-Line Potential
Piece Proximity
Initiative
Development Imbalance
Space / Restriction
Tactical Tension
Material Flexibility
Candidate Offerability
```

Exemplo:

```text
SACRIFICE POTENTIAL

King Exposure          88
Attacker Density       82
Defender Overload      74
Forcing Moves          79
Open-Line Potential    91
Initiative             86
Material Flexibility   62

TOTAL                  87 / 100
```

---

# 104. Potential Score não pode fingir probabilidade

Proibido exibir:

```text
Sacrifice probability: 87%
```

quando o valor for apenas soma ponderada de features.

Deve aparecer:

```text
Sacrifice Potential: 87/100
```

Probabilidade só pode aparecer depois de modelo calibrado.

---

# 105. Feature vector do Forecast

Criar estrutura:

```ts
interface SacrificeForecastFeatures {
  kingExposure: number
  attackerDensity: number
  defenderOverload: number
  forcingMoveDensity: number
  openLinePotential: number
  initiative: number
  developmentImbalance: number
  spaceAdvantage: number
  tacticalTension: number
  materialFlexibility: number
  offerablePieceCount: number
  quietOfferCount: number
  forcingSacrificeCandidateCount: number
  bestCandidateExpectedScore: number
  candidateConsensus: number
}
```

Todas as features devem possuir documentação matemática e teste.

---

# 106. Sacrifice Pressure Map

Calcular para cada peça própria:

```text
SacrificePressure(piece, H)
```

Interpretação:

> massa de linhas plausíveis, dentro do horizonte H, em que a peça é voluntariamente oferecida ou participa como investimento material principal.

Saída:

```json
[
  {
    "square": "f1",
    "piece": "R",
    "pressure": 0.82,
    "candidateCount": 9
  }
]
```

---

# 107. Visualização do Pressure Map

No tabuleiro:

- halo sutil;
- contorno;
- intensidade proporcional;
- tooltip obrigatório.

Tooltip:

```text
Rook f1
Sacrifice pressure: 82/100

Main continuations:
Rxf7
Rf6
Rxe6

Primary motifs:
King Hunt
Deflection
File Opening
```

Não depender apenas de cor.

---

# 108. Likely Sacrificed Piece

Saída agregada:

```text
Likely sacrificed piece

Rook       46%
Knight     31%
Bishop     14%
Queen       7%
Pawn        2%
```

Probabilidades devem derivar da massa normalizada de linhas/candidatos do forecast, não de preferência estética.

---

# 109. Likely Target

Identificar alvo do investimento:

```text
king shield
specific defender
specific square
exchange target
promotion blocker
passed pawn
fortress resource
```

Exemplo:

```text
Likely target

f7 defender          0.61
king shield          0.74
dark-square complex  0.33
```

Targets podem sobrepor.

---

# 110. Board Zone Forecast

Dividir:

```text
KINGSIDE
CENTER
QUEENSIDE
GLOBAL
```

Resultado:

```text
Kingside    81%
Center      13%
Queenside    6%
```

Para calcular zona:

- casas do lance de oferta;
- casa do alvo;
- king zone;
- concentração de continuação.

---

# 111. Likely Motif Forecast

Antes do sacrifício efetivo ocorrer, prever motivos prováveis.

Exemplo:

```text
Deflection        0.64
King Hunt         0.59
Line Opening      0.51
Clearance         0.18
```

Isso deve ser calculado a partir de candidatos já validados superficialmente.

Não aplicar motif classifier a uma posição sem linha/evidência.

---

# 112. Candidate Forecast

Tabela:

```text
Move     Objective Mass   Soundness   Horizon   Motif
Rxf7!       0.42            SOUND       +3      King Hunt
Bxh7+       0.23            SOUND       +1      Attraction
Nxf7        0.11            PLAYABLE    +1      Fork
```

`Objective Mass` não deve ser chamado automaticamente de “probabilidade humana”.

---

# 113. Policy Tree

Para Lc0 ou engine/modelo com policy:

```text
root
├── Qh5    p=.21
│   ├── ...
│   └── Rxf7 sacrifice
├── Re1    p=.18
│   └── ...
└── Nf5    p=.14
    └── Nxh6 sacrifice
```

Guardar:

```ts
interface ForecastTreeNode {
  fenHash: string
  move?: string
  weight: number
  cumulativeWeight: number
  evaluation: Evaluation
  sacrificeEvent?: SacrificeEvent
  children: ForecastTreeNode[]
}
```

---

# 114. Forecast com Stockfish

Stockfish não fornece policy humana nativa.

Portanto pesos de linha NÃO podem ser tratados como probabilidade real sem modelo adicional.

Opções:

## Rank-weighted search

```text
w_i = softmax(-lambda * loss_i)
```

onde `loss_i` pode ser:

```text
expected-point loss
```

Serve como massa de plausibilidade objetiva, não probabilidade humana.

## Equal plausible moves

Movimentos dentro de margem `epsilon` recebem peso equivalente.

## Search-tree evidence

Quando API/saída disponível, usar estatísticas consistentes.

UI deve chamar:

```text
objective path mass
```

e não “human probability”.

---

# 115. Forecast com Lc0

Quando policy estiver disponível:

```text
P(move | position)
```

pode ser usada como peso de trajetória do próprio modelo.

Ainda assim:

> policy do Lc0 não é probabilidade humana.

Nome:

```text
Lc0 policy mass
```

A previsão humana exige calibração em partidas humanas.

---

# 116. Fórmula de massa sacrificial

Para árvore de linhas:

```text
M_sac(H) = Σ_i W(line_i) * I[S(line_i, H)]
```

onde:

```text
W(line_i)
```

é peso normalizado da linha.

A saída deve armazenar:

```text
weighting_method
tree_width
tree_depth
search_budget
engine
```

---

# 117. Forecast por múltiplos horizontes

Exibir curva:

```text
Within 1 ply      0.14
Within 2 plies    0.31
Within 4 plies    0.57
Within 6 plies    0.73
Within 8 plies    0.79
```

A curva deve ser monotônica:

```text
P(H2) >= P(H1)
```

Teste obrigatório.

---

# 118. Expected Sacrifice Time

Calcular, condicionado a existir evento:

```text
E[T_sac | sacrifice within H]
```

Exemplo:

```text
Expected sacrifice time: 4.3 plies
Most likely window: 3–5 plies
```

Não mostrar se a massa sacrificial for muito baixa.

---

# 119. Forecast confidence

Separar:

```text
forecast probability
forecast confidence
```

Confiança depende de:

- estabilidade entre profundidades;
- concordância engines;
- tamanho da árvore;
- cobertura da massa;
- calibração histórica;
- qualidade do modelo;
- transposição/cached evidence.

Exemplo:

```text
Forecast:   64%
Confidence: HIGH
```

---

# 120. Forecast stability

Executar em budgets diferentes:

```text
quick
medium
deep
```

Comparar:

```text
P4 quick   0.59
P4 medium  0.63
P4 deep    0.64
```

Stability:

```text
1 - normalized_variance
```

Se oscilar muito:

```text
UNSTABLE FORECAST
```

---

# 121. Multi-engine Forecast Consensus

Resultado:

```json
{
  "stockfishPathMass": 0.58,
  "lc0PolicyMass": 0.71,
  "consensus": 0.64,
  "disagreement": 0.13
}
```

Não usar média ingênua por padrão.

Configuração de consenso deve considerar:

- calibração de cada modelo;
- corpus;
- horizonte;
- tipo de posição.

---

# 122. Sacrifice Forecast Panel

Tela principal:

```text
┌ SACRIFICE FORECAST ──────────────────────────┐
│ Potential                         91 / 100    │
│ Objective forecast ≤4 plies          64%     │
│ Confidence                           HIGH    │
│ Expected horizon                  3–5 plies  │
│ Primary zone                     Kingside    │
│ Likely investment                  Rook      │
│ Main motifs                King Hunt / Defl. │
│                                             │
│ CANDIDATES                                  │
│ Rxf7!    mass .42   SOUND      +3 plies     │
│ Bxh7+    mass .23   SOUND      +1 ply       │
│ Nxf7     mass .11   PLAYABLE   +1 ply       │
│                                             │
│ TRIGGERS                                    │
│ f7 overloaded                              │
│ king has two safe squares                  │
│ e-file opening potential                   │
└─────────────────────────────────────────────┘
```

---

# 123. Forecast Timeline

Adicionar camada à timeline:

```text
Sacrifice Forecast
```

Visualizar:

```text
move 12   18/100
move 16   32/100
move 20   51/100
move 23   76/100
move 24   SACRIFICE
```

Permite estudar “acúmulo de pressão”.

---

# 124. Pre-sacrifice Window

Quando sacrifício real ocorre no ply `t`:

```text
window = [t-k, t)
```

Guardar features em cada ply.

Isso permite estudar:

> quais sinais aparecem antes de sacrifícios reais?

Dataset:

```text
position_at_t_minus_1
position_at_t_minus_2
...
```

---

# 125. Backtesting

Nenhuma afirmação pública de “prevê sacrifícios” sem backtesting.

Pipeline:

```text
historic game
↓
position at ply t
↓
compute forecast using only information available at t
↓
freeze prediction
↓
inspect future H plies
↓
label occurred / did not occur
```

Proibido usar features calculadas com informação futura no momento da previsão.

---

# 126. Leakage prevention

Evitar:

- usar PGN future moves como feature;
- usar avaliação calculada a partir da linha real como se estivesse disponível;
- usar tags criadas após análise completa;
- calibrar e testar na mesma partida/jogador sem split adequado.

Criar testes de leakage.

---

# 127. Dataset split

Splits recomendados:

```text
train
validation
test
```

Além disso:

```text
player-disjoint split
event-disjoint split
time-disjoint split
```

Para medir generalização.

---

# 128. Métricas do Forecast

Obrigatórias:

```text
Brier Score
Log Loss
Expected Calibration Error
Calibration Curve
Precision
Recall
F1
PR-AUC
ROC-AUC
```

Para eventos raros, enfatizar:

```text
PR-AUC
Brier
Calibration
```

Não vender ROC-AUC isoladamente.

---

# 129. Calibration

Modelos possíveis:

```text
Platt scaling
Isotonic regression
Beta calibration
```

Escolher por validação.

Armazenar versão:

```json
{
  "model": "isotonic",
  "version": "forecast-cal-v3",
  "trainedOn": "...",
  "horizon": 8
}
```

---

# 130. Reliability Diagram

Tela de desenvolvimento/pesquisa:

```text
Predicted 0.1 → observed 0.12
Predicted 0.3 → observed 0.28
Predicted 0.5 → observed 0.53
Predicted 0.7 → observed 0.69
Predicted 0.9 → observed 0.86
```

Objetivo:

previsões calibradas.

---

# 131. Baselines

Forecast precisa superar baselines.

## Baseline 0

Sempre prever frequência global.

## Baseline 1

Somente king danger.

## Baseline 2

Somente número de forcing moves.

## Baseline 3

Somente candidate count.

## Baseline 4

Heurística linear atual.

Só aceitar modelo complexo se superar baseline fora da amostra.

---

# 132. Behavioral Player Model

Modelo:

```text
P(sacrifice within H | position, player/context)
```

Inputs possíveis:

```text
position features
rating
time control
color
opening
phase
player identity
historical style embedding
event importance if known
```

Identidade do jogador deve ser opcional.

---

# 133. Player Style Embedding

Criar vetor baseado SOMENTE em histórico enxadrístico observável:

```text
sacrifice frequency
piece investment distribution
king-attack frequency
quiet sacrifice rate
soundness distribution
forcingness
opening distribution
material imbalance preference
```

Não inferir personalidade psicológica.

---

# 134. Rating-conditioned model

Quando jogador específico não possuir corpus suficiente:

```text
P(sacrifice | position, rating_bucket)
```

Buckets configuráveis:

```text
<1200
1200–1599
1600–1999
2000–2299
2300–2499
2500+
```

Com dados suficientes, usar modelo contínuo.

---

# 135. Player-conditioned UI

Exemplo:

```text
OBJECTIVE POSITION
Sacrifice forecast ≤4 plies       64%

BEHAVIOR MODEL
Nezhmetdinov-style                71%
Tal-style                         66%
Generic 2400+                     41%
```

Deve mostrar claramente que modelos de estilo são estatísticos e dependem do corpus.

---

# 136. Forecast training corpus

Gerar dataset:

```text
forecast_samples
```

Schema:

```sql
id
game_id
position_id
ply
horizon
objective_features_json
player_features_json
event_occurred
event_type
event_ply
sacrifice_id
split
```

---

# 137. Forecast service API

```ts
interface SacrificeForecastService {
  potential(position: Position): SacrificePotential

  objectiveForecast(
    position: Position,
    options: ForecastOptions
  ): Promise<ObjectiveForecast>

  behavioralForecast(
    position: Position,
    player: PlayerContext,
    options: ForecastOptions
  ): Promise<BehavioralForecast>

  backtest(
    dataset: DatasetRef,
    options: BacktestOptions
  ): Promise<BacktestReport>
}
```

---

# 138. Acceptance criteria do Forecast

O módulo só está concluído quando:

```text
[ ] Potential Score separado de probabilidade
[ ] forecast por múltiplos horizontes
[ ] árvore/evidência reproduzível
[ ] pressure map
[ ] likely piece
[ ] likely target
[ ] likely motif
[ ] board zone
[ ] candidate forecast
[ ] confidence/stability
[ ] backtesting sem leakage
[ ] calibration curve
[ ] Brier Score
[ ] PR-AUC
[ ] baselines
[ ] behavioral model separado do objetivo
[ ] testes unitários e integração
[ ] resultado guarda engine/version/profile
```

Nenhuma UI pode mostrar percentual de previsão se `calibrationStatus != READY`.

---

# 139. Fases de implementação

# PHASE 0 — Baseline e segurança

**Prioridade:** BLOQUEANTE

Implementar:

- testes de caracterização;
- build reproduzível;
- lint;
- TypeScript para novos arquivos;
- preload;
- contextIsolation;
- nodeIntegration false;
- sandbox;
- IPC tipado;
- mover import remoto para main;
- CSP;
- logging básico.

### Aceitação

- aplicação inicia;
- engines funcionam;
- PGN funciona;
- Lichess/Chess.com funcionam;
- modo humano funciona;
- zero `require()` no renderer;
- testes passam.

---

# PHASE 1 — Product shell / visual

Implementar:

- nova identidade Rashid Lab;
- AppShell;
- design tokens;
- layout próprio;
- painéis resize;
- command palette;
- status da engine;
- timeline base;
- remover estilos inline críticos;
- Sacrifice Lab como navegação de primeira classe.

### Aceitação

A aplicação deve parecer um produto próprio mesmo com detector antigo por baixo.

---

# PHASE 2 — Engine architecture

Implementar:

- EngineManager;
- UCI parser;
- queue;
- cancelamento;
- profiles;
- cache;
- health;
- crash recovery;
- WDL;
- MultiPV consistente;
- Stockfish;
- Lc0;
- provenance dos resultados.

### Aceitação

Trocar de posição rapidamente não pode mostrar resultado stale.

---

# PHASE 3 — Sacrifice Engine v1

Implementar:

- SEE;
- material timeline;
- candidate generation;
- acceptance search;
- decline search;
- true/pseudo;
- combination;
- WDL loss;
- soundness;
- recovery horizon;
- evidence object.

### Aceitação

Gold corpus inicial >= 200 posições.

Targets iniciais:

```text
precision >= 0.90
recall >= 0.85
```

no corpus interno, com métricas por categoria.

Não falsificar meta reduzindo corpus.

---

# PHASE 4 — Compensation + Motifs

Implementar:

- attack maps;
- king safety;
- initiative;
- mobility;
- open lines;
- motifs;
- explanations;
- Rashid Score;
- Sacrifice Microscope;
- Accept/Decline Tree.

### Aceitação

Cada sacrifício exibido deve responder:

```text
what was sacrificed?
could it be accepted?
was acceptance good?
why is sacrifice sound?
what compensation exists?
how long does deficit last?
which motifs apply?
```

---

# PHASE 5 — Sacrifice Forecast Engine

Implementar:

- Sacrifice Potential;
- Objective Forecast;
- múltiplos horizontes;
- Policy/Path Tree;
- Pressure Map;
- likely sacrificed piece;
- likely target;
- likely motif;
- board zone;
- candidate forecast;
- forecast stability;
- multi-engine consensus;
- confidence;
- backtesting;
- leakage protection;
- calibration;
- baselines;
- Brier/PR-AUC/ECE.

### Aceitação

Nenhum percentual é exibido sem modelo calibrado.

Backtesting deve ser reproduzível e usar somente informação disponível no instante previsto.

---

# PHASE 6 — Discover

Implementar:

- whole-game scan;
- missed sacrifice;
- alternative sacrifices;
- background jobs;
- progress;
- candidate ranking;
- deep validation;
- batch scan;
- ligação com Forecast para encontrar posições onde pressão sacrificial cresceu mas não foi convertida.

### Aceitação

Usuário abre um PGN e recebe lista reproduzível de oportunidades jogadas, perdidas e alternativas.

---

# PHASE 7 — Study

Implementar:

- puzzles;
- hidden engine;
- acceptance;
- decline;
- motif questions;
- forecast-before-move exercises;
- spaced repetition;
- metrics.

---

# PHASE 8 — Corpus Research

Implementar:

- SQLite library;
- players;
- stats;
- filters;
- comparison;
- dataset manager;
- export;
- pre-sacrifice windows;
- sacrifice signatures.

---

# PHASE 9 — Behavioral Player Models

Implementar:

- player-conditioned forecast;
- rating-conditioned forecast;
- style embeddings;
- player-disjoint evaluation;
- calibration específica;
- comparação Nezhmetdinov/Tal/outros.

### Aceitação

Nunca inferir personalidade. Apenas comportamento enxadrístico observável.

---

# PHASE 10 — Multi-engine Research

Implementar:

- Stockfish + Lc0 consensus;
- disagreement;
- deep compare;
- Engine Discovery Tournament;
- forecast ensemble;
- human policy model opcional;
- novelty.

---

# PHASE 11 — Research Platform

Implementar:

- Parquet;
- notebooks/export;
- model cards;
- benchmark reports;
- reproducibilidade;
- datasets versionados;
- experiment registry.

---

# 140. Critérios globais de aceitação

O projeto só será considerado concluído quando:

## Produto

- identidade Nibbler não dominar mais UI;
- README refletir produto real;
- workflows Analyze/Lab/Discover/Study/Corpus existirem.

## Sacrifícios

- verdadeiro vs pseudo;
- sound vs speculative;
- aceitação;
- recusa;
- recovery horizon;
- WDL;
- motivos;
- explicação.

## Engenharia

- renderer sandboxed;
- TypeScript crescente;
- testes;
- CI;
- engine jobs canceláveis;
- cache;
- DB;
- sem dependência de ordem arbitrária para novos módulos.

## UX

- UI responsiva;
- navegação teclado;
- timeline;
- material investment;
- candidate comparison;
- sem popup spam.

## Performance

- scans em background;
- nenhuma operação pesada congela renderer;
- PGNs grandes são indexados/streamed.

---

# 141. Definition of Done por task

Toda tarefa feita por agente precisa conter:

```text
[ ] implementação completa
[ ] testes
[ ] erro tratado
[ ] loading state quando necessário
[ ] empty state
[ ] documentação
[ ] nenhuma regressão conhecida
[ ] sem TODO fake
[ ] lint passa
[ ] typecheck passa
[ ] build passa
```

---

# 142. Regras para agentes de IA

## REGRA 1

Antes de modificar arquivo legado importante:

```text
ler arquivo inteiro ou contexto estrutural suficiente
mapear dependências
identificar callers
identificar efeitos colaterais
```

---

## REGRA 2

Não fazer:

```text
"vou simplificar removendo código aparentemente não usado"
```

sem provar por busca e teste que está realmente morto.

---

## REGRA 3

Não reescrever engine/chess core inteiro só por preferência estética.

Criar testes primeiro.

---

## REGRA 4

Cada PR/fase deve ser pequena o suficiente para regressão ser rastreável.

---

## REGRA 5

Nenhum hardcode de avaliação escondido.

Thresholds devem viver em:

```text
SacrificeConfig
ClassificationConfig
EngineProfile
```

---

## REGRA 6

Não usar emojis como sistema primário de iconografia de produto.

Podem existir em mensagens informais, mas componentes devem usar ícones próprios/licenciados.

---

## REGRA 7

Nunca copiar assets proprietários de Chess.com.

Criar linguagem visual própria.

---

## REGRA 8

LLM não substitui engine.

---

## REGRA 9

Toda classificação deve guardar evidence.

Exemplo:

```json
{
  "label": "TRUE_SACRIFICE",
  "evidence": {
    "materialCost": 3.2,
    "recoveryHorizon": 8,
    "acceptanceBestRank": 1,
    "expectedScoreLoss": 0.01
  }
}
```

---

# 143. Métricas de qualidade do detector

Dashboard de desenvolvimento:

```text
precision
recall
F1
false positives
false negatives
```

Por:

```text
queen
rook
exchange
minor
pawn
positional
pseudo
speculative
rejected
```

---

# 144. Explainability debugging

Ao clicar:

```text
Why was this detected?
```

mostrar:

```text
Candidate trigger:
  piece offered: rook on f7

Acceptance:
  Kxf7 is opponent rank #1

Material:
  -2.0 net material after acceptance

Recovery:
  deficit persists 11 plies

Objective:
  EP 0.54 -> 0.56

Motif:
  king shield demolition
  open e-file
```

Isso é essencial para corrigir falsos positivos.

---

# 145. Feature: Sacrifice Microscope

Tela especializada para uma única posição.

Painéis:

```text
BEFORE
OFFER
ACCEPT
COMPENSATION
RECOVERY / CONVERSION
```

Permitir caminhar pelas fases do sacrifício.

---

# 146. Feature: Accept / Decline Tree

Árvore separa:

```text
ACCEPT
├─ Kxf7
├─ Rxf7
└─ ...

DECLINE
├─ Kg8
├─ ...
```

Mostrar WDL de cada resposta.

---

# 147. Feature: What If?

Usuário escolhe peça e pergunta:

```text
What if I sacrifice this?
```

Sistema gera lances candidatos envolvendo aquela peça.

Não precisa limitar análise aos melhores lances.

Excelente para estudo criativo.

---

# 148. Feature: Sacrifice Search

Exemplos:

```text
Find queen sacrifices in Sicilian positions
Find exchange sacs by Tal
Find sound sacrifices with Rashid Score > 85
Find sacrifices rejected by opponent
Find positional sacrifices without forced mate
```

---

# 149. Feature: Style DNA

Gerar “DNA” de jogador:

```text
initiative
materialism
king attacks
exchange sacrifices
queen sacrifices
quiet sacrifices
risk
forcingness
```

Somente usar nomes estatísticos explicáveis.

Não afirmar traços psicológicos do jogador.

---

# 150. Feature: Nezhmetdinov Mode

Modo especial:

- carregar corpus Nezhmetdinov;
- ocultar engine;
- posições antes de sacrifícios conhecidos;
- usuário tenta encontrar;
- depois comparar;
- mostrar ideias alternativas de engine;
- estatísticas do corpus.

---

# 151. Feature: Tal vs Rashid

Comparação temática:

```text
Who sacrificed more?
Which pieces?
Which openings?
How sound?
How often accepted?
How forcing?
```

Usar dados calculados pelo próprio corpus, não opinião.

---

# 152. Feature: Engine Discovery Tournament

Para uma posição:

```text
Stockfish
Lc0
Engine 3
Engine 4
```

cada engine recebe mesmo orçamento.

Comparar quais sacrificiais foram descobertas.

Pode gerar:

```text
discovered by Lc0 only
discovered by Stockfish only
consensus
```

---

# 153. Future: Human Findability

Adicionar modelo humano opcional.

Objetivo:

```text
P(human plays move | rating)
```

Isso permitiria medir:

```text
strong but human
strong and nearly impossible
```

Não misturar com correção objetiva.

---

# 154. Future: Sacrifice Embeddings

Criar representação de posição/sacrifício para busca:

```text
"find sacrifices similar to this"
```

Features:

- material vector;
- king geometry;
- attackers;
- motifs;
- phase;
- opening;
- compensation profile.

---

# 155. Future: Research export

Gerar dataset:

```text
Parquet
```

para estudos externos.

Schema versionado.

---

# 156. Anti-features

NÃO implementar agora:

- multiplayer online;
- servidor próprio de partidas;
- rating server;
- rede social;
- chat;
- NFTs;
- “AI coach” genérico sem dados;
- features desconectadas do objetivo.

O foco é:

```text
ANALYZE
SACRIFICE
DISCOVER
STUDY
RESEARCH
```

---

# 157. Prioridades absolutas

Se agentes tiverem tempo limitado, executar nesta ordem:

```text
1. segurança Electron + testes de caracterização
2. EngineManager + job cancellation + provenance
3. WDL + MultiPV + cache
4. novo domínio Sacrifice
5. true/pseudo + acceptance/decline
6. material/recovery timeline
7. compensation + motifs
8. redesign visual / Rashid Lab identity
9. Sacrifice Forecast Engine
10. backtesting + calibration
11. Discover
12. Study
13. Corpus Research
14. Behavioral Player Models
15. multi-engine advanced
16. Research Platform
```

---

# 158. Resultado esperado

Ao final, o produto não deve ser descrito como:

> “uma interface modificada do Nibbler”.

Deve ser descrito como:

> **Rashid Lab é um ambiente desktop de pesquisa enxadrística especializado em detectar, validar, prever, descobrir e estudar sacrifícios. Ele combina Stockfish, Lc0, UCI, WDL, SEE, busca contrafactual, árvores de aceitação/recusa, análise de compensação, motivos táticos e posicionais, forecast calibrado, pressure maps, pesquisa em grandes corpora, modelos comportamentais de estilo e treinamento para estudar como material é convertido em iniciativa, ataque, posição ou resultado.**

O diferencial central é:

```text
ANALYZE
→ DETECT
→ VALIDATE
→ FORECAST
→ DISCOVER
→ EXPLAIN
→ STUDY
→ RESEARCH
```

A aplicação deve ser capaz de responder tanto:

> “Este lance foi um sacrifício correto?”

quanto:

> “Esta posição está caminhando para um sacrifício? Em qual horizonte? Com qual peça? Em quais linhas? Com qual evidência? E quão calibrada é essa previsão?”

Essa é a direção definitiva do projeto.

# 159. Artefatos obrigatórios por fase

Cada fase deve produzir, além do código:

```text
CHANGELOG fragment
tests
benchmark/regression report quando aplicável
migration note
architecture note
known limitations
```

Para Sacrifice Engine e Forecast:

```text
model-card.md
detector-card.md
forecast-card.md
```

---

# 160. Detector Card

`docs/detector-card.md` deve registrar:

```text
version
event definition
supported categories
thresholds
engine profiles
gold corpus version
precision
recall
F1
known false positives
known false negatives
```

---

# 161. Forecast Model Card

`docs/forecast-card.md`:

```text
model/version
objective vs behavioral
horizons
features
training corpus
split strategy
calibration method
Brier Score
ECE
PR-AUC
baseline comparison
known limitations
hardware/search budget
```

---

# 162. Experiment Registry

SQLite ou JSON versionado:

```text
experiment_id
git_commit
dataset_version
engine_versions
config_hash
metrics
created_at
```

Nunca comparar dois modelos sem registrar configuração.

---

# 163. Reprodutibilidade

Comando desejado:

```bash
npm run research:backtest -- \
  --dataset corpus-v3 \
  --forecast forecast-v2 \
  --horizon 8
```

Resultado:

```text
artifacts/research/<experiment-id>/
```

contendo:

```text
config.json
metrics.json
calibration.csv
errors.jsonl
report.md
```

---

# 164. Error Explorer

Tela para desenvolvedor/pesquisador:

```text
False Positives
False Negatives
Bad Calibration
Engine Disagreement
Unstable Forecasts
```

Clique abre posição e toda evidência.

Esse painel é obrigatório para evoluir o detector com disciplina.

---

# 165. Active Error Mining

Corpus scanner deve poder procurar automaticamente:

```text
high-confidence false positives
high-confidence false negatives
high engine disagreement
forecast instability
classification disagreement
```

Esses casos viram candidatos para Gold Corpus.

---

# 166. Data provenance

Todo jogo/dataset deve guardar:

```text
source
source_url quando aplicável
license
retrieved_at
hash
parser_version
```

Toda análise:

```text
engine binary hash
engine version
NN network hash
options hash
budget
timestamp
app version
```

---

# 167. Schema versioning

Objetos persistidos:

```text
SacrificeEvent
ForecastResult
MotifEvidence
StudyItem
EngineRun
```

devem possuir:

```json
{
  "schemaVersion": 1
}
```

Migrações obrigatórias.

---

# 168. Privacy

Importação de contas:

- não enviar partidas para serviço próprio por padrão;
- processamento local como padrão;
- credenciais/tokens nunca em logs;
- API keys no armazenamento seguro do SO;
- telemetria opt-in somente se existir.

---

# 169. Offline-first

Features principais devem funcionar offline:

```text
PGN
FEN
Stockfish
Lc0 local
Sacrifice Engine
Forecast objetivo
Study
Corpus local
```

Somente importações externas e LLM remoto precisam de internet.

---

# 170. Crash-safe database

SQLite:

```text
WAL mode
transactions
foreign keys
busy timeout
migrations
backup
```

Operações longas devem ser idempotentes/restartable.

---

# 171. Corpus job checkpoints

Scanner deve persistir:

```text
last game
last ply
analysis profile
config hash
```

Depois de crash:

```text
resume
```

Não reiniciar 100 mil partidas desde zero.

---

# 172. Memory limits

Dataset/PGN parser deve usar streaming.

Proibido:

```text
read entire 40MB/500MB PGN into DOM
```

quando não necessário.

Metas devem ser medidas com corpora reais.

---

# 173. Search budget accounting

Toda análise deve registrar custo:

```text
nodes
time
depth
seldepth
GPU backend quando aplicável
```

Forecast deve poder mostrar:

```text
Quick
Deep
Research
```

com custo comparável.

---

# 174. Determinism

Onde possível:

- mesmos inputs;
- mesmo engine;
- mesmo budget;
- mesmas options;

devem produzir classificação idêntica.

Se engine não determinística:

registrar tolerâncias.

---

# 175. Quality gates para agentes

Nenhum agente pode marcar fase como concluída se:

```text
build falha
test falha
typecheck falha
security regression
renderer ganha Node access
forecast mostra percentagem não calibrada
detector perde gold corpus sem relatório
```

---

# 176. Política de migração do legado

Estratégia:

```text
CHARACTERIZE
WRAP
REPLACE
DELETE
```

Nunca:

```text
DELETE
REWRITE
HOPE
```

---

# 177. Branch strategy para agentes

Sugestão:

```text
feat/security-baseline
feat/engine-manager
feat/sacrifice-domain
feat/forecast
feat/discover
feat/study
feat/corpus
```

Cada branch:

- escopo único;
- commits convencionais;
- sem refatoração não relacionada.

---

# 178. PR checklist para agentes

```text
[ ] objetivo da PR
[ ] arquivos alterados
[ ] comportamento anterior
[ ] comportamento novo
[ ] testes
[ ] screenshots se UI
[ ] benchmark se performance
[ ] migration se storage
[ ] riscos
[ ] rollback
```

---

# 179. Critério SOTA do produto

O objetivo não é “ter mais features”.

O Rashid Lab deve ser excepcional em cinco capacidades:

```text
1. distinguir sacrifício real de falsa entrega material
2. explicar compensação objetivamente
3. procurar sacrifícios não jogados
4. prever pressão sacrificial antes do evento com modelo calibrado
5. transformar isso em pesquisa e treinamento
```

Se uma feature não fortalece uma dessas capacidades, ela é secundária.

---

# 180. Definition of Product Complete

Versão `1.0` do produto Rashid Lab somente quando:

```text
SECURITY
[ ] Electron hardened
[ ] CSP
[ ] typed IPC
[ ] no Node in renderer

ENGINE
[ ] Stockfish
[ ] Lc0
[ ] WDL
[ ] MultiPV
[ ] cancellation
[ ] cache
[ ] provenance

SACRIFICE
[ ] candidate generation
[ ] acceptance
[ ] decline
[ ] true/pseudo
[ ] soundness
[ ] recovery horizon
[ ] compensation
[ ] motifs
[ ] evidence

FORECAST
[ ] potential
[ ] objective forecast
[ ] multiple horizons
[ ] pressure map
[ ] tree evidence
[ ] stability
[ ] backtesting
[ ] calibration
[ ] no leakage

DISCOVER
[ ] missed sacrifices
[ ] alternative sacrifices
[ ] batch scanning

STUDY
[ ] generated exercises
[ ] spaced repetition
[ ] metrics

CORPUS
[ ] SQLite library
[ ] player comparison
[ ] sacrifice signatures
[ ] dataset manager

QUALITY
[ ] CI
[ ] unit
[ ] integration
[ ] regression
[ ] E2E
[ ] model cards
[ ] experiment registry
```

# ADDENDUM-001 — Integração de Ideias do Chee ao Rashid Lab

**Projeto:** Rashid Lab
**SPEC-base:** `SPEC_Rashid_Lab_COMPLETA_v2.md`
**Status:** Obrigatório para implementação
**Origem conceitual analisada:** `hong4rc/chee`
**Objetivo:** incorporar ao Rashid Lab os melhores padrões arquiteturais e analíticos encontrados no Chee, sem reduzir o Rashid a uma cópia do Chee e sem substituir as definições científicas já estabelecidas na SPEC principal.

---

# 1. Objetivo do adendo

Este adendo complementa a SPEC principal com cinco contribuições centrais extraídas da análise do Chee:
Q

1. arquitetura de `AnalysisCoordinator`;
2. sistema modular de `AnalysisPlugin`;
3. análise secundária isolada com UCI `searchmoves`;
4. modelagem explícita de `bait / greed / god-mode` para aceitar ou recusar um sacrifício;
5. heurísticas comportamentais de captura tentadora, defesa aparente e risco humano.

Essas ideias devem ser incorporadas ao Rashid de forma mais rigorosa, testável e escalável.

---

# 2. Regra central

O Chee NÃO deve ser copiado como arquitetura final.

O Chee deve servir como:

```text
reference architecture
+
proof of concept
+
source of patterns
```

O Rashid deve evoluir esses padrões.

A regra é:

```text
CHEE IDEA
   ↓
GENERALIZE
   ↓
TYPE
   ↓
TEST
   ↓
SCALE
   ↓
INTEGRATE INTO RASHID DOMAIN
```

---

# 3. O que aproveitar do Chee

Componentes conceituais aprovados:

```text
AnalysisCoordinator
AnalysisPlugin lifecycle
requestSecondaryAnalysis
cancelSecondaryAnalysis
searchmoves
engine state machine
stale-result rejection
LRU eval cache
Trapboy bait/greed/god model
Tempting Capture analysis
Defender count heuristic
PV material scan
recapture rejection
engine auto-recovery
persistent visual layers
Vitest discipline
CI discipline
```

---

# 4. O que NÃO copiar literalmente

Não portar como definição final:

```text
Crazy sacrifice = material >= 3 and cpLoss <= 30
PV depth fixed at 6 plies
1/3/3/5/9 as final truth
WDL derived from a decorative cp sigmoid
single secondary analysis slot
Brilliant logic based on eval inversion/noise
trap threshold hardcoded as final scientific criterion
```

Esses elementos podem servir como baseline ou filtro rápido, mas nunca como autoridade final.

---

# 5. Arquitetura alvo atualizada

A arquitetura analítica do Rashid passa a ser:

```text
                         RASHID LAB
                              │
                    AnalysisCoordinator
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
    Primary Analysis                        AnalysisJobScheduler
          │                                       │
          │                    ┌──────────────────┼──────────────────┐
          │                    │                  │                  │
          │                Candidate          Accept             Decline
          │                 Search             Search             Search
          │                    │                  │                  │
          └────────────────────┴──────────────┬───┴──────────────────┘
                                             │
                                      Sacrifice Engine
                                             │
                  ┌──────────────────────────┼──────────────────────────┐
                  │                          │                          │
           Compensation                 Motif Engine             Recovery Horizon
                  │                          │                          │
                  └──────────────────────────┼──────────────────────────┘
                                             │
                                      Forecast Engine
                                             │
                   ┌─────────────────────────┼──────────────────────────┐
                   │                         │                          │
             Pressure Map             Objective Forecast       Behavioral Forecast
                   │                         │                          │
                   └─────────────────────────┼──────────────────────────┘
                                             │
                                       Discover / Study
```

---

# 6. AnalysisCoordinator

Criar:

```text
src/analysis/analysis-coordinator.ts
```

Responsabilidade:

- possuir o estado da análise ativa;
- receber mudanças de posição;
- enviar análise principal;
- invalidar resultados stale;
- notificar plugins;
- delegar análises secundárias;
- integrar cache;
- controlar render context;
- expor eventos.

Interface sugerida:

```ts
interface AnalysisCoordinator {
  start(): Promise<void>
  stop(): Promise<void>

  setPosition(position: PositionState): void

  requestPrimaryAnalysis(
    request: PrimaryAnalysisRequest
  ): Promise<AnalysisHandle>

  submitJob(
    request: AnalysisJobRequest
  ): Promise<AnalysisJobHandle>

  registerPlugin(plugin: AnalysisPlugin): void
  unregisterPlugin(id: string): void

  subscribe<T extends AnalysisEvent>(
    event: T,
    handler: AnalysisEventHandler<T>
  ): Unsubscribe
}
```

---

# 7. O Coordinator não contém lógica de sacrifício

Proibido:

```text
AnalysisCoordinator.detectSacrifice()
AnalysisCoordinator.computeRashidScore()
AnalysisCoordinator.findMotif()
```

O Coordinator orquestra.

A lógica pertence a:

```text
domain/sacrifice
domain/forecast
domain/motifs
domain/compensation
```

---

# 8. AnalysisPlugin

Criar:

```text
src/analysis/plugin.ts
```

Interface:

```ts
export interface AnalysisPlugin {
  readonly id: string

  setup?(ctx: AnalysisPluginContext): Promise<void> | void

  onPositionChanged?(
    position: PositionState,
    ctx: AnalysisPluginContext
  ): Promise<void> | void

  onAnalysisUpdate?(
    update: AnalysisUpdate,
    ctx: AnalysisPluginContext
  ): Promise<void> | void

  onAnalysisCompleted?(
    result: AnalysisResult,
    ctx: AnalysisPluginContext
  ): Promise<void> | void

  onSettingsChanged?(
    settings: Partial<RashidSettings>,
    ctx: AnalysisPluginContext
  ): Promise<void> | void

  onEngineReset?(
    ctx: AnalysisPluginContext
  ): Promise<void> | void

  destroy?(): Promise<void> | void
}
```

---

# 9. Plugins iniciais

Criar:

```text
EvaluationPlugin
SacrificePlugin
CompensationPlugin
MotifPlugin
ForecastPlugin
PressureMapPlugin
DiscoverPlugin
StudyPlugin
OpeningPlugin
CorpusPlugin
```

Plugins NÃO devem possuir algoritmo de domínio completo.

Exemplo:

```text
ForecastPlugin
   ↓
SacrificeForecastService
```

---

# 10. AnalysisPluginContext

```ts
interface AnalysisPluginContext {
  coordinator: AnalysisCoordinator
  scheduler: AnalysisJobScheduler
  engineManager: EngineManager
  cache: AnalysisCache
  events: AnalysisEventBus
  services: RashidDomainServices
}
```

---

# 11. AnalysisJobScheduler

Criar:

```text
src/analysis/job-scheduler.ts
```

Essa é a evolução obrigatória do `requestSecondaryAnalysis()` do Chee.

O Chee suporta essencialmente uma análise secundária por vez.

O Rashid precisa suportar múltiplos jobs.

---

# 12. Tipos de job

```ts
type AnalysisJobType =
  | 'PRIMARY'
  | 'CANDIDATE_SCAN'
  | 'SACRIFICE_ACCEPT'
  | 'SACRIFICE_DECLINE'
  | 'FORECAST_BRANCH'
  | 'DISCOVER'
  | 'CORPUS'
  | 'STUDY'
  | 'VALIDATION'
```

---

# 13. Prioridades

```text
P0  current board / direct user request
P1  explicit deep analysis
P2  accept/decline
P3  sacrifice validation
P4  forecast
P5  discover
P6  study enrichment
P7  corpus
```

---

# 14. Job request

```ts
interface AnalysisJobRequest {
  id?: string
  type: AnalysisJobType
  priority: number

  position: PositionRef

  engineProfile: EngineProfileRef

  search?: {
    depth?: number
    nodes?: number
    movetimeMs?: number
    searchMoves?: string[]
    multiPv?: number
  }

  generation: number

  metadata?: Record<string, unknown>
}
```

---

# 15. Job result

```ts
interface AnalysisJobResult {
  jobId: string
  positionHash: string
  generation: number

  engine: EngineIdentity
  search: SearchProvenance

  lines: EngineLine[]

  startedAt: string
  completedAt: string
  durationMs: number
}
```

---

# 16. Stale result protection

Toda resposta de engine deve conter:

```text
jobId
positionHash
generation
```

Regra:

```ts
if (
  result.positionHash !== current.positionHash ||
  result.generation !== current.generation
) {
  drop(result)
}
```

Nenhum resultado antigo pode atualizar a UI.

---

# 17. Cancelamento

Cada job deve suportar:

```ts
interface AnalysisJobHandle {
  id: string
  cancel(): Promise<void>
  status(): AnalysisJobStatus
}
```

Quando usuário muda de posição:

```text
cancel P0/P1 stale jobs
preserve background jobs only if independent
```

---

# 18. Searchmoves como primitive de primeira classe

Adicionar suporte formal a:

```text
go ... searchmoves <moves>
```

em todos os adapters UCI que suportarem.

Uso:

```text
Candidate Generator
↓
searchMoves
↓
restricted engine analysis
```

---

# 19. Candidate Search Service

Criar:

```text
src/domain/sacrifice/candidate-search-service.ts
```

Responsabilidade:

1. gerar candidatos sacrificiais;
2. agrupar por tipo;
3. enviar candidatos via `searchmoves`;
4. receber avaliação focada;
5. ordenar para deep validation.

---

# 20. Candidate generation não depende de MultiPV

Regra crítica:

O Rashid NÃO deve confiar que um sacrifício apareça naturalmente em:

```text
MultiPV 3
MultiPV 5
```

Todo candidato detectado por heurística deve poder ser analisado mesmo fora do MultiPV principal.

---

# 21. Candidate groups

```text
DIRECT_OFFER
CAPTURE_SAC
EXCHANGE_SAC
QUEEN_OFFER
QUIET_SAC
DEFENSIVE_SAC
CLEARANCE_SAC
KING_ATTACK_SAC
PROMOTION_SAC
```

---

# 22. QuickMaterialFilter

Criar:

```text
src/domain/sacrifice/quick-material-filter.ts
```

Inspirado no `detectSacrifice()` do Chee.

Função:

```ts
quickMaterialDelta(
  before: Position,
  playedMove: UciMove,
  pv: UciMove[],
  maxPlies: number
): MaterialDeltaResult
```

---

# 23. Uso do QuickMaterialFilter

Serve apenas para:

```text
candidate filtering
candidate ranking
compute savings
early discard
```

Não pode definir:

```text
TRUE_SACRIFICE
SOUND
SPECULATIVE
```

---

# 24. Profundidade dinâmica

Ao contrário do Chee:

```text
fixed 6 plies
```

usar:

```text
Quick profile       4–8 plies
Deep profile        8–16 plies
Research profile    dynamic / until stability
```

---

# 25. MaterialDeltaResult

```ts
interface MaterialDeltaResult {
  initialDelta: number
  maxDeficit: number
  finalDelta: number

  captures: MaterialCaptureEvent[]

  possibleRecoveryDetected: boolean

  analyzedPlies: number
}
```

---

# 26. Bait / Greed / God model

Formalizar o conceito usado pelo Trapboy.

Novo modelo:

```text
OFFER
│
├── ACCEPT
│    └── best capture / material taking branch
│
└── DECLINE
     └── best non-accepting reply
```

---

# 27. Terminologia oficial

Não usar na API final:

```text
greed
god
```

porque são nomes informais.

Usar:

```text
OFFER
ACCEPT
DECLINE
```

Na UI opcional de estudo pode aparecer:

```text
Tempting capture
Best defense
```

---

# 28. AcceptanceAnalyzer

Criar:

```text
src/domain/sacrifice/acceptance-analyzer.ts
```

Interface:

```ts
interface AcceptanceAnalyzer {
  analyze(
    ctx: SacrificeCandidateContext
  ): Promise<AcceptanceAnalysis>
}
```

---

# 29. AcceptanceAnalysis

```ts
interface AcceptanceAnalysis {
  acceptingMoves: AcceptanceMoveAnalysis[]

  bestAcceptance?: AcceptanceMoveAnalysis

  isAcceptanceAvailable: boolean
  isAcceptanceObjectivelyValid: boolean

  bestAcceptanceRank?: number

  acceptanceExpectedScore?: number

  acceptanceMaterialGain?: number
}
```

---

# 30. AcceptanceMoveAnalysis

```ts
interface AcceptanceMoveAnalysis {
  move: string

  materialGain: number

  evaluation: Evaluation

  expectedScore: number

  rankAmongReplies: number

  pv: string[]

  stable: boolean
}
```

---

# 31. DeclineAnalyzer

Criar:

```text
src/domain/sacrifice/decline-analyzer.ts
```

Objetivo:

identificar melhor resposta que evita ou adia a tomada material.

---

# 32. Decline definition

Um lance é `DECLINE` quando:

- não realiza a captura/ganho material principal do sacrifício;
- não entra na linha de aceitação equivalente;
- permanece entre respostas objetivamente plausíveis.

---

# 33. DeclineAnalysis

```ts
interface DeclineAnalysis {
  decliningMoves: DeclineMoveAnalysis[]

  bestDecline?: DeclineMoveAnalysis

  bestDeclineExpectedScore?: number

  declinePreferredOverAccept: boolean
}
```

---

# 34. Accept vs Decline comparison

Resultado:

```text
ACCEPT BEST ES:    0.52
DECLINE BEST ES:   0.61

Recommendation:
DECLINE
```

Isso é parte central do Sacrifice Microscope.

---

# 35. TemptationAnalyzer

Criar:

```text
src/domain/behavior/temptation-analyzer.ts
```

Inspirado em `findTemptingCaptures()`.

Objetivo:

medir quanto uma captura parece atraente para um humano.

---

# 36. Temptation features

```text
capturedPieceValue
capturerValue
visibleMaterialGain
captureIsCheck
captureIsForcing
targetDefenders
targetAttackers
recaptureVisibility
immediatePunishmentVisibility
moveNaturalness
engineRank
historicalHumanFrequency
```

---

# 37. TemptationScore

Escala:

```text
0–100
```

NÃO é probabilidade humana sem calibração.

Exemplo:

```text
Temptation Score: 91/100
```

---

# 38. Behavioral Acceptance Forecast

Com corpus calibrado:

```text
P(human accepts offer | position, rating/style)
```

Isso fica separado de:

```text
TemptationScore
```

---

# 39. DefenderSuspicion feature

Inspirado no limite de defensores do Chee.

Nova feature:

```text
defenderSuspicion
```

Ideia:

uma peça ofertada excessivamente defendida pode parecer armadilha evidente.

---

# 40. Features sugeridas

```text
baitDefenders
baitAttackers
baitValue
capturerValue
baitSquareKingProximity
baitIsProtectedByQueen
baitIsProtectedByRook
baitIsProtectedByMinor
recaptureCount
forcingReplyCount
```

---

# 41. Human-looking capture model

Não usar:

```text
targetValue >= capturerValue
```

como única regra.

Criar score composicional.

Exemplo:

```text
queen takes rook      highly tempting
pawn takes rook       highly tempting
rook takes pawn       weak temptation
king takes undefended knight near exposed king
                      context-dependent
```

---

# 42. TrapAnalyzer

Criar módulo separado:

```text
src/domain/trap/trap-analyzer.ts
```

Não confundir:

```text
SACRIFICE
```

com:

```text
TRAP
```

Um sacrifício pode não ser armadilha.

Uma armadilha pode não exigir sacrifício real.

---

# 43. Trap categories

```text
SACRIFICE_TRAP
TEMPTING_CAPTURE_TRAP
OPENING_TRAP
TACTICAL_TRAP
POSITIONAL_TRAP
```

---

# 44. Trap pipeline

```text
Candidate trap
↓
Temptation evaluation
↓
Accept branch
↓
Secondary analysis
↓
Punishment verification
↓
Recapture filter
↓
Trap classification
```

---

# 45. Punishment validation

A linha de punição precisa:

- ser legal;
- ser estável;
- não depender apenas de eval rasa;
- ser suficientemente superior à linha normal;
- armazenar PV.

---

# 46. RecaptureFilter

Criar:

```text
src/domain/sacrifice/recapture-filter.ts
```

Inspirado na rejeição de “trap” quando a punição é apenas recaptura simples.

---

# 47. RecaptureFilter output

```ts
interface RecaptureAnalysis {
  immediateRecapture: boolean
  recaptureWithinPlies?: number

  recoveryValue: number

  isLikelyPseudoSacrifice: boolean
}
```

---

# 48. Recovery Horizon integration

`RecaptureFilter` é apenas Stage 0.

O resultado final vem de:

```text
RecoveryHorizonService
```

---

# 49. RecoveryHorizonService

Criar:

```text
src/domain/sacrifice/recovery-horizon.ts
```

Saída:

```ts
interface RecoveryHorizonResult {
  initialDeficit: number
  maxDeficit: number

  recovered: boolean
  recoveryPly?: number

  materialTimeline: MaterialTimelinePoint[]

  confidence: number
}
```

---

# 50. Engine state machine

Adotar padrão semelhante ao Chee:

```text
IDLE
INITIALIZING
READY
ANALYZING
STOPPING
ERROR
RECOVERING
```

---

# 51. EngineSession

Criar:

```text
src/engine/engine-session.ts
```

Responsável por:

- ciclo de vida;
- configuração;
- UCI;
- stop;
- ready;
- analysis;
- recovery.

---

# 52. Recovery

Se engine falhar:

```text
attempt restart
restore engine options
restore network
restore profile
retry job according to policy
```

Máximo configurável.

Nunca infinite retry.

---

# 53. Job retry policy

```ts
interface RetryPolicy {
  maxAttempts: number
  retryOnCrash: boolean
  retryOnTimeout: boolean
  backoffMs: number
}
```

---

# 54. UCI readiness barrier

Entre `stop` e nova análise:

```text
stop
↓
bestmove / completion
↓
isready
↓
readyok
↓
next position
```

Evitar mistura de resultados.

---

# 55. Engine result identity

Cada update precisa conter:

```text
engineSessionId
jobId
positionHash
generation
```

---

# 56. LRU cache

Criar L1:

```text
AnalysisMemoryCache
```

LRU.

---

# 57. Cache L2

SQLite persistente.

Key:

```text
positionHash
engineBinaryHash
engineVersion
networkHash
engineOptionsHash
searchBudgetHash
searchMovesHash
multiPv
```

---

# 58. Cache poisoning prevention

Nunca reutilizar análise se:

```text
engine version differs
NN differs
searchMoves differs
WDL config differs
search budget weaker than requested
```

---

# 59. Persistent visual layers

Inspirado no sistema de overlays do Chee.

Cada plugin visual registra camada.

Interface:

```ts
interface BoardOverlayLayer {
  id: string
  clear(): void
  render(ctx: BoardRenderContext): void
  restore(): void
  setVisible(visible: boolean): void
}
```

---

# 60. Camadas Rashid

```text
engine-arrows
last-move
sacrifice-candidates
acceptance
decline
pressure-map
king-zone
attack-map
motifs
training
```

---

# 61. Overlay ownership

Cada overlay tem UM owner.

Proibido múltiplos módulos desenharem diretamente no mesmo layer.

---

# 62. Highlight semantics

Cores não podem ser copiadas diretamente do Chee.

Rashid usa seu próprio design system.

---

# 63. WDL

O Chee possui WDL visual derivado de cp.

No Rashid:

```text
native engine WDL preferred
```

Ativar quando suportado:

```text
UCI_ShowWDL
```

---

# 64. Fallback WDL

Se engine não suportar WDL:

```text
estimated WDL
```

deve estar rotulado:

```text
Estimated
```

Nunca misturar com WDL nativo.

---

# 65. Expected Score

```text
ES = W + 0.5 * D
```

Toda comparação de soundness deve preferir ES/WDL.

---

# 66. CP continua existindo

CP serve para:

- debug;
- compatibilidade;
- quick filters;
- UI tradicional.

Não é única métrica.

---

# 67. Brilliant/Crazy labels

Não importar nomenclatura.

O Rashid usa:

```text
SOUND
PLAYABLE
SPECULATIVE
DUBIOUS
UNSOUND
FORCED
WINNING
DRAWING
```

E:

```text
TRUE_SACRIFICE
PSEUDO_SACRIFICE
COMBINATION
```

---

# 68. Fast Sacrifice Baseline

Criar baseline inspirado no Chee:

```text
materialDelta >= X
and
expectedScoreLoss <= Y
```

Mas nome:

```text
FAST_BASELINE
```

---

# 69. Baseline purpose

Serve para comparar o detector avançado.

No relatório:

```text
Chee-like baseline
precision
recall
F1
```

versus:

```text
Rashid detector
precision
recall
F1
```

---

# 70. Benchmark obrigatório

Criar benchmark:

```text
bench/sacrifice-baselines/
```

Comparar:

```text
A: simple PV material filter
B: SEE-only
C: acceptance-only
D: Rashid full
```

---

# 71. Test suite

Adicionar testes específicos para padrões aproveitados do Chee.

---

# 72. Secondary analysis tests

Testar:

```text
main analysis survives
secondary does not overwrite primary
cancel restores state
searchmoves honored
board change cancels stale secondary
multiple jobs queued
priority respected
```

---

# 73. Searchmoves tests

Fake UCI deve validar comando:

```text
go depth 12 searchmoves rxf7 bxh7
```

---

# 74. Scheduler tests

Casos:

```text
P0 preempts P5
cancel removes queued job
crash retries once
stale result discarded
same position + same config cache hit
different searchMoves cache miss
```

---

# 75. Acceptance tests

Fixtures:

```text
acceptance best
acceptance bad
decline best
accept and decline equal
accept not legal
multiple captures
```

---

# 76. Temptation tests

Fixtures:

```text
free queen
protected rook
obvious recapture
hidden recapture
king capture into danger
low-value bait
overdefended bait
```

---

# 77. Recapture tests

```text
immediate recapture
2-ply recovery
5-ply recovery
no recovery
material conversion
mate before recovery
```

---

# 78. Trap tests

Separar:

```text
trap
not trap
pseudo-sacrifice
real sacrifice
blunder disguised as bait
```

---

# 79. Gold Corpus extension

Adicionar categorias:

```text
bait/
tempting_capture/
decline_best/
accept_best/
pseudo_recapture/
hidden_punishment/
obvious_punishment/
```

---

# 80. False positive mining

Especialmente procurar:

```text
piece hanging because of blunder
engine PV temporary sacrifice
forced recapture
desperado
winning position where sacrifice irrelevant
mate where material irrelevant
```

---

# 81. Visual Accept/Decline Tree

Tela:

```text
               Rxf7!
                 │
       ┌─────────┴─────────┐
       │                   │
     ACCEPT              DECLINE
       │                   │
     Kxf7                 Kg8
     Rxf7                 Kh8
```

Cada edge:

```text
WDL
material
rank
motif
```

---

# 82. Temptation overlay

Quando habilitado:

mostrar casas de captura com:

```text
Temptation Score
```

Não mostrar probabilidade se não calibrado.

---

# 83. Move Guard adaptation

A ideia do Guard do Chee pode virar:

```text
Sacrifice Explorer
```

Usuário seleciona uma peça.

Rashid analisa todos os lances candidatos dessa peça.

---

# 84. Sacrifice Explorer workflow

```text
click rook f1
↓
generate legal moves
↓
classify sacrifice potential per destination
↓
searchmoves
↓
overlay
```

---

# 85. UI exemplo

```text
Rf7      Sac Potential 91
Re1      Normal
Rf3      Speculative
Rxf7     Sound Sacrifice
```

---

# 86. What If integration

Isso implementa diretamente:

```text
What if I sacrifice this piece?
```

---

# 87. Piece-focused search

Criar:

```ts
analysePieceSacrifices(
  position,
  square,
  options
)
```

---

# 88. Candidate destination badges

No tabuleiro:

```text
S   sound sacrifice
?   speculative
×   unsound
```

Usar design próprio.

---

# 89. Hint separation

Não transformar Rashid em assistente de cheating em partidas online.

Modo de análise deve operar em:

```text
local board
loaded PGN
study position
post-game review
```

---

# 90. Fair play guardrail

Por padrão, não implementar overlay de engine em partida online ao vivo.

Objetivo do Rashid:

```text
study
research
analysis
```

não auxílio competitivo em tempo real.

---

# 91. Corpus use of Temptation

No corpus, calcular:

```text
Offer Acceptance Rate
Temptation Score Distribution
Acceptance by Elo
Decline by Elo
```

---

# 92. Player Signature extension

Adicionar:

```text
bait acceptance rate
bait creation rate
successful trap rate
average temptation offered
average defenderSuspicion
```

---

# 93. Forecast integration

Temptation entra no:

```text
Behavioral Forecast
```

Não no:

```text
Objective Forecast
```

---

# 94. Objective Forecast purity

Objective forecast usa:

```text
engine lines
WDL
candidate trees
material events
```

Não usa:

```text
human temptation
player identity
rating
```

---

# 95. Behavioral Forecast features

Pode usar:

```text
temptation
defenderSuspicion
historical move frequencies
rating
style model
```

---

# 96. Explainability

Mostrar:

```text
Why might a human accept?
```

Exemplo:

```text
+ wins visible rook
+ capturer is lower value
+ no obvious recapture
+ bait has only one visible defender
- king becomes exposed
```

---

# 97. Explainability structured evidence

Nunca gerar texto sem facts.

```json
{
  "temptation": {
    "visibleGain": 5,
    "defenders": 1,
    "immediateRecapture": false,
    "kingExposureDelta": 0.41
  }
}
```

---

# 98. Analysis provenance

Todo secondary job registra:

```text
parentJobId
reason
candidate
searchMoves
engine
budget
```

---

# 99. Job graph

Permitir visualizar:

```text
primary
├─ candidate scan
│  ├─ accept
│  └─ decline
└─ forecast
   ├─ branch 1
   ├─ branch 2
   └─ branch 3
```

---

# 100. Debug panel

Adicionar:

```text
Active Jobs
Queued Jobs
Cancelled Jobs
Cache Hits
Cache Misses
Stale Drops
Engine Restarts
```

---

# 101. Performance metrics

Medir:

```text
secondary analyses / second
queue wait time
candidate throughput
accept/decline latency
cache hit ratio
engine utilization
```

---

# 102. Parallel engine sessions

Research profile pode usar:

```text
N Stockfish workers
M Lc0 workers
```

Scheduler distribui jobs.

---

# 103. Resource control

Nunca iniciar workers ilimitados.

Config:

```text
maxCpuWorkers
maxGpuWorkers
maxMemoryMb
```

---

# 104. Laptop profile

```text
1 Stockfish
1 secondary slot
low depth
```

---

# 105. Workstation profile

```text
multiple Stockfish sessions
Lc0 GPU
parallel candidate validation
```

---

# 106. Research profile

Priorizar:

```text
reproducibility
fixed node budgets
recorded engine hashes
```

---

# 107. License / attribution

Chee usa GPL-3.0.

Se código for efetivamente portado:

- preservar GPL;
- preservar notices;
- documentar origem;
- listar arquivos derivados;
- manter atribuição;
- revisar compatibilidade com licença do Rashid.

---

# 108. Attribution file

Criar:

```text
THIRD_PARTY_NOTICES.md
```

Se houver código derivado:

```text
Chee
Author
Repository
License
Files/ideas reused
```

---

# 109. Preferir reimplementação limpa quando possível

Para padrões pequenos:

```text
plugin lifecycle
job scheduler
temptation feature
```

preferir reimplementação própria baseada no conceito.

Para código copiado literalmente:

registrar origem.

---

# 110. Security review

Nunca importar:

```text
eval
unsafe worker bootstrap
DOM assumptions
browser-extension-specific hacks
```

para o Electron sem revisão.

---

# 111. Stockfish integration

Rashid desktop não precisa reproduzir o bootstrap WASM do Chee.

Preferir:

```text
native UCI engine process
```

com suporte opcional a WASM em builds específicas.

---

# 112. Searchmoves UCI abstraction

```ts
interface UciSearchRequest {
  fen: string
  searchMoves?: string[]
  depth?: number
  nodes?: number
  movetimeMs?: number
  multiPv?: number
  showWdl?: boolean
}
```

---

# 113. Engine capability detection

Detectar:

```text
supportsWdl
supportsThreads
supportsHash
supportsSyzygy
supportsSearchMoves
```

---

# 114. Adapter abstraction

Nem todas engines terão mesmas options.

Criar:

```text
EngineCapabilities
```

---

# 115. Default validation pipeline atualizada

```text
Stage 0  Static geometry
Stage 1  Chee-like quick material filter
Stage 2  SEE
Stage 3  Candidate searchmoves
Stage 4  Acceptance search
Stage 5  Decline search
Stage 6  Recovery horizon
Stage 7  Native WDL validation
Stage 8  Deep stability
Stage 9  Lc0 comparison
Stage 10 Motifs
Stage 11 Compensation
Stage 12 Forecast integration
```

---

# 116. Fast path

Para UI em tempo real:

```text
0 → 1 → 2 → 3
```

Resultado:

```text
candidate
```

Não mostrar `SOUND` definitivo.

---

# 117. Deep path

```text
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

---

# 118. Research path

```text
all stages
```

---

# 119. Classification confidence

```text
PROVISIONAL
VALIDATED
RESEARCH_GRADE
```

---

# 120. UI state

Enquanto quick filter:

```text
Possible sacrifice
```

Depois:

```text
Validated sound sacrifice
```

---

# 121. Agent implementation order

## Agent Track A — Analysis Core

Implementar:

```text
AnalysisCoordinator
AnalysisPlugin
AnalysisEventBus
```

---

# 122. Agent Track B — Job System

Implementar:

```text
AnalysisJobScheduler
JobHandle
Priorities
Cancellation
Stale protection
```

---

# 123. Agent Track C — Searchmoves

Implementar:

```text
UCI restricted search
Fake engine support
Tests
```

---

# 124. Agent Track D — Quick Material Filter

Implementar:

```text
PV material scan
dynamic plies
capture timeline
```

---

# 125. Agent Track E — Accept/Decline

Implementar:

```text
AcceptanceAnalyzer
DeclineAnalyzer
branch comparison
```

---

# 126. Agent Track F — Behavioral

Implementar:

```text
TemptationAnalyzer
DefenderSuspicion
Behavioral features
```

---

# 127. Agent Track G — Trap

Implementar:

```text
TrapAnalyzer
Punishment validation
RecaptureFilter
```

---

# 128. Agent Track H — Engine Robustness

Implementar:

```text
EngineSession FSM
ready barriers
crash recovery
job identity
```

---

# 129. Agent Track I — Cache

Implementar:

```text
L1 LRU
L2 SQLite
full provenance key
```

---

# 130. Agent Track J — Visual

Implementar:

```text
Accept/Decline Tree
Temptation overlay
Piece Sacrifice Explorer
Job debug panel
```

---

# 131. Integration gate

Nenhum track deve ser mergeado se:

```text
tests fail
primary analysis can be overwritten by secondary
stale result appears
searchmoves ignored
cache key incomplete
Node renderer security regresses
```

---

# 132. Acceptance criteria — Analysis Core

```text
[ ] plugins registram/desregistram
[ ] plugin crash não derruba coordinator
[ ] events tipados
[ ] no domain logic in coordinator
```

---

# 133. Acceptance criteria — Scheduler

```text
[ ] priorities
[ ] cancellation
[ ] preemption policy
[ ] stale drop
[ ] retry
[ ] metrics
```

---

# 134. Acceptance criteria — searchmoves

```text
[ ] engine command correct
[ ] candidate-only result
[ ] temporary MultiPV handled
[ ] main analysis restored
```

---

# 135. Acceptance criteria — Acceptance

```text
[ ] accepting replies enumerated
[ ] best acceptance identified
[ ] rank recorded
[ ] WDL recorded
[ ] PV recorded
```

---

# 136. Acceptance criteria — Decline

```text
[ ] non-accept replies identified
[ ] best decline computed
[ ] accept vs decline comparison
```

---

# 137. Acceptance criteria — Temptation

```text
[ ] score evidence
[ ] no fake probability
[ ] calibratable features
[ ] tests
```

---

# 138. Acceptance criteria — Recapture

```text
[ ] immediate recovery
[ ] delayed recovery
[ ] no recovery
[ ] pseudo-sac classification support
```

---

# 139. Acceptance criteria — Engine

```text
[ ] ready barrier
[ ] crash recovery
[ ] session id
[ ] job id
[ ] position hash
[ ] generation
```

---

# 140. Acceptance criteria — Cache

```text
[ ] engine hash in key
[ ] options hash
[ ] searchMoves hash
[ ] budget hash
[ ] WDL config
```

---

# 141. Acceptance criteria — UI

```text
[ ] Accept/Decline Tree
[ ] candidate piece overlay
[ ] temptation score
[ ] no color-only semantics
```

---

# 142. Required regression positions

Criar fixtures de:

```text
Legal trap
Greek Gift
exchange sacrifice
queen sacrifice
desperado
pseudo-sacrifice
quiet positional sacrifice
declined sacrifice
tempting bad capture
obvious recapture
```

---

# 143. Corpus mining

Adicionar scanner:

```text
find positions where engine best move is sacrifice
find positions where accepting loses
find positions where humans accepted anyway
```

---

# 144. Behavioral research

Estatísticas:

```text
acceptance rate by Elo
acceptance rate by material gain
acceptance rate by defenders
acceptance rate by king danger
```

---

# 145. New Rashid research question

O Rashid passa a poder investigar:

> Quanto maior o ganho material aparente, maior a probabilidade de um humano aceitar um sacrifício mesmo quando a captura é objetivamente ruim?

Essa é uma pergunta mensurável.

---

# 146. New Forecast feature

Adicionar ao behavioral model:

```text
acceptanceLikelihood
```

---

# 147. New Sacrifice Signature feature

Por jogador:

```text
offersCreated
offersAccepted
offersDeclined
averageTemptationScore
successfulTrapRate
```

---

# 148. New Study mode

Adicionar:

```text
TAKE OR DECLINE?
```

Usuário recebe posição após oferta.

Precisa escolher:

```text
accept
decline
```

---

# 149. Study feedback

Mostrar:

```text
You accepted.
Objectively: bad.
Why it looked tempting:
+ visible rook gain
+ no immediate recapture
+ king danger hidden
```

---

# 150. New study metric

```text
Trap Resistance
```

Mede desempenho em:

```text
accept vs decline
```

---

# 151. New training category

```text
Greed Control
```

Nome interno:

```text
tempting-capture training
```

---

# 152. New Discover category

```text
HIDDEN BAIT
```

Posições onde melhor lance oferece material e adversário possui captura tentadora inferior.

---

# 153. New Discover category

```text
MISSED TRAP
```

Jogador poderia ter criado armadilha.

---

# 154. New Discover category

```text
ESCAPED TRAP
```

Adversário recusou corretamente.

---

# 155. New Corpus comparison

```text
Tal:
offers accepted 72%

Nezhmetdinov:
offers accepted 66%
```

Somente após análise real.

---

# 156. Documentation

Criar:

```text
docs/architecture/analysis-coordinator.md
docs/architecture/job-scheduler.md
docs/domain/accept-decline.md
docs/domain/temptation-model.md
docs/domain/trap-model.md
```

---

# 157. Model Card extension

`forecast-card.md` deve incluir:

```text
temptation features
acceptance model
rating split
player split
calibration
```

---

# 158. Detector Card extension

Adicionar:

```text
quick baseline metrics
accept/decline accuracy
pseudo-sac recall
trap false-positive rate
```

---

# 159. Experiment registry

Novos experiment types:

```text
quick-filter
acceptance-model
temptation-model
trap-model
behavioral-forecast
```

---

# 160. Final implementation checklist

```text
ANALYSIS ARCHITECTURE
[ ] Coordinator
[ ] Plugin lifecycle
[ ] EventBus
[ ] Scheduler

ENGINE
[ ] searchmoves
[ ] state machine
[ ] recovery
[ ] stale protection
[ ] native WDL

SACRIFICE
[ ] quick material filter
[ ] candidate restricted search
[ ] acceptance
[ ] decline
[ ] recapture filter
[ ] recovery horizon

BEHAVIOR
[ ] temptation score
[ ] defender suspicion
[ ] acceptance features
[ ] calibration hooks

TRAPS
[ ] sacrifice traps
[ ] tempting capture traps
[ ] punishment validation

UI
[ ] Accept/Decline Tree
[ ] Sacrifice Explorer
[ ] Temptation overlay
[ ] debug jobs

QUALITY
[ ] tests
[ ] regression corpus
[ ] benchmarks
[ ] provenance
[ ] docs
[ ] attribution
```

---

# 161. Resultado esperado deste adendo

Depois deste adendo, o Rashid deve ser capaz de fazer algo que vai além tanto do Chee quanto da SPEC anterior:

```text
POSITION
   ↓
find candidate sacrifice
   ↓
force engine to analyze candidate
   ↓
enumerate acceptance
   ↓
enumerate decline
   ↓
measure material investment
   ↓
measure recovery
   ↓
measure objective soundness
   ↓
estimate human temptation
   ↓
estimate acceptance behavior
   ↓
feed forecast
   ↓
feed discover/study/corpus
```

O ponto principal é:

> O Rashid não apenas detecta que houve entrega de material. Ele modela a oferta, a aceitação, a recusa, a tentação humana, a punição, a recuperação e a probabilidade de esse padrão surgir novamente.

Esse é o propósito deste adendo.

---

# 162. Definition of Done

Este adendo estará concluído apenas quando todos os blocos abaixo existirem:

```text
[ ] AnalysisCoordinator
[ ] AnalysisPlugin
[ ] AnalysisJobScheduler
[ ] searchmoves abstraction
[ ] CandidateSearchService
[ ] QuickMaterialFilter
[ ] AcceptanceAnalyzer
[ ] DeclineAnalyzer
[ ] TemptationAnalyzer
[ ] DefenderSuspicion
[ ] TrapAnalyzer
[ ] RecaptureFilter
[ ] RecoveryHorizon integration
[ ] EngineSession state machine
[ ] stale-result protection
[ ] engine recovery
[ ] L1/L2 cache
[ ] Accept/Decline Tree
[ ] Sacrifice Explorer
[ ] Gold Corpus extensions
[ ] baseline comparison
[ ] attribution review
```

Só então este adendo pode ser marcado como `DONE`.

Só então chamar `Rashid Lab 1.0`.

