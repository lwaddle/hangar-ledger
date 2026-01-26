"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing your invitation...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Check if there's an error in the URL (query params)
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      // Parse the hash fragment for tokens (implicit flow)
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1) // Remove the leading #
      );

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && refreshToken) {
        setStatus("Setting up your session...");

        // Set the session using the tokens from the URL fragment
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        // For invite type, redirect to set-password
        if (type === "invite") {
          setStatus("Redirecting to set your password...");
          router.push("/set-password");
          return;
        }

        // For other types, redirect to trips
        setStatus("Redirecting...");
        router.push("/trips");
        return;
      }

      // Check for code in query params (PKCE flow fallback)
      const code = urlParams.get("code");
      if (code) {
        setStatus("Exchanging authorization code...");
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        // Check the user to determine redirect
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Invited users should set password
          router.push("/set-password");
          return;
        }
      }

      // If we get here, something went wrong
      setError("No authentication tokens found. Please try the invite link again.");
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-red-600">
                Authentication Error
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Please contact your administrator for a new invitation link.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Go to login page
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>{status}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
