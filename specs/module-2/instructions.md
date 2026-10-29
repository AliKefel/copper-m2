# Module 2: Build Ask Copper, the shopping chatbot

_Fictional — for educational use._

Shoppers on the Copper State Labs site keep asking what things cost and what's in stock. This module, you add **Ask Copper**: a chat panel that answers by using **tools** (small pieces of code that look up prices, do the math and check stock in the database) instead of guessing.

The panel also shows its work. As the answer arrives, you watch Copper pick a tool, send it numbers, read the result and write the reply. By the end you'll be able to explain exactly what a tool is, and show someone what happens without one.

Your agent writes the code. Your job is to paste each prompt below and run the command that follows it. The one part that's yours is the report in Step 6, written from what you see on screen.

The full requirements are in **`specs/module-2/spec.md`**. The prompts point your agent at the parts it needs, so you don't have to memorise it.

| | |
|---|---|
| **You'll build** | Four tools, Copper's instructions, a streaming Server Action, and the chat panel |
| **Your repo** | `copper-m2` (public, on your GitHub account; a new repo, separate from `copper-m1`) |
| **Points** | 75 from tests, plus 10 for your report (a TA) and 15 for the live site |
| **Submit** | Your repo link, your Vercel link, and a screenshot of `npm run check` (see [What to submit](#what-to-submit)) |

---

## Before you start

- Module 1 is done: you have a `copper-m1` repo and a live Vercel site.
- Your tools still work: `node --version` starts with v24, and `gh auth status` says you're logged in.
- You have a **Google AI Studio API key** ([aistudio.google.com](https://aistudio.google.com) > Get API key). It's free and needs no credit card. You'll need it from Step 5 on; the tests don't need it.

## Step 1: Get the starter code and make it yours

```bash
cd ~/Developer        # or wherever you keep your projects
git clone --branch module-2-part-1 https://github.com/CIS-591/class-examples.git copper-m2
cd copper-m2
npm run start-module  # creates github.com/YOUR-USERNAME/copper-m2 (public)
npm ci
npm run check
```

The starter is the finished Module 1 landing page, plus three starter files in `lib/copper/assistant/` and the stock list in `lib/copper/data/inventory.json`.

`npm run check` should say **12 of 27**: Module 1's 12 criteria pass and all 15 Module 2 criteria fail. That list is your to-do list. `REPORT` and `DEPLOY` show as "checked later".

## Step 2: Let your agent build the tools

Open your AI agent in the project folder and paste this:

```
Read specs/module-2/spec.md section 1 ("The four tools") and
lib/copper/assistant/tools.ts, then plan get_products, get_prices,
calculate_cost and check_availability exactly as the spec describes them.
Three things the tests check, so get them right: "Copper Home with Copper Plus,
paid yearly, for 2 years" comes to $149 + 2 x $79 = $307, counting Copper Plus
once per household and not once per device; Copper Notes in Patina Teal is
"not a color" rather than "out of stock", because Copper Notes only comes in
Brushed Copper, Desert Sand and Night Sky; and no price is typed into the code,
with every price read from the catalog and stock read fresh from
readInventory() on every call. Build them, run npm run check, and tell me how
each of those three came out.
```

**AC-M2.5 to AC-M2.10** should pass. Commit.

## Step 3: Copper's instructions

Paste this:

```
Read specs/module-2/spec.md section 2 and replace the TODO in
lib/copper/assistant/instructions.ts with COPPER_INSTRUCTIONS: at least 40
words of plain English covering every point the spec lists. Then show me the
finished wording.
```

These instructions are the difference between a chatbot that checks and one
that guesses, which is what Step 6 measures. Read the wording your agent
produced before you move on, and tell it to change anything that doesn't sound
like Copper.

## Step 4: Let your agent build the streaming and the panel

Paste this:

```
Read specs/module-2/spec.md sections 3, 4 and 5, plus lib/ai/call.ts,
lib/ai/live.ts and lib/copper/assistant/progress.ts. Plan, then build:
askCopper() in lib/copper/assistant/ask.ts, the panel in
components/copper/ask-copper.tsx, and the tool card. Follow the spec exactly,
and pay attention to these, which the tests check: every model call goes
through callStream with { module: 2, feature: "ask-copper" } and
providerOptions: THOUGHT_SUMMARIES; tools and instructions are sent only when
Use tools is on, with stopWhen: stepCountIs(5), and with it off you send no
instructions and no tools at all; each update is a fresh copy of everything so
far; askCopper returns { progress } immediately and reads the stream in the
background; a tool step appears at tool-input-start, before its input is
known; tools on and tools off are separate conversations. Use a Server Action,
no API route and no new page, and brand colours only. Run npm run check after
each part. Two things the tests don't prove, so confirm them for me when you're
done: with no API key set the panel shows the "Set up Google AI" card instead of
crashing, and the three starter questions reappear under every answer, hidden
only while a reply is streaming.
```

Commit when **all 15 Module 2 criteria** pass.

## Step 5: Try it for real

1. Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local` (see the README). It's the only key this module needs. Never commit this file.
2. Start the app, saving the log so your agent can read it in Step 6:

```bash
mkdir -p .grading && npm run dev 2>&1 | tee .grading/dev.log
```

3. Open http://localhost:3000, click **Ask Copper**, and ask these three:
   - "How much is Copper Home with Copper Plus, paid yearly, for 2 years?" — watch the four stations: the tools Copper can use, what it was thinking, the tool it called with what it sent and what came back, then the answer.
   - "Is Copper Notes in Night Sky in stock?" — this one calls `check_availability`.
   - "What colors does Copper Home come in?" — this one calls `get_products`, and never looks at stock.

Section 5 of the spec describes the panel exactly, and a TA compares yours with it. The four stations exist to make the agent loop visible: the tools on offer, the model's thinking, the round trip to your code, and the answer.

Every question's cost and time are logged by `lib/ai/call.ts` as a line starting `[ai_calls]`, in the terminal and now also in `.grading/dev.log`.

## Step 6: Write your report

Open `specs/module-2/report.md`. Ask the five test questions with **Use tools on**, then the same five in the **tools-off** chat, and fill in the tables.

Let your agent do the copying-out. Paste:

```
Read .grading/dev.log and specs/module-2/report.md. Fill in the Cost and Time
columns of the results table in the report from the [ai_calls] lines, in
order, leaving every other column blank for me.
```

The judgement is still yours: mark each answer right or wrong, read one tool card and one thought summary and write down what they say, change a stock level in `lib/copper/data/inventory.json` and watch the answer change without touching any code.

The REPORT rubric in `spec.md` is what the TA uses. All of this costs well under a dollar, and Google's free tier may cover it entirely. This is the one part of the module that needs a real key: the 75 test points never call a model.

## Step 7: Check your work and deploy

```bash
npm run check       # aim for 27 of 27
npm test && npm run lint && npm run typecheck && npm run format
git push
```

If anything fails, hand it over rather than hunting:

```
npm run check / npm test / npm run lint / npm run typecheck is failing. Here's
the output. Find the cause and fix it without changing anything under specs/.
```

Then:

1. Go to https://vercel.com/new and import your **`copper-m2`** repository.
2. Under **Environment Variables**, add `GOOGLE_GENERATIVE_AI_API_KEY`. Click **Deploy**.
3. Open your Vercel link and ask Copper a question.

The grader looks for "Ask Copper" on your live site. It shows even without the key, but add it so your chatbot really works.

---

# Part 2: live stock

Everything above is part 1, and it's worth all 75 test points. Part 2 is the
second class session. Finish part 1 first, including your report, because
Step 9 deletes the stock file your report writes about.

Right now today's stock lives in a file that ships inside your deployed code.
That means a warehouse update needs a developer, a commit and a deploy. In
this part you move stock into a **database** (Supabase), and change one
function so Copper reads it. Nothing else about Copper changes, and no test
changes, because the tests never look at where stock really comes from.

A **database** here is just a table on someone else's computer that your app
can read over the internet, and that you can edit in a web page without
touching code.

Two steps of yours, and one prompt does the rest.

## Step 8: Get the part 2 files and a Supabase project

In your `copper-m2` folder, take this session's files — the migration, the seed
and the Supabase client your agent uses in Step 9. Copy them in rather than
merging the branch, so nothing you wrote in part 1 is touched:

```bash
git fetch course
git checkout course/module-2-part-2 -- supabase lib/supabase \
  specs/module-2/instructions.md specs/module-2/spec.md package.json package-lock.json
git show course/module-2-part-2:specs/module-2/report.md | sed -n '/^# Part 2/,$p' >> specs/module-2/report.md
npm install
```

The last line appends part 2's report questions under the answers you already
wrote, instead of replacing the file.

Then create the database. Like your Google AI Studio key, it's free and needs
no credit card.

1. Go to [supabase.com](https://supabase.com), sign up, and create a new
   project. Use your personal email, not your ASU one. Give the database
   password to your password manager; you won't need it again.
2. Wait for the project to finish setting up (a minute or two).
3. In **Project Settings > General**, copy the **Reference ID**.

## Step 9: Let Claude do the rest

Instead of running database commands yourself, you connect Claude Code to
Supabase with an **MCP server** — a standard way to give an agent tools it
didn't ship with. Same idea as Copper's four tools, one level up: this time
*your agent* is the one getting tools.

Run this inside your `copper-m2` folder, with your own Reference ID:

```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=YOUR-REFERENCE-ID"
```

`?project_ref=` matters: it limits Claude to this one project. The MCP server
acts with *your* permissions, so keep it pointed at a project you don't mind
it changing.

Start Claude Code with `claude`, type `/mcp`, and authorize Supabase in the
browser window that opens — picking the organization that holds your project.
Then paste:

```
Using the Supabase MCP tools: apply supabase/migrations/20261029000000_inventory.sql
to my project, run supabase/seed.sql, and show me the rows in the inventory
table. Then look up the project URL and the publishable key and add them to
.env.local as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
without printing the file. Finally, read lib/copper/inventory.ts and
lib/supabase/server.ts and rewrite readInventory() to read every row from the
Supabase inventory table instead of the JSON file, keeping the same return
type: InventoryRow[] when it works, null when it can't read. Delete
lib/copper/data/inventory.json and run npm run check.
```

You should see the same six rows that are in `inventory.json` today, and
`npm run check` must still say **27 of 27**. The tests replace the whole
inventory file with a fake, so moving stock to a database can't affect them.
If a number moved, something else broke.

Last, the deployed site needs the same two values:

1. In Vercel, under **Project Settings > Environment Variables**, add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` next
   to your Google key. Both are in `.env.local`; the publishable key is the
   one that's safe to use in a browser, never the secret one.
2. Commit, push, and let Vercel redeploy.

## Step 10: Prove it's live

This is the part worth writing about:

1. Open your **deployed** site and ask "Is Copper Notes in Night Sky in stock?"
2. In Supabase, open the **Table Editor**, find row `CN-NSK`, and change
   `units_in_stock` from 0 to 40. Save.
3. Ask the live site the same question again.

The answer changes. No commit, no deploy, no code. A shop manager could have
done that. Write down both answers in your report.

## What to submit

In Canvas:

1. Your GitHub repo link (`https://github.com/YOUR-USERNAME/copper-m2`)
2. Your Vercel link
3. A screenshot of `npm run check` showing **27 of 27** criteria passed

Your report is graded from `specs/module-2/report.md` in your repo, so make sure it's committed and pushed.

## How it's graded

| Part | Points | How |
|---|---|---|
| Part A: the chat widget (AC-M2.1 to AC-M2.4) | 20 | Tests |
| Part B: the tools (AC-M2.5 to AC-M2.10) | 30 | Tests |
| Part C: streaming (AC-M2.11 to AC-M2.15) | 25 | Tests (with a fake model and database, so they cost nothing) |
| REPORT: tools on vs. off | 10 | A TA, using the REPORT rubric in `spec.md` |
| DEPLOY: live on Vercel | 15 | The grader checks your live site |

Your last commit before the deadline is graded. Tests are run with your instructor's copy, so changing them in your repo doesn't change your grade.

## Rules

- **Don't edit** `specs/*/tests`, `specs/*/rubric.md`, `lib/copper/catalog.ts`, `lib/copper/inventory.ts` or `lib/copper/data/` — until Step 9, which rewrites `lib/copper/inventory.ts` and deletes the stock file on purpose.
- **Never commit `.env.local` or paste keys into code.**
- **Everything about Copper State Labs is fictional.** Don't use real company names, logos or products.

## Troubleshooting

| Problem | Fix |
|---|---|
| The panel says "Set up Google AI" | Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local` and restart `npm run dev`. On Vercel, add it in Project Settings > Environment Variables and redeploy |
| Copper answers but no tool card appears | Use tools is off, or the model answered without a tool. Check your instructions say to **always** use the tools |
| Copper says nothing at all with tools off | You sent Copper's "always use your tools" instructions with no tools. With tools off, send no instructions at all |
| No thinking station appears | `providerOptions: THOUGHT_SUMMARIES` is missing from your `callStream` call |
| The answer appears all at once | You're waiting for the whole stream before sending an update. Send one on every change |
| `.grading/dev.log` is empty or missing | You started the dev server without the `tee` command in Step 5. Stop it and start it again that way |
| Copper says stock can't be checked (part 1) | `readInventory()` returned nothing. Check `lib/copper/data/inventory.json` is still valid JSON |
| Copper says stock can't be checked (after Step 9) | The two `NEXT_PUBLIC_SUPABASE_*` variables are missing or wrong, or the project is paused. Check `.env.local`, restart `npm run dev`, and open the project in Supabase to wake it |
| `/mcp` shows no Supabase tools | The `claude mcp add` command ran in a different folder, or you closed the browser before authorizing. Run it again inside `copper-m2`, then `/mcp` |
| Claude says it can't see your tables | You authorized the wrong Supabase organization. In `/mcp`, disconnect Supabase and authorize again, choosing the organization that holds your project |
| Stock works locally but not on Vercel | The two Supabase variables are only in `.env.local`. Add them in Project Settings > Environment Variables and redeploy |
| Your Supabase project is "paused" | Free projects sleep after about a week unused. Open it in Supabase to wake it, and always wake it before a deadline |
| AC-M2.5 fails with $386.88 or similar | Copper Plus is being counted once per device. It's once per household |
| AC-M2.6 fails | A price is typed into `tools.ts`. Read every price from `getProducts()` and `getPlans()` |
| AC-M2.7 or AC-M2.10 fails | An input schema is still `z.any()`, or lets in something the contract doesn't allow |
| AC-M2.9 fails after the stock changes | The tool saved the table once instead of reading it each time |
| AC-M2.10 fails on Patina Teal | It says "out of stock" instead of `"not_a_color"`. Check the color against the product's colors in the catalog first |
| AC-M2.11 fails | The model gets only one step, so it never sees the tool's result. Add `stopWhen: stepCountIs(5)` |
| AC-M2.12 fails | The tool step is added only when the input arrives. Add it at `tool-input-start`, when only the name is known |
| AC-1.4 (Module 1) fails | You added an API route or page. Use a Server Action (`"use server"`) in `lib/copper/assistant/ask.ts` instead |
| AC-4.1 (Module 1) fails | The new chat code uses a non-brand color. Swap it for a theme class |
| `npm run check` says "could not run" | A compile error. `npm run typecheck` shows it |
| `check_availability` finds no rows | A stock row's `product` holds "Copper Notes", not `copper-notes`. Look the name up with `getProducts()` first |
| Two tool cards appear for one tool call | `tool-input-start` gives `part.id`; the later parts give the same id as `part.toolCallId`. Match on it |
| `npm run build` stops with a Next.js security notice | Run it again; it continues. The course pins this version, so don't upgrade it |

When something breaks, hand your agent the command you ran and the full error message. After 20 minutes with no progress, or when a fix works and you can't tell why, post in the course forum or come to office hours.
