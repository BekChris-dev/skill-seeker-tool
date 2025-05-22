
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, KeyRound } from "lucide-react";
import { getApiKey, setApiKey, setDemoMode, isDemoMode } from "@/services/llmService";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKeyState] = useState("");
  const [isKeySet, setIsKeySet] = useState(!!getApiKey());
  const [demoEnabled, setDemoEnabled] = useState(isDemoMode());

  const handleSetApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set the API key in the service
      setApiKey(apiKey);
      setIsKeySet(true);
      onApiKeySet(true);
      
      // Disable demo mode when API key is set
      if (demoEnabled) {
        setDemoEnabled(false);
        setDemoMode(false);
      }
      
      toast({
        title: "API Key Set",
        description: "Your API key has been set successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error setting API key:", error);
      toast({
        title: "Error Setting API Key",
        description: "There was an error setting your API key",
        variant: "destructive",
      });
    }
  };

  const handleClearApiKey = () => {
    setApiKey("");
    setApiKeyState("");
    setIsKeySet(false);
    onApiKeySet(false);
    
    toast({
      title: "API Key Cleared",
      description: "Your API key has been cleared",
      variant: "default",
    });
  };

  const handleToggleDemo = (enabled: boolean) => {
    setDemoEnabled(enabled);
    setDemoMode(enabled);
    
    if (enabled) {
      toast({
        title: "Demo Mode Enabled",
        description: "Using mock analysis data for demonstration purposes",
      });
    } else {
      toast({
        title: "Demo Mode Disabled",
        description: "Using the actual OpenAI API for analysis",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <KeyRound className="mr-2 h-5 w-5" />
          LLM API Key
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable code analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type="password"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              className="pr-10"
              disabled={isKeySet}
            />
            {isKeySet && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            )}
          </div>
          {isKeySet ? (
            <Button variant="outline" onClick={handleClearApiKey}>
              Clear
            </Button>
          ) : (
            <Button onClick={handleSetApiKey}>
              Set API Key
            </Button>
          )}
        </div>
        
        {!isKeySet && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Demo Mode</h3>
                <p className="text-xs text-muted-foreground">
                  Use mock data to demonstrate the analysis functionality
                </p>
              </div>
              <Switch
                checked={demoEnabled}
                onCheckedChange={handleToggleDemo}
              />
            </div>
          </div>
        )}
        
        {!isKeySet && !demoEnabled && (
          <div className="mt-2 flex items-start text-xs text-amber-600">
            <AlertCircle className="mr-1 h-4 w-4" />
            <p>
              Your API key is stored only in memory and will be lost when you refresh the page.
              For actual implementation, a more secure approach would be used.
            </p>
          </div>
        )}
        
        {demoEnabled && (
          <div className="mt-2 flex items-start text-xs text-blue-600">
            <AlertCircle className="mr-1 h-4 w-4" />
            <p>
              Demo mode is enabled. Analysis results will use mock data instead of the OpenAI API.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
