# Proposal

## Why

Uma mudança de processo hoje só aparece como cenários WHEN/THEN. Quem revisa o change não vê a sequência, os caminhos e os pontos de decisão, e nada disso permanece junto da spec vigente depois do archive.

## What Changes

- O fluxo de planejamento passa a produzir um diagrama BPMN 2.0 em XML quando o delta de uma capability altera o processo: sequência de atividades, caminho, ou início e fim.
- O arquivo do change é o processo completo depois da mudança, em `specs/<capability>/process.bpmn`, mais `process.svg` gerado a partir desse XML. O `spec.md` da capability referencia a imagem com `![nome](process.svg)` no Purpose. Outros `.md` usam o caminho relativo até esse arquivo. Capability cujo delta não mexe no fluxo não recebe arquivo.
- O diagrama vigente vive ao lado da spec, em `openspec/specs/<capability>/process.bpmn` e `process.svg`. O archive copia os dois quando sincroniza a spec, substituindo os arquivos anteriores.
- Ausência de `process.bpmn` no change mantém o diagrama vigente. Encerrar o processo de uma capability remove o XML e o SVG no archive.
- Change com `skip_specs: true` não produz diagrama.
- O próximo change que alterar o mesmo processo parte do XML vigente.

## Capabilities

### New Capabilities

Nenhuma. Este change altera o fluxo de planejamento do OpenSpec, não o comportamento do gestor financeiro.

### Modified Capabilities

Nenhuma. O projeto não tem specs de domínio. `skip_specs: true` está definido em `.openspec.yaml`.

## Impact

- Schema de workflow do projeto e `openspec/config.yaml` (schema default e orientação de archive).
- Changes futuros: artefato condicional de BPMN no grafo de planejamento, e um `process.bpmn` por capability cujo fluxo mudou.
- Specs vigentes: `process.bpmn` irmão de `spec.md` quando a capability tem processo.
- Nenhum código de aplicação, API ou dependência de runtime. O comando `openspec archive` do CLI continua mesclando só `spec.md`; a cópia do XML acontece no fluxo de archive guiado pelo skill.
