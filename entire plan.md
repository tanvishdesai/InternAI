# PM Internship Recommendation — Roles & Deliverables (Hackathon)

> **Purpose:** A single-page, actionable plan that assigns six team members (2 per module) clear responsibilities, minimum deliverables, and integration requirements so all workstreams can proceed in parallel and be integrated for the final demo.

---

## Quick instructions for the team structure

* **Team size:** 6 people (you already have this). Divide them into three pairs, one pair per module:

  * **Data & Scraping (2 people)**
  * **ML / Recommendation Engine (2 people)**
  * **UI / UX + Integration (2 people)**

Each pair owns their module end-to-end for the hackathon: implementation, minimum tests, and demo hooks (APIs or files) so other teams can use their output.

---

## High-level recommended approach (one-line)

For the hackathon, use a **lightweight embedding + retrieval pipeline** for ranking (FAISS/Annoy/HNSWlib locally or a managed vector DB if available) and optionally use an **LLM API only for natural-language reranking/explanations**. This is the fastest way to a polished demo while keeping compute low. (Full tradeoffs and decisions are in the ML team section.)

---

# Module A — Data & Scraping (2 people)

**Primary goal:** Produce a clean, normalized dataset of internship listings (CSV/JSON) that the ML team can start using immediately.

### Roles within the pair

* **Scraper / Crawler (Person A1):** Build the scraping pipeline, handle robots.txt/legal checks, and produce raw output.
* **Data Wrangler (Person A2):** Clean, normalize, deduplicate, enrich (geocoding, normalized skills/tags), and produce the final CSV/JSON and sample subset.

### Minimum deliverables (must-haves)

1. **Schema definition file** (schema.json or README) describing each column in the CSV/JSON.
2. **Normalized dataset**: `internships.csv` (CSV preferred for ML team), containing at least the *required fields* below. For hackathon demo a minimum of **50–200** well-formed rows is acceptable; more is better.
3. **Sample JSON** of 10 entries with full fields for fast frontend demo (`sample_internships.json`).
4. **Data quality checks** script: a simple script that validates required fields and outputs counts of missing values.
5. **Data ingest script**: a simple script or notebook `load_to_index.py` that creates embeddings (or plain textual vectors) so ML team can begin.

### Required fields (CSV column names — exact names matter)

* `internship_id` (unique)
* `title`
* `organization`
* `sector_tags` (comma-separated normalized sectors e.g., `agriculture,education,tech`)
* `description` (full text)
* `responsibilities` (text / bullet join)
* `required_qualifications` (text)
* `preferred_skills` (comma-separated)
* `stipend` (number or text like `0`, `5000-10000`)
* `location_city`
* `location_district`
* `location_state`
* `location_pincode` (if available)
* `remote_allowed` (yes/no)
* `duration_weeks` (number)
* `start_date` (ISO `YYYY-MM-DD` or `null`)
* `application_deadline` (ISO or `null`)
* `eligibility_min_qualification` (e.g., `12th`, `UG`, `PG`)
* `url`
* `posted_date` (ISO)
* `source` (site name)

> **Normalization rules:**
>
> * Lowercase all text fields for token uniformity.
> * `preferred_skills` and `sector_tags` must use a team-defined canonical vocabulary (provide a `vocabulary_skills.csv`).

### Bonus (if time):

* Geocode `location_city` -> lat/lon (helps for distance scoring).
* Extract a short `one_line_summary` (80–120 chars) to show on cards (can be generated with simple heuristics or an LLM later).

### Acceptance criteria for integration

* `internships.csv` exists, schema file included, and there is a sample ingestion script that outputs either an embeddings file or a normalized JSON. ML team can load this without manual edits.

### Fallback if PM Internship site scraping fails

* Provide **50–200 synthetic or hand-crafted** internship rows that match the schema (realistic titles, sectors, stipend ranges). This is an explicit requirement — create `fallback_internships.csv` so demo can proceed.
* Optionally, provide scraped data from alternate public sources (e.g., generic job/internship portals or government job listings). Ensure fields map to the schema.

---

# Module B — ML / Recommendation Engine (2 people)

