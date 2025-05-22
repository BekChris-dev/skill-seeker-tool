
export interface CandidateData {
  id: string;
  name: string;
  githubRepo: string;
  localPath: string;
  codeAnalyzed: boolean;
}

export interface AssessmentScores {
  readability: number;
  extensibility: number;
  testability: number;
  originalityScore: number;
  seniorityFit: number;
  overallScore: number;
}

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  scores: AssessmentScores;
  feedback: string[];
  strengths: string[];
  areasToImprove: string[];
}

export interface AssessmentInfo {
  roleName: string;
  seniorityLevel: string;
  assessmentDescription: string;
  assessmentLink?: string;
}

export interface AssessmentResults {
  assessmentInfo: AssessmentInfo;
  candidateResults: CandidateResult[];
}
