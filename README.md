# Curriculum Gap Analyzer

Find out what your syllabus is missing before your students do.

Upload a bootcamp or university curriculum, pick a target role, and instantly see which skills employers are hiring for that your program doesn't cover — powered by live job data and AI analysis.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## How It Works

### 1. Upload your curriculum

Paste your syllabus or drag-and-drop a PDF, DOCX, CSV, or TXT file.

<p align="center">
  <img src="screenshots/step1-upload.png" alt="Step 1 — Upload curriculum with drag-and-drop or paste" width="720" />
</p>

### 2. Search for a target role

Enter a job title and location to pull real job listings from LinkedIn, Indeed, Glassdoor, and more.

<p align="center">
  <img src="screenshots/step2-search.png" alt="Step 2 — Search for job postings by role and location" width="720" />
</p>

### 3. Get your gap report

The AI compares your curriculum against job postings and delivers a full breakdown: coverage score, demand chart, categorized skill lists, and actionable recommendations.

<p align="center">
  <img src="screenshots/results-dashboard.png" alt="Step 3 — Analysis dashboard with scores, chart, skills, and recommendations" width="720" />
</p>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) + React 19 |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| AI | [Anthropic API](https://docs.anthropic.com/) for skill extraction and gap analysis |
| Job Data | [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) via RapidAPI |
| Charts | [Recharts](https://recharts.org/) |
| File Parsing | pdf-parse, mammoth, csv-parse |

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A [RapidAPI key](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) with JSearch enabled (free tier: 200 requests/month)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd curriculum-gap-analyser

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Open `.env.local` and add your keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
RAPIDAPI_KEY=your-rapidapi-key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                # Root layout + theme provider
│   ├── page.tsx                  # 4-step wizard (input → search → analyze → results)
│   ├── globals.css               # Theme tokens + Tailwind config
│   └── api/
│       ├── analyze/route.ts      # Sends curriculum + jobs to AI for gap analysis
│       ├── jobs/route.ts         # Fetches job postings from JSearch
│       └── parse/route.ts        # Extracts text from uploaded files
├── components/
│   ├── curriculum-input.tsx      # Drag-and-drop upload + text area
│   ├── job-search-form.tsx       # Role/location search with job preview
│   ├── analysis-dashboard.tsx    # Full results view with scores + export
│   ├── skill-gap-chart.tsx       # Horizontal bar chart (covered vs. missing)
│   ├── skill-list.tsx            # Color-coded skill badges by category
│   ├── theme-provider.tsx        # Dark/light mode provider
│   ├── theme-toggle.tsx          # Theme switch button
│   └── ui/                       # shadcn/ui primitives
├── lib/
│   ├── analysis.ts               # AI prompt engineering + response parsing
│   ├── jobs.ts                   # JSearch API client + country detection
│   ├── parser.ts                 # PDF / DOCX / CSV / TXT extraction
│   └── utils.ts                  # Tailwind merge utility
└── types/
    └── index.ts                  # Shared TypeScript interfaces
```

## How the Analysis Works

The app sends your curriculum text and fetched job descriptions to the Anthropic API in a single structured prompt. The AI:

1. Extracts skills from the curriculum and categorizes them (languages, frameworks, tools, databases, cloud, concepts, soft skills)
2. Extracts required and preferred skills from each job posting and tracks how many postings mention each one
3. Compares the two lists to classify every skill as **Covered**, **Missing**, or **Bonus**
4. Calculates a weighted coverage score based on skill demand frequency
5. Generates targeted recommendations for curriculum improvement

## Notes

- **International job search**: JSearch's free tier primarily indexes US jobs. The app includes automatic country detection and will fall back to broader results for non-US locations.
- **Best results**: Detailed curricula work best — week-by-week breakdowns, topic lists, and learning outcomes give the AI more to work with.
- **File formats**: PDF, DOCX, CSV, and plain text are all supported via drag-and-drop or file picker.

## License

MIT
