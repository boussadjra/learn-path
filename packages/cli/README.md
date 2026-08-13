# Learn Path CLI

Install Learn Path's canonical Agent Skills-compatible learning modes into supported AI coding tools.

```sh
npx learn-path list
npx learn-path add guided-debugging --agent agents
npx learn-path add --all --agent claude
npx learn-path doctor
npx learn-path remove guided-debugging --agent agents
```

The CLI copies self-contained skill directories without rewriting their content. It refuses to overwrite or remove a same-named directory unless its `SKILL.md` contains Learn Path ownership metadata.

Project scope is the default. Pass `--scope global` for a user-level installation or `--cwd <path>` to select a different project root.

