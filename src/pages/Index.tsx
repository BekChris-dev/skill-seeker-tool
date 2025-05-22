
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
