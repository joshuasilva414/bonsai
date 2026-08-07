# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bonsai is for individual learners who are studying from scattered material and need a coherent path through a subject. A learner may bring a syllabus, notes, slides, reading lists, or a long-form description of what they want to understand. Bonsai is intentionally multi-subject rather than limited to a single Data Structures & Algorithms vertical.

## Product Purpose

Bonsai is a graph-backed adaptive textbook. It builds a durable model of a subject and a private model of the learner, then uses both to create a living course outline and adapt future study sessions. Success means a learner can turn unstructured material into an inspectable learning path, study from it, leave and return with their state preserved, and understand what to learn next.

## Positioning

Bonsai is not a one-shot course generator or a chatbot with education branding. Its distinguishing mechanism is the combination of a persistent subject graph, a private learner overlay, and generated study artifacts that can adapt without replacing the underlying course wholesale. Adaptation should be visible and explainable: the learner should be able to connect what Bonsai recommends to their sources, activity, questions, and assessment results.

## Operating Context

The core loop is:

1. Bring source material or describe a learning goal.
2. Generate and review a persistent subject → topic → subtopic → objective graph.
3. Study a generated, source-grounded section in a continuous textbook session.
4. Capture understanding, confusion, interest, notes, and questions.
5. Quiz the learner and update their private learner state.
6. Remediate, clarify, or advance based on deterministic adaptation rules.
7. End with a session summary and a clear next recommendation.

The product is used as a private learning environment, not as classroom-management software, a social course marketplace, or a streak-driven study tracker.

## Capabilities and Constraints

### Current capabilities

- Authenticated learners can describe a learning goal and start a Cloudflare Workflow that generates a structured curriculum.
- Curricula are persisted as ordered subject, topic, subtopic, and objective nodes and are scoped to their owner.
- Learners can browse saved courses, inspect collapsible course outlines, and select curriculum nodes as the starting point for a textbook session.
- The composer can select source files in the interface, but those file contents are not yet passed into curriculum generation.
- The textbook-session route and subtree query establish the beginning of the adaptive study flow; the full generated-section and learner-state loop is not yet complete.

### Adaptive MVP now being built

- Ingest pasted or attached source material and keep generated content grounded in it.
- Generate persistent study sections for a selected graph node.
- Capture annotations, questions, interest, confusion, and understanding signals.
- Generate and score short quizzes, initially multiple choice and short answer.
- Persist a private learner overlay across sessions.
- Start with deterministic adaptation: poor quiz performance triggers remediation, a confusion signal triggers clarification, and otherwise the learner advances.
- Produce session summaries, recommended next work, incremental graph patches, and inspectable audit records.

### Boundaries

- Support multiple subjects without assuming a DSA-only schema, prompt, or interface.
- Prefer incremental graph patches over destructive full-graph regeneration.
- Reading increases exposure, not mastery; quiz results and explicit learner signals must remain distinct.
- Keep manual skip distinct from demonstrated understanding.
- Defer marketplace, public sharing, graph forking, collaboration, classroom and instructor tooling, voice/video/whiteboard tutoring, mobile apps, massive scraping, full textbook-PDF ingestion, universal graph infrastructure, and complex version control.

## Brand Commitments

The product name is Bonsai. Its voice is thoughtful, calm, and intellectually rigorous. It should feel like a private professor: attentive and quietly confident, never theatrical or overeager.

Do not make Bonsai resemble a generic AI dashboard, a chat thread with education branding, a flashcard streak tracker, or a static course catalog. Avoid decorative automation theater and claims that make adaptation feel magical or uninspectable.

## Evidence on Hand

- The current application implements curriculum generation, persistence, saved-course browsing, outline inspection, and authenticated curriculum subtree retrieval in `src/`.
- `docs/reference.local/bonsai-prd.md` and `docs/reference.local/bonsai-mvp-build-plan.md` preserve the earlier product and MVP reasoning. Their graph-backed adaptive-textbook mechanism remains relevant, but their DSA-only wedge is superseded by the confirmed multi-subject direction.
- No testimonials, customer logos, benchmark results, or public performance claims are currently established; future work must not fabricate them.

## Product Principles

- Keep the learner's material, goal, and current understanding at the center of every workflow.
- Make generated structure and adaptation legible, inspectable, and reversible where practical.
- Preserve a durable subject model and private learner state across sessions.
- Reduce cognitive load so the learner can focus on the subject and the next useful step.
- Earn confidence through source grounding, precise language, and clear system state rather than claims of AI magic.

## Accessibility & Inclusion

Target WCAG AA for core flows. Use semantic page structure, keyboard-operable controls, readable contrast, non-color status cues, polite live-region announcements, and reduced-motion alternatives. Prefer practical improvements in the normal implementation path over a separate ornamental accessibility effort.
