import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain, Users, MessageSquare, Phone, Shield, ClipboardList,
  ArrowRight, Sparkles
} from "lucide-react";
import logo from "@/assets/logo-transparent.png";

const features = [
  { icon: Brain, title: "AI Lead Scoring", desc: "Predict which caregivers will convert with machine-learning models trained on home care data." },
  { icon: Users, title: "Autonomous Sourcing", desc: "AI agents scour job boards and social platforms 24/7 to find qualified caregivers." },
  { icon: MessageSquare, title: "Smart Outreach", desc: "Personalized multi-channel campaigns that adapt messaging based on candidate behavior." },
  { icon: Phone, title: "AI Phone Screening", desc: "Automated phone interviews that qualify candidates and schedule next steps instantly." },
  { icon: Shield, title: "Competitor Intelligence", desc: "Track competitor job postings, reviews, and marketing moves in real time." },
  { icon: ClipboardList, title: "Enrollment Tracking", desc: "Full-funnel visibility from referral to active patient with AI-powered forecasting." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <img src={logo} alt="Halevai.ai" className="h-10" />
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 halevai-glow">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center relative">
        <div className="absolute inset-0 halevai-bg-gradient opacity-30 rounded-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 halevai-border rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Home Care Growth</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
            The Growth Engine Your Home Care Agency{" "}
            <span className="halevai-text">Has Been Waiting For</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Automate caregiver recruitment, streamline patient enrollment, and outpace
            competitors — all powered by purpose-built AI agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 halevai-glow text-lg px-8 py-6">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary text-lg px-8 py-6">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to <span className="halevai-text">Grow Faster</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Six AI-powered modules working together to fill your caregiver pipeline and grow your census.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="bg-card halevai-border hover:border-primary/40 transition-colors group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:halevai-glow transition-shadow">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="halevai-bg-gradient rounded-2xl halevai-border p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by <span className="halevai-text">Growing Agencies</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Home care agencies using Halevai.ai see 3x faster caregiver placement and 40% higher enrollment conversion.
          </p>
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div>
              <div className="text-3xl font-bold font-data text-primary">3x</div>
              <div className="text-sm text-muted-foreground">Faster Placement</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-data text-primary">40%</div>
              <div className="text-sm text-muted-foreground">More Conversions</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-data text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">AI Agents Active</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logo} alt="Halevai.ai" className="h-8" />
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Halevai.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
