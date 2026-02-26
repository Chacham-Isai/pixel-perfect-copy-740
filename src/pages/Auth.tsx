import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/assets/halevai-logo.png";

const Auth = () => {
  const [forgotPassword, setForgotPassword] = useState(false);

  if (forgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Halevai.ai" className="h-14 mx-auto mb-4" />
            <p className="text-muted-foreground">Reset your password</p>
          </div>
          <Card className="bg-card halevai-border">
            <CardHeader>
              <CardTitle className="text-foreground">Forgot Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="you@agency.com" className="bg-secondary border-border" />
              </div>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Send Reset Link</Button>
              <button onClick={() => setForgotPassword(false)} className="text-sm text-primary hover:underline w-full text-center block">
                Back to sign in
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Halevai.ai" className="h-14 mx-auto mb-4" />
          </Link>
          <p className="text-muted-foreground">AI-Powered Home Care Growth Engine</p>
        </div>

        <Card className="bg-card halevai-border">
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="w-full bg-secondary">
                <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@agency.com" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" className="bg-secondary border-border" />
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 halevai-glow">Sign In</Button>
                <button onClick={() => setForgotPassword(true)} className="text-sm text-primary hover:underline w-full text-center block">
                  Forgot password?
                </button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" type="text" placeholder="Jane Smith" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@agency.com" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-agency">Agency Name</Label>
                  <Input id="signup-agency" type="text" placeholder="Your Home Care Agency" className="bg-secondary border-border" />
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 halevai-glow">Create Account</Button>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