**Primary goal:** Deliver a lightweight recommender that can output **3–5 recommended internships** for any user profile. The model must be explainable, fast, and runnable locally for the hackathon.

### Roles within the pair

* **Model Lead (Person B1):** Design the pipeline, build retrieval and ranking, orchestrate evaluation.
* **Model Engineer / MLOps (Person B2):** Implement indexing (FAISS etc.), build API endpoint(s) for integration, and create evaluation scripts.

### Recommended approach & why (detailed — follow this for hackathon)

1. **Content-based retrieval using embeddings**:

   * Create vector embeddings for each internship using a sentence embedding model (e.g., small open-source Sentence-Transformer or OpenAI embeddings if you choose an API).
   * Index the embeddings using FAISS / HNSWlib / Annoy for fast nearest-neighbor retrieval.
   * For a candidate profile, create an embedding of the *profile text* (concatenate education + skills + sector preferences + location preference) and retrieve top-N (\~20) internships.
2. **Lightweight rule-based reranker** (fast and explainable):

   * Score candidates on simple signals: skill overlap count, qualification fit, location match (exact/near/remote), stipend range, recency/posted\_date.
   * Combine embedding similarity score and rule-based score with tunable weights to produce final ranking.
3. **Optional: LLM-based reranker + explanation (API)**:

   * If you have access to an LLM API, pass the top-20 results and ask the LLM to rerank and provide short human-friendly explanation for the top-5. This gives great demo polish (explanations in local language) with minimal engineering.

**Why this approach?** It is: low-cost, quick to implement, explainable (so judges can follow logic), and performs well when labeled training data is absent.

### Alternatives (and when to pick them)

* **LLM-only via API (prompting):** Fast to prototype; you can ask an LLM to read all internships and pick top-5 for a profile. *Cons:* cost, latency, dependency on external service, less reproducible scoring, privacy concerns if candidate data is sensitive.
* **Supervised ML ranking (requires labels):** If you had historical application data and outcomes, you could build a learning-to-rank model — not realistic for a short hackathon.

### Minimum deliverables (must-haves)

1. **A runnable recommendation function** (script or small API) with the signature: `recommend(profile_json, k=5) -> [internship_id,...]`. This must not require heavy GPU; CPU-friendly.
2. **Index creation script**: `build_index.py` that consumes `internships.csv` and outputs an index (and optionally serialized embeddings file).
3. **Reranking / scoring module** with documented weights in `config.yml`.
4. **Simple REST endpoint** (e.g., `/recommend`) or a Next.js API route that the frontend team can call with a candidate profile and receive JSON results.
5. **Evaluation notebook** that shows qualitative checks (5–10 test profiles with expected outputs) and calculates simple metrics like `precision@5` for any labeled test set you may create.

### Features the model must provide to UI

* For each recommended internship return: `internship_id`, `score`, `match_reasons` (short list like `skills:3/5, qualification:good, location:near`), and `explain_text` (optional human sentence explaining why it was recommended).

### Acceptance criteria

* The endpoint returns 3–5 unique internships for at least 10 different sample profiles.
* The ML module can ingest `internships.csv` produced by Module A without manual changes.

### Evaluation & demo checks

* Create 8–12 **persona** profiles (student, first-generation learner from a village, polytechnic graduate, etc.) and show the model output for each.
* For hackathon judging, prepare short human-readable explanations for the top-3 items for each persona (either auto-generated or hand-curated).

---

# Module C — UI / UX + Integration (2 people)

**Primary goal:** A simple, mobile-friendly interface where a user signs up, fills a short onboarding profile, and receives 3–5 recommended internships displayed as cards.

### Roles within the pair

* **Frontend & UX Designer (Person C1):** Create wireframes, translate them into React components (Next.js recommended), and ensure mobile responsiveness and regional language support.
* **Backend / Integration (Person C2):** Implement authentication (simple), store profiles (DB), build API integrations to ML module, and host demo endpoints.

### Minimum UI pages / screens (must-haves)

