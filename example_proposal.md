Proposal 1 — I nsi d e t h e M ach i ne' s E ye: H ow A I R ead s a P i ct ure and a S ent ence at O nce
(Required topic: Vision-Language Model interpretability)
AI concept taught. How a vision-language model (VLM) converts an image into tokens, fuses them with text tokens through the
transformer stack, and arrives at an answer. Learning
objectives: (1) images become patch tokens alongside word tokens; (2) cross-
modal attention lets text tokens "look at" image regions (and vice versa); (3) the lo
git lens sh
ows visual-token representations
gradually becoming language-like across layers; (4) attention is a p l a u s ib l e b u t n o t a l w a y s f a it h f u l explanation — a deliberately
taught caveat.
Need /
gap analysis. VISxAI has covered text transformers exhaustively (T r a n s f o r m e r E x p l a in e r,
2025) and multi-modal e m b e d d in g
c o m p a r is o n (Humer et al.,
2023, CLIP-style),
but no explainable teaches what happens inside a VLM when it answers a question
about an image. Research tools exist — VL-InterpreT (Intel Labs; CVPR 2022 Best Demo; language↔vision attention heatmaps:
pick an image patch to see contributing text tokens, or a text token to see an attention heatmap over the image) and LVLM-
Interpret (Intel, CVPR 2024 worksh
op; raw attention, relevancy maps, and causal graphs for LLaV A) — but they are analyst
dash
boards, not narrated pedag
g
o
y for a broad audience. Recent findings give this explainable real substance: Neo, Ong
, Torr, Geva,
Krueger & Barez, "Towards Interpreting Visual Information Processing in Vision-Language Models" (ICLR 2025; arXiv:
2410.07149),
report that "visual token representations become increasingly interpretable in the vocabulary space across layers" and that "object
identification accuracy drops by over 70% when object-specific tokens are removed" — i.e., object information is localized in the
visual tokens at the object's spatial position. This proposal turns th
ose research insights into a guided, interactive story — the
novelty is pedag
g
o
y + narrative + a general-audience "steering the gaze" interaction, not a new research tool.
Target audience. ML students and practitioners new to multimodality; technically curious general readers; educators.
Interactive visualization design.
Hero view — "the gaze overlay": a ph
oto beside a question ("W
hat color is the umbrella?"). As the model answers token-by-
token, the image is overlaid with a cross-modal attention heatmap (24×24 patch grid) sh
owing which regions the current
output token attends to. A scrubber steps through generated tokens; the heatmap animates.
Layer slider — "the lo
git lens": for a ch
osen visual token, pro
ject its hidden state at each layer through the unembedding
matrix and sh
ow a streamgraph
of the top vocabulary words it "means" at each depth
— visualizing
pixels turning into words.
Head explorer: small-multiples grid of attention heads; click a head to see whether it does language→vision, vision→language,
or within-modality attention (the four VL-InterpreT quadrants), reframed for learners.
Faith
fulness challenge: an interaction where occluding the "attended" region sometimes d o e s n' t change the answer —
teaching that attention ≠ explanation.
Narrative / pedag
g
o
y (scrollytelling arc).
1. 3. 4. 5. 6. A q u e s t io n a b o u t a p ic t u r e — set up the task.
2. E v e r y t h in g b e c o m e s t o k e n s — patches + words in one sequence.
L o o k in g a c r o s s m o d a l it ie s — cross-modal attention,
gaze overlay.
F r o m p ix e l s t o w o r d s — lo
git lens streamgraph
No t a l l h e a d s a r e e q u a l — head roles.
D o e s a t t e n t io n t e l l t h e t r u t h ? — faith
7
. T r y it y o u r s e l f — optional live SmolVLM demo.
fulness caveat (misconception addressed: "the heatmap is the reason").
Meth
odolo
g
y. Precompute traces offline with LLaV A-1.
5-7B (the de-facto standard for VLM interpretability — richest set of
copyable recipes; clean 24×24 patch grid), using
output
_
attentions/ output
hidden
_
_
states and a lo
git-lens matmul ( logits
_
= W
U · h
_
_
l ) on visual-token hidden states; serialize per-example JSON (attention tensors, rollout, lo
git-lens top-k per layer).
l
.
Curate ~8–12 image/question pairs. Optional live layer: SmolVLM-256M via Transformers.
js v3 + WebGPU (under 1 GB VRAM; up
to ~80 tok/s on M4 Max) for free-form Q&A, decoupled from the internals view. D3 for heatmaps/streamgraphs; Svelte for state.
Feasibility (solo). M e d iu m . Main risk is attention-tensor payload size (VLMs have many visual tokens → large JSON); mitigate by
downsampling heads/layers sh
own, quantizing JSON, and limiting curated examples. Offline extraction is well-trodden. MVP:
gaze
overlay + lo
git lens on precomputed examples. Stretch
: live SmolVLM demo,
head explorer, faith
fulness challenge. Estimated effort:
6–9 focused weeks.
Novelty statement. First VISxAI explainable to n a r r a t e VLM cross-modal attention and the visual-token lo
audience, translating VL-InterpreT / LVLM-Interpret / Neo-et-al. research into
guided pedag
g
o
and an explicit faith
fulness lesson.
git lens for a general
y with a "steer the gaze" interaction