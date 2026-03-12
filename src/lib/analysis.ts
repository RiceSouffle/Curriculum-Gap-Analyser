import Anthropic from "@anthropic-ai/sdk";
import { AnalysisRequest, AnalysisResult } from "@/types";

const client = new Anthropic();

export async function analyzeGap(request: AnalysisRequest): Promise<AnalysisResult> {
  const jobDescriptions = request.jobPostings
    .map(
      (job, i) =>
        `--- Job ${i + 1}: ${job.title} at ${job.company} ---\n${job.description.slice(0, 3000)}`
    )
    .join("\n\n");

  const prompt = `You are an expert curriculum analyst. Analyze the gap between an educational curriculum and real job market demands.

## Curriculum Content:
${request.curriculumText.slice(0, 10000)}

## Job Postings (${request.jobPostings.length} postings):
${jobDescriptions.slice(0, 30000)}

## Instructions:
1. Extract all technical and professional skills from the CURRICULUM. Categorize each as: languages, frameworks, tools, concepts, databases, cloud, soft_skills, or other.
2. Extract all required and preferred skills from the JOB POSTINGS. Track how many postings mention each skill.
3. Compare the two lists to find:
   - COVERED: Skills in both curriculum and jobs
   - MISSING: Skills employers want but the curriculum doesn't teach
   - BONUS: Skills the curriculum teaches but employers rarely ask for
4. Calculate a coverage score (0-100) = (covered skills weighted by frequency) / (total job skills weighted by frequency) * 100
5. Provide 5-8 specific, actionable recommendations for improving the curriculum.

Respond with ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "curriculumSkills": [{"name": "string", "category": "string"}],
  "jobSkills": [{"name": "string", "category": "string", "frequency": number_0_to_1, "isRequired": boolean}],
  "coveredSkills": [{"name": "string", "category": "string", "frequency": number_0_to_1, "isRequired": boolean}],
  "missingSkills": [{"name": "string", "category": "string", "frequency": number_0_to_1, "isRequired": boolean}],
  "bonusSkills": [{"name": "string", "category": "string"}],
  "coverageScore": number_0_to_100,
  "recommendations": ["string"],
  "totalJobsAnalyzed": ${request.jobPostings.length}
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const result: AnalysisResult = JSON.parse(text);
    return result;
  } catch {
    // Try to extract JSON from the response if it has extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse analysis response as JSON");
  }
}
