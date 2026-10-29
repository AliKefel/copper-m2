# Module 2: Tools on vs. tools off

_Fictional — for educational use._

**Your name:**

Ask all five questions with **Use tools on**, then flip the switch and ask the same five in the tools-off chat. (They're separate conversations, so Copper can't copy its own answers.) Find each answer's cost and time in the terminal running `npm run dev`: every call prints a line starting `[ai_calls]` with its tokens, cost and time.

## The five test questions

| # | Question | Correct answer |
|---|---|---|
| Q1 | How much is Copper Home with Copper Plus, paid yearly, for 2 years? | $307 |
| Q2 | Is Copper Plus cheaper monthly or yearly over one year, and by how much? | Yearly, by $16.88 ($79 vs. $95.88) |
| Q3 | Is Copper Notes in Night Sky in stock? | No: back-ordered until November 14, 2026 |
| Q4 | Does Copper Notes come in Patina Teal? | No. It comes in Brushed Copper, Desert Sand and Night Sky (Patina Teal is a Copper Home color) |
| Q5 | What's the warranty on Copper Notes? | Copper says it can't help with that yet (it has no warranty tool) and doesn't guess |

## 1. Results table

Mark each answer ✅ (correct) or ❌ (wrong). Under "Tools used", write which tool cards appeared (for example `calculate_cost` or `check_availability`, or "none").

| Question | Tools on: right? | Tools used | Cost | Time | Tools off: right? | Cost | Time |
|---|---|---|---|---|---|---|---|
| Q1 | | | | | | | |
| Q2 | | | | | | | |
| Q3 | | | | | | | |
| Q4 | | | | | | | |
| Q5 | | | | | | | |
| **Total** | **_ / 5** | | | | **_ / 5** | | |

## 2. Reading the steps

Pick one answer where Copper used a tool. Copy out:

- **What Copper was thinking** (the thinking station, in its own words):

>

- **What Copper sent** to the tool, and **what came back**:

>

Did the model pick the right inputs? How would you know if it hadn't? (2–4 sentences)

>

## 3. Live stock

1. Open `lib/copper/data/inventory.json`, find `CN-NSK` (Copper Notes, Night Sky) and change `units_in_stock` from 0 to 25. Save.
2. Reload the page and ask Q3 again, with tools on.
3. Change it back to 0 when you're done.

What did Copper say this time? Did you change any code or instructions? (2–3 sentences)

>

## 4. Tools off

Copper still thinks out loud in the tools-off chat. Find a question where it got the price wrong and copy out its thinking:

>

What happened when Copper had no tools? Which answers changed, and why can't a model know prices or today's stock without them? (3–5 sentences)

>

## 5. Risk

What could still go wrong with Ask Copper, even with tools? What do the tools protect against, and what don't they? Who at Copper should be responsible for it?

>

## 6. Reflection

What surprised you? What's one thing you'd change about Ask Copper next?

>

---

# Part 2: live stock from a database

Fill this in after Step 10. Everything above is part 1 and is graded on its own.

## 7. The same question, before and after

Ask your **deployed** site "Is Copper Notes in Night Sky in stock?", then change
`CN-NSK` to 40 units in the Supabase table editor and ask again.

| | Copper's answer |
|---|---|
| Before (0 units) | |
| After (40 units) | |

What did you have to do to make the live site change its answer? What did you
*not* have to do? (2–3 sentences)

>

## 8. Who can change stock now

In part 1, changing stock needed a developer, a commit and a deploy. Now it
needs a Supabase login. Who at Copper State Labs should be allowed to edit that
table, and what could go wrong if the wrong person can? (2–4 sentences)

>

## 9. What broke, or nearly did

Something in part 2 usually goes sideways: the wrong organization authorized,
variables set locally but not in Vercel, a paused project. What happened to you,
how did you work out what was wrong, and what told you? (2–4 sentences)

>

## 10. MCP in your own words

You gave Claude tools for Supabase, the same way you gave Copper tools for
prices and stock. Explain the difference between the MCP server you connected
and the connection your deployed app uses to read the table. (2–4 sentences)

>
