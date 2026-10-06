# Brand Guideline Interview: Responses

Socratic interview for the Mars Mission Fund rebrand, run 2026-10-06. Answers are condensed from the user's replies. The resulting standard is `specs/standards/brand.md`.

## Q1. Audience

Who is the person using this site, and what are they doing when they land on it?

Priya, 34, a software engineer in Perth who grew up watching shuttle launches and now follows every Starship test on YouTube. She clicked through from a post about a methane engine team that needs funding for its next test. She has about $50 she would happily put towards getting humans to Mars, and she is deciding in the next two minutes whether this project is real, whether it is making progress, and whether her money will move it forward. If the site feels credible and she can see the mission advancing, she pledges. If it looks like hype or a generic crowdfunding page, she closes the tab.

## Q2. Feeling

What should she feel in the first few seconds?

- **Awe**, like standing under the Saturn V at Kennedy Space Center: the scale hits before you read a word.
- **Competence**, like a NASA or SpaceX mission-control livestream: telemetry, timestamps, calm and precise language.
- **Belonging**, like seeing your name on the list of people who sent their names to Mars on Perseverance: one small part of something huge.

What the product has that other crowdfunding sites don't: real engineering progress you can watch, with milestones, test results and team updates. It should feel like joining a mission, not buying a product.

## Q3. Colour palette: base and accent

- **Base:** dark. A deep blue-black like the sky in the hour after sunset, not pure black (which feels like a gaming site). It gives awe immediately, it is the native look of a telemetry screen, and it makes the funding progress and next milestone stand out.
- **Accent:** not Mars red. A golden amber around hue 35 to 40, like sodium-vapour launch-pad light or rocket exhaust in a night-launch photo. It says ignition and momentum rather than danger, stays readable on the dark base, and almost no space brand uses it. Mars itself lives in photography, not the UI colour.

## Q4. Colour palette: states and neutrals

- **Progress bar:** amber, the same as the pledge button, because the matching colour says "this is how you move that bar".
- **Completed and verified:** a cool teal, like a "go" light on a console. Amber is reserved for things in motion and the main action.
- **Warnings:** never amber. An outlined style with an icon and a label.
- **Errors and destructive actions:** a muted brick or rust red, used sparingly, always with text and an icon. The one place Mars red is allowed, because it means stop.
- **Neutrals:** lean cool blue. Surfaces are slightly lighter steps of the same blue-black, and secondary text is a soft blue-grey.

## Q5. Typography

- **Headlines:** wide and monumental but engineered, like lettering stencilled on a rocket stage or the NASA "worm" logotype. Archivo in its expanded width, uppercase or tight title case, big and sparing.
- **Body:** like reading a well-written engineering log from people you trust. IBM Plex Sans.
- **Numbers:** monospaced like a console readout. IBM Plex Mono for funding totals, backer counts, timestamps, countdowns and percentages. Body copy keeps proportional figures.
- **Out:** sci-fi display fonts (Orbitron, Eurostile knock-offs, cut corners, glowing outlines), all-caps body text, letter-spaced "futuristic" headings, gradient text. Awe comes from scale and photography, not from fonts pretending to be the future.

## Q6. What it must never look like

- No starfield or twinkling backgrounds, nebula wallpapers, or stock 3D renders of rockets or astronauts.
- No neon glows, glassmorphism, or purple-to-blue gradients (the NFT and crypto look).
- No urgency countdown banners and no fake scarcity.
- No confetti, fireworks or "you're awesome" pop-ups. Pledging should feel like being given a mission patch, not winning a game.
- No rounded pastel cards, cartoon mascots or emoji-heavy copy (the Kickstarter look).
- No reward-tier tables that feel like shopping, no stock-photo heroes of smiling people looking at the sky, no parallax or animated hero videos.
- **Imagery rule (not just a preference):** real photography of test stands, hardware, teams and NASA/ESA Mars images. Diagrams and technical drawings are allowed when they explain something, drawn in the site's own line style in amber and teal on the dark base. No decorative illustration or AI-generated space art. If it can't be shown for real, show the data.

## Q7. Form and motion

- **Shape:** slightly softened corners, about 4px. Cards are filled surfaces one step lighter than the base, separated by tone, with a 1px faint cool blue-grey hairline only where two surfaces need a clear edge.
- **Density:** generous spacing around cards and in reading areas; data inside a card packed tightly and aligned like a console readout, with small quiet labels and prominent numbers.
- **Motion:** functional only. The progress bar fills smoothly once (on first view or when the total changes) over about half a second with an ease-out. Totals and counts tick up briefly when they change, never on a loop. A verified milestone fades to teal. Hover and focus are a subtle brightening or an amber outline. Nothing bounces, pulses, glows or loops. Everything respects reduced-motion, so values simply appear.

## Confirmation

The summary of colours, type, prohibitions, imagery and motion was read back and confirmed with "correct". Hex values in the standard were proposed by the assistant from these descriptions (not supplied by the user) and contrast-checked.

## Choices the assistant made while writing the standard

- `--brick` was lightened from the first proposal (`#D9644A`) to `#E0735A` so it passes AA text contrast on the raised surface (4.9:1).
- A `--slate-edge` (`#5A6B88`) was added for input borders so they meet 3:1 non-text contrast, since the faint hairline is only 1.6:1.
- The standard defines no decorative gradients at all. That goes slightly beyond what was said (which banned purple-blue gradients and gradient text).
- Voice and forbidden-language rules from v1.3 were kept, including the regulatory ban on "invest" wording, with the personality axes and urgency language recalibrated.
- The logo was not covered by the interview and is listed as an open item.
