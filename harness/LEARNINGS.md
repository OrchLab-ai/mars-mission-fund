# Lessons from review findings

One line per lesson, appended by harness/pipeline.sh and read by its planning stage.

- Remove stray or leftover files from tooling before committing; every changed file should be justified by the task. (run 20261007-053155)
- When turning unexpected errors into generic responses, still log the original error server-side so failures can be diagnosed. (run 20261007-053155)
- Reuse the names the spec lists for new code, or note any deliberate departures from them. (run 20261007-053155)
- Test key behaviors, such as list refresh after a successful post, at unit level rather than relying only on end-to-end tests. (run 20261007-053155)
