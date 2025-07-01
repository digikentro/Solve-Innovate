import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Lightbulb, Users, Target, Zap } from 'lucide-react';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16">
        <h1 className="text-4xl tracking-tight sm:text-6xl">
          {/* Discover Innovation Opportunities with AI */}
          Leave every problem to SolveSmart
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        SolveSmart is a general AI agent that bridges between problem and solution: it doesn't just think, it delivers results. SolveSmart excels at using design thinking, behaviour design, business consulting to solve problem in any sector, solves every problem at your fingertips  
          {/* SolveSmart helps you identify and solve real-world problems using AI-powered problem discovery and opportunity scoring. */}
        </p>
        <div className="flex justify-center gap-4">
          {user ? (
            <Link to="/projects/new">
              <Button size="lg">
                Create New Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card>
          <CardHeader>
            <Lightbulb className="h-8 w-8 text-primary mb-4" />
            <CardTitle>AI-Powered Discovery</CardTitle>
            <CardDescription>
              Generate innovative problem statements using advanced AI technology
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Target className="h-8 w-8 text-primary mb-4" />
            <CardTitle>Opportunity Scoring</CardTitle>
            <CardDescription>
              Evaluate problems based on significance, feasibility, and impact
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-4" />
            <CardTitle>Skill Matching</CardTitle>
            <CardDescription>
              Find problems that match your skills and expertise
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-4" />
            <CardTitle>Real-time Generation</CardTitle>
            <CardDescription>
              Get instant problem statements tailored to your interests
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* How It Works Section */}
      <section className="text-center space-y-8 py-16">
        <h2 className="text-3xl font-bold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            <div className="text-4xl font-bold text-primary">1</div>
            <h3 className="text-xl font-semibold">Describe Your Interest</h3>
            <p className="text-muted-foreground">
              Enter a problem area or challenge you're interested in solving
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-4xl font-bold text-primary">2</div>
            <h3 className="text-xl font-semibold">AI Analysis</h3>
            <p className="text-muted-foreground">
              Our AI generates and scores potential problem statements
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-4xl font-bold text-primary">3</div>
            <h3 className="text-xl font-semibold">Start Solving</h3>
            <p className="text-muted-foreground">
              Choose a problem and begin your innovation journey
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 