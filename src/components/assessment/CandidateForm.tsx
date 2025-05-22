
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CandidateData } from "@/types/assessment";
import { X, Folder, Github, GitBranch, GitPullRequest } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CandidateFormProps {
  candidate: CandidateData;
  updateCandidate: (id: string, data: Partial<CandidateData>) => void;
  removeCandidate: (id: string) => void;
  isRemovable: boolean;
}

const CandidateForm: React.FC<CandidateFormProps> = ({
  candidate,
  updateCandidate,
  removeCandidate,
  isRemovable
}) => {
  const handleLocalFileSelect = async () => {
    // In a real implementation, this would use the File System Access API
    // For now, we'll simulate selecting a folder
    const mockPath = `/Users/developer/projects/assessment-${Math.floor(Math.random() * 1000)}`;
    updateCandidate(candidate.id, { localPath: mockPath });
  };

  return (
    <Card className="p-4 mb-4 relative">
      {isRemovable && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => removeCandidate(candidate.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Candidate Name
          </label>
          <Input
            value={candidate.name}
            onChange={(e) => updateCandidate(candidate.id, { name: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center">
            GitHub Repository URL
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 inline-flex text-muted-foreground cursor-help">
                    (?)
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>You can use any of these formats:</p>
                  <ul className="mt-1 list-disc pl-4 text-xs">
                    <li>Standard repo: https://github.com/username/repo</li>
                    <li>Specific branch: https://github.com/username/repo/tree/branch-name</li>
                    <li>Pull request: https://github.com/username/repo/pull/123</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 flex gap-1">
              <Github className="h-4 w-4 text-muted-foreground" />
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={candidate.githubRepo}
              onChange={(e) => updateCandidate(candidate.id, { githubRepo: e.target.value })}
              placeholder="https://github.com/username/repo"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            GPT-4o will analyze the GitHub repo directly, including specific branches or pull requests.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Or Select Local Project
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={candidate.localPath}
                disabled
                placeholder="No folder selected"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLocalFileSelect}
            >
              <Folder className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CandidateForm;
