"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { USE_MOCK_API } from "@/lib/services/config";

type SubscriptionPromptProps = {
  /** Optional title of the content (e.g. video title) for context. */
  contentTitle?: string;
  /** Optional return URL after subscribing (e.g. /watch/123). Used for pricing page link. */
  returnUrl?: string;
  /** Optional class name for the wrapper. */
  className?: string;
};

/**
 * Shown when the user is not subscribed. Prompts them to subscribe.
 * Mock: button sets subscription in AuthContext. Real API: link to pricing page.
 */
export function SubscriptionPrompt({
  contentTitle,
  returnUrl,
  className,
}: SubscriptionPromptProps) {
  const { isAuthenticated, setSubscribed } = useAuth();

  const subscriptionHref = returnUrl
    ? `/subscription?returnUrl=${encodeURIComponent(returnUrl)}`
    : "/subscription";

  function handleSubscribeMock() {
    setSubscribed(true);
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">
            🔒
          </span>
          Subscribe to watch
        </CardTitle>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {contentTitle
            ? `This content requires an active subscription: "${contentTitle}".`
            : "This content requires an active subscription."}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
          <li>Unlimited access to all content</li>
          <li>HD and 4K streaming</li>
          <li>Watch on any device</li>
          <li>Cancel anytime</li>
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {USE_MOCK_API ? (
          <Button onClick={handleSubscribeMock} className="w-full sm:w-auto">
            Subscribe now (mock)
          </Button>
        ) : (
          <Link
            href={subscriptionHref}
            className="w-full sm:w-auto sm:inline-block"
          >
            <Button className="w-full sm:w-auto">View plans & subscribe</Button>
          </Link>
        )}
        {!isAuthenticated && (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 sm:text-left">
            You may need to sign in first to subscribe.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
