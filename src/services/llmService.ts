import { toast } from "@/hooks/use-toast";
import { AssessmentInfo, CandidateData, CandidateResult } from "@/types/assessment";

// API key management - in a production app, this would be handled through environment variables
// and proper backend authentication
let apiKey = '';
let selectedModel = 'gpt-4o'; // Default to GPT-4o
let demoMode = false; // Demo mode flag

export const setApiKey = (key: string) => {
  apiKey = key;
  console.log("API key set:", key ? "Key provided (length: " + key.length + ")" : "No key");
};

export const getApiKey = () => {
  return apiKey;
};

export const setModel = (model: string) => {
  selectedModel = model;
  console.log("Model set to:", model);
};

export const getModel = () => {
  return selectedModel;
};

// Demo mode management
export const setDemoMode = (enabled: boolean) => {
  demoMode = enabled;
  console.log("Demo mode set to:", enabled);
};

export const isDemoMode = () => {
  return demoMode;
};

// Available models for fallback strategy
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model, best quality but highest cost' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Good balance of capability and cost' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fastest and most affordable option' }
];

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
  // Check if demo mode is enabled, if so return mock results
  if (demoMode) {
    console.log("Demo mode is enabled, returning mock results");
    return generateMockResults(candidates, assessmentInfo);
  }

  if (!apiKey) {
    throw new Error("API key not set. Please provide an API key or enable Demo Mode.");
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
      
      // Try with the selected model first, then fall back to less expensive models if needed
      let analysisResult;
      try {
        analysisResult = await callLLMApi(prompt, selectedModel);
      } catch (apiError: any) {
        // Handle quota exceeded or model access errors specifically
        if (apiError?.message?.includes("quota exceeded") || apiError?.message?.includes("rate limit")) {
          console.log(`Quota exceeded for ${selectedModel}, trying fallback models...`);
          
          // If using gpt-4o and it fails, try gpt-4o-mini
          if (selectedModel === 'gpt-4o') {
            toast({
              title: "Model fallback initiated",
              description: "Quota exceeded for GPT-4o, falling back to GPT-4o Mini",
            });
            try {
              analysisResult = await callLLMApi(prompt, 'gpt-4o-mini');
            } catch (fallbackError: any) {
              // If gpt-4o-mini fails too, try gpt-3.5-turbo as last resort
              if (fallbackError?.message?.includes("quota exceeded") || fallbackError?.message?.includes("rate limit")) {
                toast({
                  title: "Model fallback initiated",
                  description: "Trying GPT-3.5 Turbo as last resort",
                });
                analysisResult = await callLLMApi(prompt, 'gpt-3.5-turbo');
              } else {
                throw fallbackError;
              }
            }
          }
          // If using gpt-4o-mini and it fails, try gpt-3.5-turbo
          else if (selectedModel === 'gpt-4o-mini') {
            toast({
              title: "Model fallback initiated",
              description: "Quota exceeded for GPT-4o Mini, falling back to GPT-3.5 Turbo",
            });
            analysisResult = await callLLMApi(prompt, 'gpt-3.5-turbo');
          } else {
            // No more fallbacks available
            throw new Error(
              "API quota exceeded for all available models. Please check your OpenAI billing status or try again later."
            );
          }
        } else if (apiError?.message?.includes("does not exist") || apiError?.message?.includes("model_not_found")) {
          throw new Error(
            "Your OpenAI account doesn't have access to the requested model. Please try a different model or request access from OpenAI."
          );
        } else {
          // Re-throw other errors
          throw apiError;
        }
      }
      
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

// Generate mock results for demo mode
const generateMockResults = (
  candidates: CandidateData[],
  assessmentInfo: AssessmentInfo
): CandidateResult[] => {
  console.log("Generating mock results for", candidates.length, "candidates");
  
  // Mock data for strengths, areas to improve, and feedback
  const mockStrengths = [
    "Clean, consistent code formatting throughout the codebase",
    "Good separation of concerns with components and services",
    "Effective use of TypeScript for type safety",
    "Well-structured architecture that follows industry best practices",
    "Comprehensive error handling with user-friendly messages",
    "Good use of React hooks and functional components",
    "Thorough documentation and comments explaining complex logic"
  ];
  
  const mockAreasToImprove = [
    "Consider adding more automated tests to improve coverage",
    "Some components could be broken down into smaller, reusable pieces",
    "State management could be more centralized to avoid prop drilling",
    "Some functions are overly complex and could be simplified",
    "Documentation could be improved in some areas",
    "Consider adding performance optimizations for large data sets",
    "Error handling could be more comprehensive in edge cases"
  ];
  
  const mockFeedback = [
    "The code demonstrates a good understanding of modern web development practices",
    "The use of TypeScript enhances code maintainability and helps catch potential errors",
    "The architecture is scalable and would work well for larger applications",
    "The UI components are well-designed and provide a good user experience",
    "Code organization follows logical patterns making it easy to navigate",
    "Error states are handled gracefully with clear user feedback",
    "The codebase shows attention to detail and care for user experience"
  ];
  
  // Create mock results for each candidate
  return candidates.map((candidate, index) => {
    // Generate random scores that make sense for the candidate's index
    // First candidates get better scores in demo mode
    const baseScore = Math.max(65, 95 - (index * 10));
    const randomVariation = (score: number) => Math.min(100, Math.max(0, score + Math.floor(Math.random() * 10) - 5));
    
    const readability = randomVariation(baseScore);
    const extensibility = randomVariation(baseScore - 2);
    const testability = randomVariation(baseScore - 5);
    const originalityScore = randomVariation(baseScore);
    const seniorityFit = randomVariation(baseScore + 3);
    
    // Calculate overall score
    const overallScore = Math.round(
      (readability + extensibility + testability + originalityScore + seniorityFit) / 5
    );
    
    // Select random items from the mock data arrays
    const getRandomItems = (items: string[], count: number) => {
      const shuffled = [...items].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    
    // Return the mock candidate result
    return {
      candidateId: candidate.id,
      candidateName: candidate.name || `Candidate ${candidate.id}`,
      scores: {
        readability,
        extensibility,
        testability,
        originalityScore,
        seniorityFit,
        overallScore
      },
      feedback: getRandomItems(mockFeedback, 3 + Math.floor(Math.random() * 2)),
      strengths: getRandomItems(mockStrengths, 3 + Math.floor(Math.random() * 2)),
      areasToImprove: getRandomItems(mockAreasToImprove, 3 + Math.floor(Math.random() * 2))
    };
  }).sort((a, b) => b.scores.overallScore - a.scores.overallScore); // Sort by overall score
};

// Generate a prompt for the LLM to analyze the GitHub repository directly
const generateAnalysisPrompt = (codeSource: string, assessmentInfo: AssessmentInfo): string => {
  const isGitHubUrl = codeSource.includes('github.com');

  return `
    As a coding expert, please analyze the following ${isGitHubUrl ? 'GitHub repository' : 'code'} for a ${assessmentInfo.roleName} position at ${assessmentInfo.seniorityLevel} level.
    
    Assessment description: ${assessmentInfo.assessmentDescription || "No specific assessment description provided"}
    
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
const callLLMApi = async (prompt: string, model: string = 'gpt-4o'): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key not provided");
  }

  // Example using OpenAI API - replace with your preferred LLM provider
  try {
    console.log(`Making OpenAI API request using model: ${model}...`);
    
    // For debugging - log the request body (excluding the full prompt for security)
    console.log("Request details:", {
      model,
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
        model,
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
          
          // Enhanced error handling with specific user-friendly messages
          if (errorMessage.includes("Incorrect API key")) {
            throw new Error("Invalid API key. Please check your OpenAI API key and try again.");
          } else if (errorMessage.includes("You exceeded your current quota")) {
            // Improved quota exceeded message
            throw new Error(
              "OpenAI API quota exceeded. Please check your billing information or add credits to your OpenAI account."
            );
          } else if (errorMessage.includes("model_not_found") || errorMessage.includes("does not exist")) {
            throw new Error(
              `Your OpenAI account doesn't have access to the ${model} model. Please use a different model or request access from OpenAI.`
            );
          } else if (response.status === 429) {
            // Enhanced rate limit message
            throw new Error(
              "Rate limit exceeded. Please try again in a few moments or consider upgrading your OpenAI account for higher rate limits."
            );
          } else if (errorMessage.includes("billing") || errorMessage.includes("payment")) {
            throw new Error(
              "There's an issue with your OpenAI billing. Please check your payment details in your OpenAI account."
            );
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
