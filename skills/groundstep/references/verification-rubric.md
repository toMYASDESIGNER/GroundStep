# Visual verification rubric

Use the lowest verdict that the visible evidence can honestly support.

## Verified

All step-critical objects, labels, orientations, and connections are visible. The image directly proves the expected state. No visible hazard or contradiction exists. Suggested confidence: 0.85–0.99.

## Mismatch

The relevant detail is clear, but at least one visible fact contradicts the expected state. Name the fact rather than guessing the cause. Suggested confidence: 0.80–0.99.

## Uncertain

The image is blurred, dark, cropped, stale, obstructed, or missing a required label/detail. Ask for the smallest photographic change that would resolve uncertainty. Suggested confidence: 0.35–0.79.

## Unsafe

A visible condition makes continued action inappropriate: heat damage, liquid near power, exposed conductor, swelling, smoke, a broken safety component, or another explicit hazard. Stop the sequence. Suggested confidence: 0.75–0.99; use `uncertain` when the suspected hazard itself is not visible enough.

## Anti-hallucination checks

- Describe only pixels that are present.
- Do not claim a connection is electrically functional from connector placement alone.
- Do not identify a port by color if its label is required but unreadable.
- Do not reuse an earlier photo as proof of a later step.
- Do not lower the evidence standard to satisfy the user.
