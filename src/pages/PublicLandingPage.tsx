import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Phone, Mail, MapPin, DollarSign, Heart, Shield, Clock, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import defaultLogo from "@/assets/logo-transparent.png";

interface LandingPageData {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_cta_text: string | null;
  pay_rate_highlight: string | null;
  benefits: any[];
  testimonials: any[];
  faq: any[];
  state: string | null;
  county: string | null;
  language: string | null;
}

interface AgencyInfo {
  name: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  website_url: string | null;
  hide_halevai_branding: boolean | null;
  primary_color: string | null;
  tagline: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
}

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", phone: "", email: "", relationship: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const utm = {
    source: searchParams.get("utm_source") || null,
    medium: searchParams.get("utm_medium") || null,
    campaign: searchParams.get("utm_campaign") || null,
  };

  useEffect(() => {
    const load = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }

      const { data: lp, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (error || !lp) { setNotFound(true); setLoading(false); return; }
      setPage(lp as any);

      // Fetch agency info
      const { data: ag } = await supabase.from("agencies").select("name, phone, email, logo_url, website_url").eq("id", lp.agency_id).single();
      const { data: bc } = await supabase.from("business_config").select("*").eq("agency_id", lp.agency_id).maybeSingle();
      if (ag) {
        setAgency({
          name: bc?.business_name || ag.name,
          phone: bc?.phone || ag.phone,
          email: bc?.email || ag.email,
          logo_url: bc?.logo_url || ag.logo_url,
          website_url: bc?.website_url || ag.website_url,
          hide_halevai_branding: bc?.hide_halevai_branding || false,
          primary_color: bc?.primary_color || null,
          tagline: bc?.tagline || null,
          facebook_url: bc?.facebook_url || null,
          instagram_url: bc?.instagram_url || null,
          linkedin_url: bc?.linkedin_url || null,
        });
      }

      // Track page view
      await supabase.from("landing_page_events").insert({
        landing_page_id: lp.id,
        agency_id: lp.agency_id,
        event_type: "page_view",
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
      });

      // Increment view count
      await supabase.from("landing_pages").update({ views: (lp.views || 0) + 1 }).eq("id", lp.id);

      setLoading(false);
    };
    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !formData.full_name || !formData.phone) return;
    setSubmitting(true);

    try {
      // Track form start
      await supabase.from("landing_page_events").insert({
        landing_page_id: page.id,
        agency_id: page.agency_id,
        event_type: "form_submit",
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        metadata: { full_name: formData.full_name },
      });

      // Create caregiver lead
      await supabase.from("caregivers").insert({
        agency_id: page.agency_id,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
        relationship_to_patient: formData.relationship || null,
        state: page.state,
        county: page.county,
        language_primary: page.language || "english",
        source: "landing_page" as any,
        landing_page_id: page.id,
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        status: "new" as any,
      });

      // Update form submissions count
      await supabase.from("landing_pages").update({
        form_submissions: (page as any).form_submissions + 1,
      }).eq("id", page.id);

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      toast.error("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This landing page doesn't exist or is not published.</p>
        </div>
      </div>
    );
  }

  const benefits = Array.isArray(page.benefits) ? page.benefits : [];
  const testimonials = Array.isArray(page.testimonials) ? page.testimonials : [];
  const faq = Array.isArray(page.faq) ? page.faq : [];
  const benefitIcons = [DollarSign, Heart, Shield, Clock, CheckCircle];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Watermark overlay */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0"
        style={{ backgroundImage: `url(${agency?.logo_url || defaultLogo})`, backgroundRepeat: 'repeat', backgroundSize: '120px', opacity: 0.035 }}
      />
      <Sonner />
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0" style={agency?.primary_color ? { background: `linear-gradient(135deg, ${agency.primary_color}15 0%, transparent 60%)` } : {}} />
        <div className="absolute inset-0 halevai-bg-gradient" style={agency?.primary_color ? { opacity: 0.3 } : {}} />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {agency?.logo_url && <img src={agency.logo_url} alt={agency.name} className="h-16 mx-auto mb-4" />}
          {page.pay_rate_highlight && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-1 halevai-glow">
              <DollarSign className="h-5 w-5 mr-1" />
              {page.pay_rate_highlight}
            </Badge>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            {page.hero_headline || `Join ${agency?.name || "Our Team"}`}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {page.hero_subheadline || agency?.tagline || "Start your caregiving career today with competitive pay and full support."}
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground halevai-glow text-lg px-8" onClick={() => document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" })}>
            {page.hero_cta_text || "Apply Now"} →
          </Button>
          {page.state && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{page.county ? `${page.county}, ` : ""}{page.state}</span>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      {benefits.length > 0 && (
        <section className="py-16 px-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">Why Join Us?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b: any, i: number) => {
                const Icon = benefitIcons[i % benefitIcons.length];
                return (
                  <Card key={i} className="bg-secondary/30 halevai-border">
                    <CardContent className="p-6 text-center">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">{b.title || b}</h3>
                      {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">What Our Caregivers Say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((t: any, i: number) => (
                <Card key={i} className="bg-card halevai-border">
                  <CardContent className="p-6">
                    <p className="text-foreground italic mb-3">"{t.quote || t}"</p>
                    {t.name && <p className="text-sm text-primary font-semibold">— {t.name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Application Form */}
      <section id="apply-form" className="py-16 px-4 bg-card">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Apply Now</h2>
          <p className="text-center text-muted-foreground mb-8">Fill out the form below and we'll contact you within 24 hours.</p>

          {submitted ? (
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Application Received!</h3>
                <p className="text-muted-foreground">Thank you for your interest. We'll reach out to you shortly.</p>
                {agency?.phone && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Questions? Call us at <a href={`tel:${agency.phone}`} className="text-primary">{agency.phone}</a>
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Full Name *</Label>
                <Input required value={formData.full_name} onChange={(e) => setFormData(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Phone Number *</Label>
                <Input required type="tel" value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Relationship to Patient</Label>
                <Input value={formData.relationship} onChange={(e) => setFormData(f => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Family member, friend" className="bg-secondary border-border" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground halevai-glow text-lg" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : <>{page.hero_cta_text || "Apply Now"}</>}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faq.map((f: any, i: number) => (
                <Card key={i} className="bg-card halevai-border cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm">{f.question || f.q || f}</h3>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </div>
                    {openFaq === i && (f.answer || f.a) && (
                      <p className="text-sm text-muted-foreground mt-3">{f.answer || f.a}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">{agency?.name}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {agency?.phone && <a href={`tel:${agency.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-4 w-4" />{agency.phone}</a>}
            {agency?.email && <a href={`mailto:${agency.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-4 w-4" />{agency.email}</a>}
          </div>
          {(agency?.facebook_url || agency?.instagram_url || agency?.linkedin_url) && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              {agency.facebook_url && <a href={agency.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Facebook</a>}
              {agency.instagram_url && <a href={agency.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Instagram</a>}
              {agency.linkedin_url && <a href={agency.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">LinkedIn</a>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {agency?.name}. All rights reserved.</p>
          {!agency?.hide_halevai_branding && (
            <p className="text-xs text-muted-foreground/50 mt-2">Built with Halevai.ai</p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
