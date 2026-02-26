import { AppLayout } from "@/components/AppLayout";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 halevai-border flex items-center justify-center mb-6">
          <span className="text-2xl halevai-text font-bold">H</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">{title}</h1>
        <p className="text-muted-foreground max-w-md">
          {description || "This module is coming soon. We're building something amazing."}
        </p>
      </div>
    </AppLayout>
  );
};

export default PlaceholderPage;
