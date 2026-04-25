import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function AdminAppSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          App Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Configure branding and security settings.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/settings/branding" className="group">
          <Card className="h-full border-neutral-700/60 bg-neutral-900/50 transition-colors group-hover:border-accent/50">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-400">
              Update the site logo, banner, and color scheme.
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings/password" className="group">
          <Card className="h-full border-neutral-700/60 bg-neutral-900/50 transition-colors group-hover:border-accent/50">
            <CardHeader>
              <CardTitle>Admin password</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-400">
              Rotate credentials for admin access.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
