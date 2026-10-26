# Graph Report - C:\Users\OriShavit\Documents\GitHub\synthetic_user  (2026-05-07)

## Corpus Check
- 22 files · ~27,662 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 65 nodes · 104 edges · 12 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `runAgentLoop()` - 15 edges
2. `RunLogger` - 9 edges
3. `routeReasoning()` - 6 edges
4. `routeAnalysis()` - 6 edges
5. `Guardrails` - 5 edges
6. `getModelConfig()` - 4 edges
7. `routeVision()` - 4 edges
8. `callAnthropic()` - 4 edges
9. `callGemini()` - 4 edges
10. `callOpenAIText()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `runAgentLoop()` --calls--> `takeScreenshot()`  [INFERRED]
  C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\agent\loop.ts → C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\browser\browser.ts
- `runAgentLoop()` --calls--> `getPageState()`  [INFERRED]
  C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\agent\loop.ts → C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\browser\actions.ts
- `runAgentLoop()` --calls--> `executeAction()`  [INFERRED]
  C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\agent\loop.ts → C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\browser\actions.ts
- `runAgentLoop()` --calls--> `waitForPageSettle()`  [INFERRED]
  C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\agent\loop.ts → C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\browser\actions.ts
- `runAgentLoop()` --calls--> `buildVisionPrompt()`  [INFERRED]
  C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\agent\loop.ts → C:\Users\OriShavit\Documents\GitHub\synthetic_user\src\agent\prompts.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (12): analyzeRun(), callAnthropic(), getClient(), callGemini(), getClient(), callOpenAIText(), callOpenAIVision(), getClient() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (3): takeScreenshot(), buildMarkdownReport(), generateReport()

### Community 2 - "Community 2"
Cohesion: 0.38
Nodes (4): runAgentLoop(), buildReasoningPrompt(), buildReasoningUserMessage(), buildVisionPrompt()

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (1): RunLogger

### Community 4 - "Community 4"
Cohesion: 0.6
Nodes (1): Guardrails

### Community 5 - "Community 5"
Cohesion: 0.4
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (3): executeAction(), getPageState(), waitForPageSettle()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 7`** (2 nodes): `action.ts`, `decision.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (1 nodes): `flow.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `guardrails.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `persona.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `report.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `runAgentLoop()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.281) - this node is a cross-community bridge._
- **Why does `RunLogger` connect `Community 3` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `routeReasoning()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `runAgentLoop()` (e.g. with `buildVisionPrompt()` and `buildReasoningPrompt()`) actually correct?**
  _`runAgentLoop()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `routeReasoning()` (e.g. with `runAgentLoop()` and `callAnthropic()`) actually correct?**
  _`routeReasoning()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `routeAnalysis()` (e.g. with `analyzeRun()` and `callAnthropic()`) actually correct?**
  _`routeAnalysis()` has 4 INFERRED edges - model-reasoned connections that need verification._