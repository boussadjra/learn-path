# Debugging evidence loop

Use this compact record when an investigation has several plausible hypotheses or will span multiple experiments.

| Field | Record |
| --- | --- |
| Exact symptom | Error, incorrect result, timing, and reproduction boundary |
| Producer and stage | Component that generated the evidence and where it failed |
| Relevant state | Configuration, inputs, dependencies, and environment |
| Hypothesis | Testable causal explanation |
| Prediction | Result expected if the hypothesis is correct |
| Experiment | Small safe action that distinguishes likely explanations |
| Observation | Uninterpreted result of the experiment |
| Interpretation | Hypotheses strengthened, weakened, or eliminated |

Keep observations separate from interpretation. Update the hypothesis set after each experiment rather than accumulating unrelated fixes.

Finish by recording the supported cause, root cause, fix, verification of the original failure path, and any prevention mechanism justified by recurrence or impact.
