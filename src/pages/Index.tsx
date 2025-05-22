
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Code, Settings } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Code Assessment Tool</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Evaluate and compare code submissions from engineering candidates based on readability, 
          extensibility, testability, and seniority fit.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/code-assessment">
              <Code className="mr-2 h-5 w-5" />
              Get Started
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/settings">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
