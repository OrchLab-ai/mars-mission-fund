# Define every design token

Components in packages/client/src use CSS custom properties that no stylesheet defines, such as --color-border-default and --color-accent-primary, so those styles silently drop out. Define every one of them in the semantic tier of packages/client/src/tokens.css, each mapped to an existing identity token in the way specs/standards/brand.md describes. Do not edit any component. Add a unit test that fails if any var(--name) used in packages/client/src has no definition, so this cannot come back.
