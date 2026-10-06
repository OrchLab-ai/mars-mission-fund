# Brand Guideline Interview Responses

This is the record of the Socratic interview that produced `specs/standards/brand.md` version 2.0.
The goal was a from-scratch rebrand of Mars Mission Fund, ending in brand guidelines with concrete colour values and font choices that can become design tokens.
Answers are quoted as given, split one sentence per line.

---

## Question 1: Who is the audience?

*Asked for one specific person, what she is doing when she arrives, and how much she trusts crowdfunding.*

> A 24-year-old astrophysics grad student on her phone, on a late train home, scrolling after seeing a friend share a mission on social media.
> She has backed a couple of indie games on Kickstarter, so crowdfunding feels normal to her, but she has never given to anything scientific.
> She would back $25 to $50 if the mission feels real and she can follow its progress like a story.
> She has about two minutes of attention, so the page has to make her care fast, and she wants to feel like she is part of the crew, not a donor to an institution.

---

## Question 2: What should she feel in the first few seconds?

*Pushed on the tension between "real" and "part of the crew", and asked for three ranked feelings in "X, but not Y" form, plus a reference.*

> Crew wins when they clash, because if she doesn't care in the first few seconds she never stays long enough to judge whether it's real.
> The realness comes second, from the details once she is hooked.
>
> 1. Belonging, but not a fan club.
>    She should feel invited onto the team, not sold merchandise.
> 1. Momentum, but not hype.
>    Things are moving and happening right now, without countdown timers or exclamation marks.
> 1. Credibility, but not a lab report.
>    Real numbers and real engineers, shown plainly, not buried in jargon.
>
> Strava gets it right.
> It makes strangers feel like teammates through shared progress, with bold, confident colour and big numbers that show momentum, and it stays credible because every claim is backed by real data underneath.

---

## Question 3: What is the colour palette?

*Asked for a base, one accent, and a progress colour, with hex values, and for how orange would differ from Strava and other space brands.*

> Base: light.
> A warm off-white, like a paper notebook, around #FAF7F2, with near-black ink text around #1C1B22.
> Dark is the space-site cliché, and a light page reads well on a phone in a bright train carriage.
> It also feels like a shared crew logbook rather than a planetarium, which serves belonging first.
>
> Accent: a deep electric violet, around #5B3DF5, like the purple of a Linear highlight but bluer and more saturated.
> I am rejecting orange, because Mars orange is what every space brand and Strava already own.
> Violet is the colour of the sky just after sunset, when launches happen, so it still says space without saying planet.
>
> Progress: a separate colour, so funding bars stand apart from buttons and links.
> A bright lime green, around #B6F23A, like the trace on a fitness tracker.
> Green means alive and moving, which carries the momentum feeling, and it never gets confused with something you can click.

---

## Question 4: How will the lime progress bar be seen on the off-white page?

*Pushed back.
Lime `#B6F23A` on `#FAF7F2` measures about 1.2:1, against the 3:1 WCAG 2.1 AA requires for UI components.
Offered three fixes: a dark track, a darker green, or an ink outline.
Also asked what colour the progress number should be.*

> Option 1, the dark track.
> It keeps the lime fully bright, which is the whole point of the fitness-tracker feel.
> A slim near-black track around #1C1B22, the same ink as the body text, reads as deliberate rather than heavy, like the black strip of a tracker band.
> It also gives each card one strong graphic anchor, which helps the momentum feeling land at a glance on a small screen.
> Keep the track thin, about 8px with fully rounded ends, so it is a line rather than a block.
>
> The progress number should be in ink, #1C1B22, bold, and large enough to be the first thing she reads on the card, with "raised of $50,000" after it in a muted grey around #6B6875.
> The number gets its energy from size and weight, not colour, and the lime bar right underneath it supplies the colour.

---

## Question 5: What fonts carry the brand?

*Asked for named, freely licensed typefaces for display headlines, body text and numbers, and whether the monospace data face stays.*

