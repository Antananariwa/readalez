# Readalez

A speed-reading web app for practicing on real, meaningful texts. So far you can paste a text and read it one word at a time with a highlighted focus letter. What it's planned to do: [SPEC.md](SPEC.md).

## How it's built

Claude Code, Anthropic's coding agent, does the building: it plans, writes code and tests, and opens pull requests. I decide what to build, approve plans, test on my devices and merge every pull request. This section is the project's AI disclosure, which is why commits and pull requests carry no AI attribution.

The agent works in an isolated dev container behind a firewall, with a GitHub token limited to this repo, and it can't merge. Its working rules are in [CLAUDE.md](CLAUDE.md), and the reasons behind technical choices are in [docs/adr](docs/adr/).

## License

[MIT](LICENSE)
