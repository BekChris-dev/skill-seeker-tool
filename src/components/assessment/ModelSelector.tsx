
import React, { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, getModel, setModel } from '@/services/llmService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const ModelSelector = () => {
  const [selectedModel, setSelectedModel] = useState<string>(getModel());

  useEffect(() => {
    // Set the initial selected model from the service
    setSelectedModel(getModel());
  }, []);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setModel(value);
    
    // Provide feedback about the selected model
    const selectedModelInfo = AVAILABLE_MODELS.find(model => model.id === value);
    
    if (selectedModelInfo) {
      toast({
        title: `Model changed to ${selectedModelInfo.name}`,
        description: selectedModelInfo.description,
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-5 w-5" />
          OpenAI Model Selection
        </CardTitle>
        <CardDescription>
          Choose which model to use for code analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedModel} onValueChange={handleModelChange} className="space-y-3">
          {AVAILABLE_MODELS.map((model) => (
            <div key={model.id} className="flex items-start space-x-2">
              <RadioGroupItem value={model.id} id={`model-${model.id}`} />
              <div className="grid gap-1">
                <Label htmlFor={`model-${model.id}`} className="font-medium">
                  {model.name}
                </Label>
                <p className="text-sm text-muted-foreground">{model.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