> Display headlines: Bricolage Grotesque, in ExtraBold.
> It's a chunky grotesque with a bit of quirk in the letterforms, so it feels human and confident rather than corporate or sci-fi, like a hand-painted crew patch rendered as a typeface.
> Headlines should be set in sentence case, large and tight, never all caps.
>
> Body text: Inter, at 16px with generous line height, around 1.6.
> It was built for screens and stays very readable on a phone in poor light, and its neutrality lets the headlines and the numbers carry the personality.
>
> Numbers: Inter as well, in Bold or ExtraBold with tabular figures switched on, so digits line up and don't jump as the raised amount and backer count change.
> Heavy, big Inter numerals give the same confident, scoreboard feel Strava gets from its stats, without needing a third font to load.
>
> What I'm rejecting: the monospace data face goes completely, because it makes the numbers read like telemetry rather than progress, which is the lab-report feel we want to avoid.
> I'm also dropping the condensed all-caps display face, because shouting in narrow capitals is the mission-control cliché, and the brand should feel like joining a crew, not reading a launch console.

---

## Question 6: What is the site never allowed to look like?

*Asked for testable rules covering imagery, decoration, and UI shape and motion, beyond the dark theme, orange, monospace and all-caps already ruled out.*

> No rendered planets, starfields, nebulae or stock astronaut photos anywhere on the site.
> Mission images must be real photos of the team, their hardware or their workshop, and when a mission has no photo, the slot shows a flat violet tile with the mission's initials in Bricolage Grotesque instead.
>
> No gradients on any surface, button or text.
> Every fill is one flat colour from the palette.
>
> No glows, neon edges or blurred glass effects.
> No element has an outer glow or a backdrop blur.
>
> No drop shadows on cards.
> Cards are separated by a 1.5px ink border on the off-white page, like stickers on a notebook, and the only shadow allowed anywhere is a short hard offset shadow on a button while it is pressed.
>
> No rocket, orbit-line, planet or star icons or decorative graphics.
> Icons are simple line icons for actions only, never for decoration.
>
> Corners are a consistent 12px radius on cards and fully rounded pills on buttons and progress bars, with no sharp square cards and no mix of radii on one screen.
>
> The only motion allowed is the progress bar filling from zero to its value once when it scrolls into view, and buttons responding to a press.
> Nothing loops, pulses, counts down, parallaxes or animates on its own.

---

## Question 7: How does the brand talk?

*Asked for a real headline, the main button label, and three words or phrases the brand never uses.*

> 1. Headline: "Six students are building the thing that tastes Mars dirt. They need a hand."
> 1. Button: "Join the crew".
>    When she's already backed it, the button becomes "You're on the crew" and leads to the mission's updates.
> 1. Never says:
>    - "Donate" or "donor". She's crew, not a donor.
>    - "Revolutionary" or "game-changing". Show the progress, don't announce it.
>    - "Stakeholder", "contribution tier" or "pledge level". It's a team, not a fund.

---

## Confirmation

The interview ended with a structured summary and a list of assumptions.
The user replied "Go" with one change.

> Go, with one change: make the big number 48/52 rather than 40/44.
> The raised amount should be the largest thing on the card, bigger than the display headline, because that's where the Strava-style momentum comes from.
> Everything else is right.

### Assumptions confirmed by "Everything else is right"

- The progress bar's fill animation is skipped when the user has "reduce motion" turned on.
- Card surface is `#FFFFFF`, and hairline dividers are `#E4DFD6`.
- Text on the violet button is `#FFFFFF`.
- The focus ring is a 2px violet outline with a 2px offset.
- The type scale is display 40/44, heading 28/34, body 16/26, and big number 48/52 (changed from 40/44), with a 4px spacing base.
- Status colours were proposed as error `#C62828`, warning `#B26A00` and success `#1F7A3A`.

### Correction made while writing the spec

The proposed warning colour `#B26A00` measures 4.0:1 on `#FAF7F2`, which fails the 4.5:1 AA requirement for text.
The spec uses `#9A5B00` instead, at 5.1:1.

### Additions not discussed in the interview

These were added to complete the token set and need design review.

- `--violet-deep` `#4A2BE0` as the hover and pressed colour.
- Card padding of 24px.
- A derived type scale for card titles (22/28), small body text (14/22), buttons (16/20), and labels (14/20).
- Badges as flat white pills with a coloured 1.5px border and text, with no dot indicator.
- A funded mission keeps the lime bar and is marked by a Funded badge, because the brand has no second progress colour.
- The already-backed state ("You're on the crew") uses the secondary button style, because lime is reserved for progress and must never look clickable.
- The existing coin logo was left alone and is recorded as an open item, because it uses the retired orange and dark palette.