1. **Landing / Intro page** — simple hero, quick explanation, start button.
2. **Signup / Login** — basic OTP or email login; keep it minimal (no lengthy KYC). Optionally accept a fallback demo mode without login.
3. **Onboarding / Profile page** — a short multi-step form that captures required fields for matching:

   * education level, major
   * top 3 skills (select or free text)
   * sector interests (select up to 3)
   * preferred location (state/district/remote)
   * availability & duration preference
   * regional language preference
4. **Recommendation page** — show 3–5 cards with: title, org, one-line summary, stipend, location, short match reasons, and a CTA to view details or apply (link to `url`).
5. **Internship detail page** — shows full description, responsibilities, eligibility, and link to apply.
6. **Admin / Data upload page** — simple UI to upload `internships.csv` or trigger the scraper (this can be behind a local-only route for the demo).

### UX & mobile considerations

* Use large buttons, icons, and minimal text (users with low digital literacy). Prefer icons + 1-line labels.
* Provide an option to toggle language (Hindi / English) and keep labels simple.
* Provide a short “Why this was recommended” one-liner under each card.

### Technical stack suggestions (rapid setup)

* **Frontend:** Next.js + React + Tailwind CSS (fast, mobile-friendly). Use simple client-side components.
* **Backend:** Node.js + Express or Next.js API routes. Store data in SQLite or a simple managed Postgres.
* **Vector index / ML:** Either call local ML endpoint or call the ML team’s `/recommend` API.

### Minimum deliverables

1. Working front-end with the pages above and form inputs that map to the candidate JSON shape the ML API expects.
2. Integration with the ML endpoint: a working demo flow `signup -> onboarding -> call /recommend -> show cards`.
3. Local dev instructions (README) to run the front-end and backend and how to point to the sample dataset.

### Accessibility/demo polish

* Add a demo user button (“Try sample profile”) so judges can click without signing up.
* Ensure cards are readable on phone widths.

---

# Data & API contracts (exact JSON shapes)

### Candidate profile JSON (what frontend must send to ML `/recommend`)

```json
{
  "candidate_id": "string",
  "education_level": "UG|PG|12th|Diploma",
  "major": "computer science",
  "skills": ["python","data analysis","sql"],
  "preferred_sectors": ["education","agriculture"],
  "preferred_locations": ["Ahmedabad, Gujarat"],
  "remote_ok": false,
  "availability_start": "YYYY-MM-DD",
  "duration_weeks_pref": 8,
  "language": "hi"
}
```

### Recommendation response (ML -> frontend)

```json
{
  "recommendations": [
    {
      "internship_id": "INT123",
      "score": 0.87,
      "match_reasons": ["skills:3/5","qualification:match","location:near"],
      "explain_text": "Good match because your python and data analysis skills fit the role's data tasks"
    }
  ]
}
```

---

# Integration checklist (what gets demo-ready)

* [ ] Data team provides `internships.csv` + `fallback_internships.csv` and schema.
* [ ] ML team provides `build_index.py` and `/recommend` endpoint (or a local script) that reads candidate JSON and returns top-5.
* [ ] Frontend integrates `/recommend`, displays cards and detail page.
* [ ] Demo personas and one-liners prepared for the judges.
* [ ] Fallback demo mode (no login) so judges can try instantly.

---

# Evaluation ideas for judges (demo talking points)

* Show 3–4 persona flows and how recommendations differ by skill/location.
* Highlight explainability: show `match_reasons` for each recommendation.
* Demonstrate offline fallback (hand-crafted dataset) if live scraping blocked.

---

# Quick notes on privacy & ethics

* Avoid storing sensitive personal data unnecessarily. For the hackathon, user contact fields can be dummy.
* If you call a cloud LLM API with user profile or scraped data, check privacy — anonymize any PII before sending.

---

# Extras you can prepare if time permits

* Small admin dashboard showing where interns clicked/applied (quick analytics).
* Language toggle with simple pre-translated strings for Hindi.
* Export recommendations as a PDF or shareable link.

---

If you want, I can now:

* Convert each module’s deliverables into GitHub issues (one issue per person) OR
* Produce a sample `internships.csv` (50 rows synthetic) that follows the schema so ML & frontend can start immediately.

Tell me which of those two you want and I will produce it next.
