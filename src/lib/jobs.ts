import { JobPosting, JobSearchParams } from "@/types";

const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

async function fetchJobs(
  apiKey: string,
  query: string,
  numPages: number,
  country?: string,
): Promise<JobPosting[]> {
  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", String(numPages));
  url.searchParams.set("date_posted", "all");
  if (country) {
    url.searchParams.set("country", country);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`JSearch API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return (data.data || []).map((job: Record<string, string>) => ({
    title: job.job_title || "Untitled",
    company: job.employer_name || "Unknown",
    location: job.job_city
      ? `${job.job_city}, ${job.job_state || ""} ${job.job_country || ""}`.trim()
      : job.job_country || "Remote",
    description: job.job_description || "",
    url: job.job_apply_link || job.job_google_link || undefined,
  }));
}

// Map common cities/countries to JSearch country codes
const COUNTRY_HINTS: Record<string, string> = {
  australia: "au", sydney: "au", melbourne: "au", brisbane: "au", perth: "au", adelaide: "au",
  uk: "gb", london: "gb", manchester: "gb", birmingham: "gb", edinburgh: "gb", england: "gb",
  canada: "ca", toronto: "ca", vancouver: "ca", montreal: "ca", ottawa: "ca",
  india: "in", bangalore: "in", mumbai: "in", delhi: "in", hyderabad: "in", pune: "in",
  germany: "de", berlin: "de", munich: "de", frankfurt: "de",
  france: "fr", paris: "fr",
  singapore: "sg",
  japan: "jp", tokyo: "jp",
};

function detectCountry(location: string): string | undefined {
  const lower = location.toLowerCase().trim();
  for (const [hint, code] of Object.entries(COUNTRY_HINTS)) {
    if (lower.includes(hint)) return code;
  }
  return undefined;
}

export async function searchJobs(params: JobSearchParams): Promise<JobPosting[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY environment variable is not set");
  }

  const numPages = params.numPages || 1;
  const fullQuery = `${params.query} ${params.location}`.trim();
  const country = detectCountry(params.location);

  // Try with location + country first
  let jobs = await fetchJobs(apiKey, fullQuery, numPages, country);

  // If no results, retry without location (JSearch has limited intl coverage)
  if (jobs.length === 0 && params.location.trim()) {
    jobs = await fetchJobs(apiKey, params.query, numPages);
  }

  return jobs;
}
