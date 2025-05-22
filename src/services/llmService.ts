
import { toast } from "@/hooks/use-toast";
import { AssessmentInfo, CandidateData, CandidateResult } from "@/types/assessment";

// API key management - in a production app, this would be handled through environment variables
// and proper backend authentication
let apiKey = '';

export const setApiKey = (key: string) => {
  apiKey = key;
  console.log("API key set:", key ? "Key provided (length: " + key.length + ")" : "No key");
};

export const getApiKey = () => {
  return apiKey;
};

// Check if API key seems valid in format
export const validateApiKey = (key: string): boolean => {
  // OpenAI API keys usually start with "sk-" and have a specific format/length
  return key.trim().startsWith('sk-') && key.trim().length > 20;
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
      
      // Determine the code source
      let codeSource: string;
      if (candidate.githubRepo && candidate.githubRepo.trim() !== '') {
        console.log(`Using GitHub repository URL for ${candidate.name}: ${candidate.githubRepo}`);
        codeSource = candidate.githubRepo;
      } else if (candidate.localPath && candidate.localPath.trim() !== '') {
        console.log(`Using local path for ${candidate.name}: ${candidate.localPath}`);
        codeSource = `Local path: ${candidate.localPath}`;
      } else {
        throw new Error("No valid code source provided for the candidate.");
      }
      
      // Call LLM API with the GitHub URL or local path directly
      console.log(`Calling LLM API for ${candidate.name}...`);
      const prompt = generateAnalysisPrompt(codeSource, assessmentInfo);
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

// Generate a prompt for the LLM to analyze the GitHub repository directly
const generateAnalysisPrompt = (codeSource: string, assessmentInfo: AssessmentInfo): string => {
  const isGitHubUrl = codeSource.includes('github.com');

  return `
    As a coding expert, please analyze the following ${isGitHubUrl ? 'GitHub repository' : 'code'} for a ${assessmentInfo.roleName} position at ${assessmentInfo.seniorityLevel} level.
    
    Assessment description: ${assessmentInfo.assessmentDescription}
    
    ${isGitHubUrl ? 'GitHub Repository URL:' : 'Code Source:'} ${codeSource}
    
    ${isGitHubUrl ? 
    `Please browse the repository contents directly. If this is a specific branch or pull request URL, please examine that specific code.
    Look through the code files, focusing on the main application logic, and ignoring build artifacts, dependencies, and non-code files.` : 
    'Please analyze the provided code.'}
    
    Analyze the code for:
    1. Readability (variable names, comments, consistent style)
    2. Extensibility (architecture, patterns, modularity)
    3. Testability (separation of concerns, dependency injection, pure functions)
    4. Originality vs AI-generated appearance
    5. Seniority fit for a ${assessmentInfo.seniorityLevel} role
    
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
    
    // For debugging - log the request body (excluding the full prompt for security)
    console.log("Request details:", {
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2000,
      apiKeyProvided: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyFormat: apiKey.startsWith('sk-') ? 'starts with sk-' : 'invalid format'
    });
    
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
      // Log more details about the error
      let errorMessage = `API request failed with status ${response.status}`;
      let errorData = null;
      
      try {
        errorData = await response.json();
        console.error("OpenAI API Error Details:", errorData);
        
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
          
          // Specific error handling based on common issues
          if (errorMessage.includes("Incorrect API key")) {
            throw new Error("Invalid API key. Please check your OpenAI API key and try again.");
          } else if (errorMessage.includes("You exceeded your current quota")) {
            throw new Error("OpenAI API quota exceeded. Please check your billing information.");
          } else if (errorMessage.includes("model_not_found") || errorMessage.includes("does not exist")) {
            throw new Error("Your OpenAI account doesn't have access to the GPT-4o model. Please use a different model or request access.");
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          }
        }
      } catch (jsonError) {
        // If we can't parse the error as JSON, use the status text
        console.error("Error parsing API error response:", jsonError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("OpenAI API Response structure:", Object.keys(data));
    
    if (!data.choices || data.choices.length === 0) {
      console.error("Invalid API response format:", data);
      throw new Error("No response content received from API. Invalid response format.");
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
