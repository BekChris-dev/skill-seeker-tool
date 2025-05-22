
import { toast } from "@/hooks/use-toast";
import { AssessmentInfo, CandidateData, CandidateResult } from "@/types/assessment";

// API key management - in a production app, this would be handled through environment variables
// and proper backend authentication
let apiKey = '';

export const setApiKey = (key: string) => {
  apiKey = key;
};

export const getApiKey = () => {
  return apiKey;
};

// Function to analyze code using the LLM API
export const analyzeCode = async (
  candidates: CandidateData[],
  assessmentInfo: AssessmentInfo
): Promise<CandidateResult[]> => {
  if (!apiKey) {
    throw new Error("API key not set. Please provide an API key.");
  }

  const results: CandidateResult[] = [];

  for (const candidate of candidates) {
    try {
      console.log(`Starting analysis for candidate: ${candidate.name}`);
      
      // Skip candidates with no code source
      if ((!candidate.githubRepo || candidate.githubRepo.trim() === '') &&
          (!candidate.localPath || candidate.localPath.trim() === '')) {
        console.log(`Skipping candidate ${candidate.name} - no code source provided`);
        continue;
      }
      
      // Get code content based on source (GitHub or local)
      console.log(`Fetching code content for ${candidate.name}`);
      const codeContent = await fetchCodeContent(candidate);
      console.log(`Code content fetched, length: ${codeContent.length} characters`);
      
      if (!codeContent || codeContent.trim() === '') {
        throw new Error("No code content could be retrieved.");
      }
      
      // Prepare prompt for LLM analysis
      const prompt = generateAnalysisPrompt(codeContent, assessmentInfo);
      
      // Call LLM API with the prompt
      console.log(`Calling LLM API for ${candidate.name}...`);
      const analysisResult = await callLLMApi(prompt);
      console.log(`LLM API response received for ${candidate.name}`);
      
      // Parse the LLM response into our candidate result format
      const candidateResult = parseLLMResponse(analysisResult, candidate);
      results.push(candidateResult);
    } catch (error) {
      console.error(`Error analyzing code for candidate ${candidate.name}:`, error);
      toast({
        title: `Analysis failed for ${candidate.name}`,
        description: error instanceof Error ? error.message : "Could not analyze the code. Please try again.",
        variant: "destructive",
      });
    }
  }

  // If no results were obtained, throw an error
  if (results.length === 0) {
    throw new Error("No valid analysis results were obtained. Please check your inputs and API key.");
  }

  // Sort by overall score (highest first)
  return results.sort((a, b) => b.scores.overallScore - a.scores.overallScore);
};

// Helper function to fetch code content from GitHub or local path
const fetchCodeContent = async (candidate: CandidateData): Promise<string> => {
  if (candidate.githubRepo && candidate.githubRepo.trim() !== '') {
    return await fetchGitHubRepository(candidate.githubRepo);
  } else if (candidate.localPath && candidate.localPath.trim() !== '') {
    return await readLocalFiles(candidate.localPath);
  }
  throw new Error("No valid code source provided for the candidate.");
};

// Function to fetch code from GitHub repository
const fetchGitHubRepository = async (repoUrl: string): Promise<string> => {
  // Extract owner and repo name from GitHub URL
  const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = repoUrl.match(urlPattern);
  
  if (!match || match.length < 3) {
    throw new Error("Invalid GitHub repository URL");
  }
  
  const [, owner, repo] = match;
  
  try {
    // Use GitHub API to get repository content
    // Note: This is a simplified implementation and would need proper pagination for larger repos
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Fetch file contents (limited to reasonable size)
    let codeContent = '';
    for (const file of data) {
      if (file.type === 'file' && isCodeFile(file.name)) {
        const fileResponse = await fetch(file.download_url);
        const fileContent = await fileResponse.text();
        codeContent += `\n// File: ${file.path}\n${fileContent}\n`;
      }
    }
    
    return codeContent;
  } catch (error) {
    console.error("Error fetching GitHub repository:", error);
    throw new Error("Failed to fetch code from GitHub repository");
  }
};

// Function to read local files
const readLocalFiles = async (localPath: string): Promise<string> => {
  // In a real implementation, this would use the File System Access API
  // For now, we'll just mock the response since we can't actually access local files
  console.log(`Attempting to read files from local path: ${localPath}`);
  return `// Mock content for local path: ${localPath}\n// In a real implementation, we would read actual files here.`;
};

