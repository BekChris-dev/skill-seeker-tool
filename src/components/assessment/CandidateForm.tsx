
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CandidateData } from "@/types/assessment";
import { X, Folder, Github, GitBranch, GitPullRequest, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { selectDirectory, selectDirectoryFallback, isFileSystemAccessSupported, DirectoryAnalysis } from "@/services/fileSystemService";

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
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [directoryAnalysis, setDirectoryAnalysis] = useState<DirectoryAnalysis | null>(
    candidate.localFiles ? {
      path: candidate.localPath,
      fileCount: candidate.localFiles.fileCount,
      codeFiles: candidate.localFiles.codeFiles,
      supportedFiles: candidate.localFiles.codeFiles.map(f => f.path)
    } : null
  );

  const handleLocalFileSelect = async () => {
    setIsLoadingDirectory(true);
    
    try {
      let analysis: DirectoryAnalysis | null = null;
      
      if (isFileSystemAccessSupported()) {
        analysis = await selectDirectory();
      } else {
        analysis = await selectDirectoryFallback();
      }
      
      if (analysis) {
        setDirectoryAnalysis(analysis);
        updateCandidate(candidate.id, { 
          localPath: analysis.path,
          codeAnalyzed: false,
          localFiles: {
            fileCount: analysis.fileCount,
            codeFiles: analysis.codeFiles
          }
        });
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    } finally {
      setIsLoadingDirectory(false);
    }
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
            The project you wish to get analyzed
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
                onChange={(e) => updateCandidate(candidate.id, { localPath: e.target.value })}
                placeholder="No folder selected"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLocalFileSelect}
              disabled={isLoadingDirectory}
            >
              <Folder className="h-4 w-4 mr-2" />
              {isLoadingDirectory ? 'Loading...' : 'Browse'}
            </Button>
          </div>
          
          {directoryAnalysis && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Directory Loaded</span>
              </div>
              <div className="text-xs text-green-700 mt-1">
                Found {directoryAnalysis.fileCount} code files in "{directoryAnalysis.path}"
              </div>
              {directoryAnalysis.supportedFiles.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  File types: {[...new Set(directoryAnalysis.codeFiles.map(f => f.type))].join(', ')}
                </div>
              )}
            </div>
          )}
          
          {!isFileSystemAccessSupported() && (
            <p className="text-xs text-amber-600 mt-1">
              Using fallback file picker - some features may be limited
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CandidateForm;
