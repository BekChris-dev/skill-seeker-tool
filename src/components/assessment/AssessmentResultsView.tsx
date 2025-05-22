
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssessmentResults, CandidateResult } from "@/types/assessment";
import ScoreGauge from "@/components/assessment/ScoreGauge";

interface AssessmentResultsViewProps {
  results: AssessmentResults;
}

const AssessmentResultsView: React.FC<AssessmentResultsViewProps> = ({ results }) => {
  const [selectedTab, setSelectedTab] = useState("summary");
  
  return (
    <div className="space-y-6">
      {/* Assessment Info */}
      <Card>
        <CardHeader>
          <CardTitle>{results.assessmentInfo.roleName}</CardTitle>
          <CardDescription>
            Seniority Level: {results.assessmentInfo.seniorityLevel.charAt(0).toUpperCase() + results.assessmentInfo.seniorityLevel.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2">{results.assessmentInfo.assessmentDescription}</p>
          {results.assessmentInfo.assessmentLink && (
            <p className="text-sm text-muted-foreground">
              Reference: <a href={results.assessmentInfo.assessmentLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{results.assessmentInfo.assessmentLink}</a>
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="details">Individual Details</TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4 pt-4">
          <h3 className="text-xl font-semibold">Ranking</h3>
          
          <div className="grid gap-4">
            {results.candidateResults.map((candidate, index) => (
              <Card key={candidate.candidateId} className={
                index === 0 ? "border-2 border-primary" : ""
              }>
                <CardHeader className={`pb-2 ${index === 0 ? "bg-primary/5" : ""}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      #{index + 1}: {candidate.candidateName || `Candidate ${candidate.candidateId}`}
                    </CardTitle>
                    <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
                      {candidate.scores.overallScore}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-2">
                    <ScoreGauge label="Readability" score={candidate.scores.readability} />
                    <ScoreGauge label="Extensibility" score={candidate.scores.extensibility} />
                    <ScoreGauge label="Testability" score={candidate.scores.testability} />
                    <ScoreGauge label="Originality" score={candidate.scores.originalityScore} />
                    <ScoreGauge label="Seniority Fit" score={candidate.scores.seniorityFit} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Comparison Tab */}
        <TabsContent value="comparison" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Readability</TableHead>
                    <TableHead>Extensibility</TableHead>
                    <TableHead>Testability</TableHead>
                    <TableHead>Originality</TableHead>
                    <TableHead>Seniority Fit</TableHead>
                    <TableHead>Overall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.candidateResults.map((candidate) => (
                    <TableRow key={candidate.candidateId}>
                      <TableCell className="font-medium">
                        {candidate.candidateName || `Candidate ${candidate.candidateId}`}
                      </TableCell>
                      <TableCell>{candidate.scores.readability}%</TableCell>
                      <TableCell>{candidate.scores.extensibility}%</TableCell>
                      <TableCell>{candidate.scores.testability}%</TableCell>
                      <TableCell>{candidate.scores.originalityScore}%</TableCell>
                      <TableCell>{candidate.scores.seniorityFit}%</TableCell>
                      <TableCell className="font-bold">{candidate.scores.overallScore}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Individual Details Tab */}
        <TabsContent value="details" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue={results.candidateResults[0]?.candidateId}>
                <TabsList className="mb-4">
                  {results.candidateResults.map((candidate) => (
                    <TabsTrigger key={candidate.candidateId} value={candidate.candidateId}>
                      {candidate.candidateName || `Candidate ${candidate.candidateId}`}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {results.candidateResults.map((candidate) => (
                  <TabsContent key={candidate.candidateId} value={candidate.candidateId} className="space-y-6">
                    <CandidateDetailView candidate={candidate} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Individual candidate detail view
const CandidateDetailView: React.FC<{ candidate: CandidateResult }> = ({ candidate }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ScoreGauge label="Readability" score={candidate.scores.readability} />
        <ScoreGauge label="Extensibility" score={candidate.scores.extensibility} />
        <ScoreGauge label="Testability" score={candidate.scores.testability} />
        <ScoreGauge label="Originality" score={candidate.scores.originalityScore} />
        <ScoreGauge label="Seniority Fit" score={candidate.scores.seniorityFit} />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {candidate.strengths.map((strength, index) => (
                <li key={index} className="text-sm">{strength}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {candidate.areasToImprove.map((area, index) => (
                <li key={index} className="text-sm">{area}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {candidate.feedback.map((feedback, index) => (
              <li key={index}>{feedback}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentResultsView;