// Check if file is a code file we should analyze
const isCodeFile = (filename: string): boolean => {
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php'];
  return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Generate a prompt for the LLM to analyze the code
const generateAnalysisPrompt = (codeContent: string, assessmentInfo: AssessmentInfo): string => {
  return `
    As a coding expert, please analyze the following code submission for a ${assessmentInfo.roleName} position at ${assessmentInfo.seniorityLevel} level.
    
    Assessment description: ${assessmentInfo.assessmentDescription}
    
    Analyze the code for:
    1. Readability (variable names, comments, consistent style)
    2. Extensibility (architecture, patterns, modularity)
    3. Testability (separation of concerns, dependency injection, pure functions)
    4. Originality vs AI-generated appearance
    5. Seniority fit for a ${assessmentInfo.seniorityLevel} role
    
    Code:
    ${codeContent}
    
    Provide scores from 0-100 for each category and detailed feedback including strengths and areas to improve.
    Format your response as JSON with the following structure:
    {
      "scores": {
        "readability": number,
        "extensibility": number,
        "testability": number,
        "originalityScore": number,
        "seniorityFit": number,
        "overallScore": number
      },
      "feedback": ["point 1", "point 2", ...],
      "strengths": ["strength 1", "strength 2", ...],
      "areasToImprove": ["area 1", "area 2", ...]
    }
  `;
};

// Call the LLM API with the prepared prompt
const callLLMApi = async (prompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key not provided");
  }

  // Example using OpenAI API - replace with your preferred LLM provider
  try {
    console.log("Making OpenAI API request...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    console.log("OpenAI API Response Status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || response.statusText || 'Unknown API error';
      console.error("OpenAI API Error:", errorData);
      throw new Error(`API request failed: ${errorMessage}`);
    }

    const data = await response.json();
    console.log("OpenAI API Response:", data);
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response content received from API");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling LLM API:", error);
    throw error instanceof Error 
      ? error 
      : new Error("Failed to analyze code with LLM: Unknown error");
  }
};

// Parse the LLM response into our CandidateResult format
const parseLLMResponse = (llmResponse: string, candidate: CandidateData): CandidateResult => {
  try {
    console.log("Parsing LLM response:", llmResponse.substring(0, 100) + "...");
    
    // Extract JSON from the response (in case the LLM wraps it in text)
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : llmResponse;
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonStr);
      console.log("Successfully parsed JSON response");
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      throw new Error("Failed to parse LLM response as JSON");
    }
    
    // Ensure all required fields exist, providing defaults if missing
    const result: CandidateResult = {
      candidateId: candidate.id,
      candidateName: candidate.name || `Candidate ${candidate.id}`,
      scores: {
        readability: parsedResponse.scores?.readability || 0,
        extensibility: parsedResponse.scores?.extensibility || 0,
        testability: parsedResponse.scores?.testability || 0,
        originalityScore: parsedResponse.scores?.originalityScore || 0,
        seniorityFit: parsedResponse.scores?.seniorityFit || 0,
        overallScore: parsedResponse.scores?.overallScore || 0,
      },
      feedback: Array.isArray(parsedResponse.feedback) ? parsedResponse.feedback : ["No detailed feedback provided"],
      strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths : ["No strengths identified"],
      areasToImprove: Array.isArray(parsedResponse.areasToImprove) ? parsedResponse.areasToImprove : ["No areas to improve identified"],
    };
    
    // Calculate overall score if not provided by LLM
    if (!parsedResponse.scores?.overallScore) {
      const { readability, extensibility, testability, seniorityFit, originalityScore } = result.scores;
      result.scores.overallScore = Math.round((readability + extensibility + testability + seniorityFit + originalityScore) / 5);
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    
    // Return a fallback result if parsing fails
    return {
      candidateId: candidate.id,
      candidateName: candidate.name || `Candidate ${candidate.id}`,
      scores: {
        readability: 50,
        extensibility: 50,
        testability: 50,
        originalityScore: 50,
        seniorityFit: 50,
        overallScore: 50,
      },
      feedback: ["Failed to parse LLM analysis results"],
      strengths: ["Could not determine strengths"],
      areasToImprove: ["Could not determine areas for improvement"],
    };
  }
};
