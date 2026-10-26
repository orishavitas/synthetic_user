# New Product Baseline: Thinking Methodology + Core Docs

This file is a practical “baseline kit” for starting a new product. It includes:
- a basic thinking methodology (how to reason from problem → solution),
- the minimum set of documents that keep a team aligned,
- simple templates you can copy/paste.

---

## 1) Basic thinking methodology

### 1. Start with the **problem**, not the solution
**Goal:** Describe what pain exists, for whom, and why it matters.

- **User/Customer:** the person who feels the pain (e.g., “data platform engineer”).
- **Problem statement:** one sentence, plain language.  
  Example: “Data teams can’t explain cost spikes fast enough to prevent waste.”
- **Why now:** what changed to make this urgent (growth, budget pressure, tech shift, regulation).

**Output:** a problem definition you can test with real users.

---

### 2. Define **success** before building anything
**Goal:** Align on what “good” looks like.

- **Outcome metrics:** user/business outcomes (e.g., “reduce un-attributed spikes by X%”).
- **Input metrics:** leading indicators (e.g., “% of spikes triaged within 24h”).
- **Guardrails:** what must not get worse (e.g., “no alert fatigue,” “no workload disruption”).

**Output:** success criteria + guardrails.

---

### 3. Understand the user’s **workflow** and constraints
**Goal:** Design for real life, not an idealized flow.

- **Workflow map:** how they do it today (even if messy).
- **Jobs-to-be-done (JTBD):** what they’re trying to accomplish.  
  Example: “Explain this spike to finance by EOD.”
- **Constraints:** permissions, performance, data availability, security, compliance, time.

**Output:** workflow + key pain/opportunity moments.

---

### 4. Generate solution options, then choose a **bet**
**Goal:** Avoid anchoring on the first idea.

- Draft **2–4 solution directions** (concepts, not polished UI).
- Compare **tradeoffs:** complexity, cost, accuracy, adoption, speed to value.
- Define **MVP:** the smallest version that proves core value.

**Output:** chosen direction + explicit scope boundaries.

---

### 5. Validate assumptions early with **evidence**
**Goal:** Replace opinions with learning.

- List critical **assumptions** (trust, adoption, data quality, workflow fit).
- Run **tests:** interviews, prototype testing, fake-door, dogfooding.
- Set an **evidence threshold:** what you need to see to proceed.

**Output:** decision log (what you learned + what changed).

---

### 6. Turn the bet into a delivery plan
**Goal:** Move from idea → build without chaos.

- **Requirements:** functional + non-functional (speed, reliability, security).
- **Milestones:** MVP → beta → GA (general availability).
- **Dependencies:** data, permissions model, notifications, integrations, etc.

**Output:** roadmap + execution plan.

---

## 2) Core baseline documents (minimum set)

### A) Product Brief (1–2 pages)
**Purpose:** Alignment on the “why” and the “what”.

Include:
- Problem statement
- Target user(s) + context
- Proposed solution (high level)
- Success metrics + guardrails
- Scope / out-of-scope
- Risks + open questions

---

### B) PRD (Product Requirements Document)
**Purpose:** Define how the product should behave.

Include:
- User stories (“As a…, I want…, so that…”)
- Functional requirements
- Edge cases
- Non-functional requirements (latency, accuracy, privacy, uptime)
- Analytics/events to track success

---

### C) User Journey / Workflow Map
**Purpose:** Shared understanding of end-to-end experience.

Include:
- Current state journey
- Future state journey
- Pain points + key moments that matter

---

### D) Research Summary (with links to raw notes)
**Purpose:** Evidence that you’re solving the right thing.

Include:
- Who you spoke to (roles, context)
- Top insights (patterns)
- A few representative quotes
- Product implications (decisions this informs)

---

### E) Assumptions & Risks Log
**Purpose:** Make uncertainty explicit; track de-risking.

Columns:
- Assumption
- Risk if wrong
- How we’ll validate
- Owner
- Status (untested / tested / disproven)
- Notes / evidence link

---

### F) UX Spec / Prototype + interaction notes
**Purpose:** Reduce ambiguity for engineering and stakeholders.

Include:
- Key screens + states
- Empty/loading/error states
- Permissions/visibility rules
- Microcopy requirements

---

### G) Analytics & Experiment Plan
**Purpose:** Know if it worked and why.

Include:
- Events to instrument
- Funnels (e.g., “view → investigate → resolve”)
- Dashboards + owners
- Experiment ideas (if applicable)

---

## 3) Optional (often very useful for B2B / data products)

- **Technical brief / architecture notes:** data sources, lineage, permissions model, compute cost considerations
- **GTM one-pager:** positioning, target segments, rollout plan, pricing/packaging assumptions, enablement needs
- **Support & ops plan:** runbooks, monitoring, escalation paths

---

## 4) Templates (copy/paste)

### 4.1 Product Brief template

**Working name:**  
**Owner:**  
**Date:**  

**Problem statement:**  
**Who has this problem:**  
**Why now:**  

**Proposed solution (1–3 bullets):**  
-  
-  
-  

**Success metrics (outcomes):**  
-  
-  

**Leading indicators (inputs):**  
-  
-  

**Guardrails:**  
-  
-  

**Scope (in):**  
-  
-  

**Out of scope (not now):**  
-  
-  

**Risks / open questions:**  
-  
-  

---

### 4.2 PRD-lite template (good for MVPs)

**Goal:**  
**Non-goals:**  

**Primary users:**  
**Core workflow:**  

**User stories (must-have):**
1. As a __, I want __, so that __.
2.  
3.  

**Requirements:**
- R1:  
- R2:  

**Edge cases & states:**
- Empty state:  
- Loading:  
- Error:  
- Permissions:  

**Non-functional requirements:**
- Performance:  
- Reliability:  
- Security/privacy:  
- Accuracy (if relevant):  

**Analytics (events + success tracking):**
- Event:  
- Funnel:  

---

### 4.3 Assumptions & Risks Log template

| Assumption | Risk if wrong | Validation method | Owner | Status | Evidence |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

---

### 4.4 Research Summary template

**Participants:** (roles, company size/context)  
**Method:** (interviews / usability test / survey / etc.)  
**Date range:**  

**Top insights (patterns):**
1.  
2.  
3.  

**Notable quotes:**  
- “…”  
- “…”  

**Implications for product decisions:**
-  
-  

---

### 4.5 Analytics Plan template

**North-star outcome:**  
**Primary funnel:** (step-by-step)  
1.  
2.  
3.  

**Events to track:**
-  
-  

**Dashboards needed:**
-  
-  

**Guardrails to monitor:**
-  
-  

---

## 5) Quick checklist (baseline readiness)

- [ ] Problem statement is clear and validated with real users
- [ ] Success metrics and guardrails are agreed
- [ ] Workflow map exists (current + future)
- [ ] MVP scope is explicitly defined (and what’s out-of-scope)
- [ ] Assumptions are listed with validation plans
- [ ] PRD-lite is written and reviewed
- [ ] Analytics events and dashboards are defined
