import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type AgencyRole = "owner" | "admin" | "viewer" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  agencyId: string | null;
  agencyRole: AgencyRole;
  isViewer: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  agencyId: null,
  agencyRole: null,
  isViewer: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyRole, setAgencyRole] = useState<AgencyRole>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("agency_members")
        .select("agency_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          setAgencyId(data?.agency_id ?? null);
          setAgencyRole((data?.role as AgencyRole) ?? null);
        });
    } else {
      setAgencyId(null);
      setAgencyRole(null);
    }
  }, [user]);

  const isViewer = agencyRole === "viewer";

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, agencyId, agencyRole, isViewer, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
