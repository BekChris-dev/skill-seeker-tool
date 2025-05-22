
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import ApiKeyInput from "@/components/assessment/ApiKeyInput";

export default function Settings() {
  const handleApiKeySet = (isSet: boolean) => {
    console.log("API key set:", isSet);
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
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription>
              Configure model settings (Currently using OpenAI's GPT-4o)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Model configuration options will be available in future versions. Currently, the tool
              is configured to use OpenAI's GPT-4o model for optimal code analysis results.
            </p>
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
