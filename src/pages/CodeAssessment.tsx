
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import CandidateForm from "@/components/assessment/CandidateForm";
import { CandidateData, AssessmentResults } from "@/types/assessment";
import AssessmentResultsView from "@/components/assessment/AssessmentResultsView";

const formSchema = z.object({
  roleName: z.string().min(3, {
    message: "Role name must be at least 3 characters.",
  }),
  assessmentDescription: z.string().min(10, {
    message: "Assessment description must be at least 10 characters.",
  }),
  assessmentLink: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal('')),
  seniorityLevel: z.enum(["junior", "mid", "senior", "lead"], {
    required_error: "Please select a seniority level.",
  }),
});

export default function CodeAssessment() {
  const [candidates, setCandidates] = useState<CandidateData[]>([
    { id: "1", name: "", githubRepo: "", localPath: "", codeAnalyzed: false }
  ]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: "",
      assessmentDescription: "",
      assessmentLink: "",
      seniorityLevel: "mid",
    },
  });

  const addCandidate = () => {
    setCandidates([
      ...candidates, 
      { 
        id: `${candidates.length + 1}`, 
        name: "", 
        githubRepo: "", 
        localPath: "",
        codeAnalyzed: false
      }
    ]);
  };

  const updateCandidate = (id: string, data: Partial<CandidateData>) => {
    setCandidates(
      candidates.map(candidate => 
        candidate.id === id ? { ...candidate, ...data } : candidate
      )
    );
  };

  const removeCandidate = (id: string) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter(candidate => candidate.id !== id));
    } else {
      toast({
        title: "Cannot remove candidate",
        description: "At least one candidate is required for assessment.",
        variant: "destructive",
      });
    }
  };

  const analyzeCode = async (formData: z.infer<typeof formSchema>) => {
    setIsAnalyzing(true);
    
    try {
      // Simulate code analysis process
      // In a real implementation, this would connect to your backend service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults: AssessmentResults = {
        assessmentInfo: {
          roleName: formData.roleName,
          seniorityLevel: formData.seniorityLevel,
          assessmentDescription: formData.assessmentDescription,
          assessmentLink: formData.assessmentLink || undefined,
        },
        candidateResults: candidates.map(candidate => ({
          candidateId: candidate.id,
          candidateName: candidate.name,
          scores: {
            readability: Math.floor(Math.random() * 41) + 60, // 60-100
            extensibility: Math.floor(Math.random() * 41) + 60,
            testability: Math.floor(Math.random() * 41) + 60,
            originalityScore: Math.floor(Math.random() * 41) + 60,
            overallScore: 0, // Will be calculated
            seniorityFit: Math.floor(Math.random() * 41) + 60,
          },
          feedback: [
            "Good use of design patterns",
            "Could improve documentation",
            "Test coverage is adequate",
          ],
          strengths: ["Code organization", "Performance optimization"],
          areasToImprove: ["Error handling", "Edge case coverage"],
        })),
      };
      
      // Calculate overall scores and sort by best match
      mockResults.candidateResults = mockResults.candidateResults.map(result => {
        const { readability, extensibility, testability, seniorityFit, originalityScore } = result.scores;
        result.scores.overallScore = Math.round((readability + extensibility + testability + seniorityFit + originalityScore) / 5);
        return result;
      }).sort((a, b) => b.scores.overallScore - a.scores.overallScore);
      
      setAssessmentResults(mockResults);
      setShowResults(true);
      
      toast({
        title: "Analysis Complete",
        description: `${candidates.length} candidate code submissions analyzed.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Validate that at least one candidate has repo or local path
    const validCandidates = candidates.filter(
      c => (c.githubRepo && c.githubRepo.trim() !== '') || 
           (c.localPath && c.localPath.trim() !== '')
    );
    
    if (validCandidates.length === 0) {
      toast({
        title: "Missing Code Source",
        description: "At least one candidate must have a GitHub repo or local path.",
        variant: "destructive",
      });
      return;
    }
    
    analyzeCode(data);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Code Assessment Tool
      </h1>
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Frontend Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seniorityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seniority Level</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        {...field}
                      >
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Technical Lead</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="assessmentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the assessment task and requirements..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assessmentLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Link (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://github.com/organization/assessment-repo" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Candidates</h2>
              
              {candidates.map((candidate) => (
                <CandidateForm
                  key={candidate.id}
                  candidate={candidate}
                  updateCandidate={updateCandidate}
                  removeCandidate={removeCandidate}
                  isRemovable={candidates.length > 1}
                />
              ))}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={addCandidate}
                className="mt-4"
              >
                Add Another Candidate
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Code"}
            </Button>
          </form>
        </Form>
      </Card>
      
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Results</DialogTitle>
          </DialogHeader>
          {assessmentResults && <AssessmentResultsView results={assessmentResults} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
