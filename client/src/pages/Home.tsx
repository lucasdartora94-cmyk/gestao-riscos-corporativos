import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        setLocation("/");
      } else {
        window.location.href = getLoginUrl();
      }
    }
  }, [isAuthenticated, loading, setLocation]);

  return null;
}
