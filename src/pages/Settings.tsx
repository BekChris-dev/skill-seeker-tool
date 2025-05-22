import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings as SettingsIcon, AlertCircle, ExternalLink, GitBranch, GitPullRequest, Zap } from 'lucide-react';
import ApiKeyInput from "@/components/assessment/ApiKeyInput";
import ModelSelector from "@/components/assessment/ModelSelector";
import { getApiKey, validateApiKey } from "@/services/llmService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [isKeySet, setIsKeySet] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(false);
  
  useEffect(() => {
    // Check if API key is set when component mounts
    const currentKey = getApiKey();
    setIsKeySet(!!currentKey);
    
    // Check if the key format seems valid
    if (currentKey) {
      setIsKeyValid(validateApiKey(currentKey));
      if (!validateApiKey(currentKey)) {
        toast({
          title: "API Key Format Warning",
          description: "Your API key doesn't match the expected OpenAI format. OpenAI keys usually start with 'sk-'.",
          variant: "destructive",
        });
      }
    }
  }, []);

  const handleApiKeySet = (isSet: boolean) => {
    console.log("API key set:", isSet);
    setIsKeySet(isSet);
    
    // Check if new key format seems valid
    if (isSet) {
      const currentKey = getApiKey();
      const isValid = validateApiKey(currentKey);
      setIsKeyValid(isValid);
      
      if (!isValid) {
        toast({
          title: "API Key Format Warning",
          description: "Your API key doesn't match the expected OpenAI format. OpenAI keys usually start with 'sk-'.",
          variant: "destructive",
        });
      }
    } else {
      setIsKeyValid(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure the API settings for code analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeyInput onApiKeySet={handleApiKeySet} />
            
            {isKeySet && isKeyValid && (
              <Alert className="mt-4" variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Key Status</AlertTitle>
                <AlertDescription>
                  Your API key is set and will be used for code analysis. To test if your key works correctly,
                  try analyzing a code sample on the Code Assessment page.
                </AlertDescription>
              </Alert>
            )}
            
            {isKeySet && !isKeyValid && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid API Key Format</AlertTitle>
                <AlertDescription>
                  The API key you've entered doesn't match the expected OpenAI format. 
                  OpenAI API keys should start with 'sk-'. Please check your API key.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">About LLM Integration</h3>
              <p className="text-sm text-muted-foreground">
                This tool uses LLM technology to analyze code submissions for quality, readability, and other factors.
                API keys are stored only in memory during your session. In a production environment, 
                these would be securely managed through a backend service.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Model Configuration
            </CardTitle>
            <CardDescription>
              Configure which OpenAI model to use for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModelSelector />
            
            <Alert className="mt-4" variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Model Selection Tips</AlertTitle>
              <AlertDescription>
                <p>If you're experiencing quota exceeded errors, try selecting a less expensive model:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li className="text-sm">GPT-4o: Highest quality but most expensive</li>
                  <li className="text-sm">GPT-4o Mini: Good balance of cost and capability</li>
                  <li className="text-sm">GPT-3.5 Turbo: Most affordable option</li>
                </ul>
                <div className="mt-2">
                  <a 
                    href="https://platform.openai.com/account/billing/overview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Check OpenAI billing status <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GitBranch className="mr-2 h-5 w-5" />
              GitHub Repository Analysis
            </CardTitle>
            <CardDescription>
              Direct analysis of GitHub repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2">
              <div className="mt-1">
                <GitPullRequest className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Advanced GitHub URL Support</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The tool now supports direct analysis of GitHub repositories, including specific branches and pull requests. 
                  GPT-4o will analyze the code directly from GitHub without requiring any local processing.
                </p>
                
                <div className="mt-3">
                  <h4 className="text-sm font-medium">Supported GitHub URL formats:</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li className="text-sm text-muted-foreground">Standard repositories: <code className="text-xs bg-muted p-1 rounded">https://github.com/username/repo</code></li>
                    <li className="text-sm text-muted-foreground">Specific branches: <code className="text-xs bg-muted p-1 rounded">https://github.com/username/repo/tree/branch-name</code></li>
                    <li className="text-sm text-muted-foreground">Pull requests: <code className="text-xs bg-muted p-1 rounded">https://github.com/username/repo/pull/123</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/">
            Back to Home
          </Link>
        </Button>
        <Button asChild>
          <Link to="/code-assessment">
            Go to Assessment
          </Link>
        </Button>
      </div>
    </div>
  );
}
