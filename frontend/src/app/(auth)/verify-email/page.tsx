"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,

  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { authService } from "@/lib/services";
import { getApiErrorMessage } from "@/lib/api-client";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    authService
      .verifyEmail({ token })
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(getApiErrorMessage(err));
      });
  }, [token]);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        {status === "loading" && (
          <>
            <CardTitle>Verifying your email...</CardTitle>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Please wait while we process your request.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle>Email Verified!</CardTitle>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <CardTitle>Verification Failed</CardTitle>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          </>
        )}
      </CardHeader>
      <CardFooter>
        <Button
          fullWidth
          onClick={() => router.push("/login")}
          variant={status === "error" ? "outline" : "default"}
        >
          Go to Login
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
