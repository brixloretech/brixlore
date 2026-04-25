"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/lib/services";
import type { AdminUserDto } from "@/types/api";
import { useAuth } from "@/contexts";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Loader,
} from "@/components/ui";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "CONTENT_MANAGER", label: "Content Manager" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
] as const;

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

export default function AdminUserSettingsPage() {
  const { user: currentUser } = useAuth();
  const isReadOnly = currentUser?.role === "CUSTOMER_SUPPORT";
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleValue>("CONTENT_MANAGER");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers(1, 50);
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return users;
    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(trimmed) ||
        user.email.toLowerCase().includes(trimmed)
      );
    });
  }, [query, users]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (isReadOnly) {
      setInviteError("Customer Support accounts have read-only access.");
      return;
    }
    setInviteError(null);
    setNotice(null);
    if (!inviteEmail.trim()) {
      setInviteError("Email is required.");
      return;
    }
    setInviting(true);
    try {
      const res = await adminService.inviteAdminUser({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole,
      });
      setNotice(res.message);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("CONTENT_MANAGER");
      await load();
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to invite admin.",
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleSave(user: AdminUserDto, role: RoleValue) {
    setNotice(null);
    if (isReadOnly) {
      setInviteError("Customer Support accounts have read-only access.");
      return;
    }
    setSavingId(user.id);
    try {
      const updated = await adminService.updateAdminUserRole(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setNotice(`Role updated for ${user.name ?? user.email}.`);
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemoveAccess(targetUser: AdminUserDto) {
    if (isReadOnly) return;
    if (currentUser?.id === targetUser.id) {
      setInviteError("You cannot remove your own admin access.");
      return;
    }
    const confirmed = window.confirm(
      `Remove admin access for ${targetUser.name ?? targetUser.email}? They will no longer be able to sign in to the admin portal.`,
    );
    if (!confirmed) return;
    setNotice(null);
    setInviteError(null);
    setDeletingId(targetUser.id);
    try {
      await adminService.revokeAdminAccess(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      setNotice(`Admin access removed for ${targetUser.name ?? targetUser.email}.`);
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to remove admin access.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
        <Loader size="lg" label="Loading users…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
        <p className="text-red-300">{error}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => void load()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          User management
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Invite admins and assign roles across Super Admin, Content Manager,
          and Customer Support.
        </p>
      </header>

      {notice ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}
      {isReadOnly ? (
        <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300">
          Read-only access: Customer Support accounts can view users but cannot
          invite or update roles.
        </div>
      ) : null}

      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Invite admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {inviteError}
            </p>
          ) : null}
          <form onSubmit={handleInvite} className="grid gap-3 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              disabled={isReadOnly || inviting}
            />
            <Input
              label="Name"
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name (optional)"
              disabled={isReadOnly || inviting}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as RoleValue)}
                disabled={isReadOnly || inviting}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={inviting || isReadOnly}>
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Team access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Search team members"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500">No matching users found.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950/60 text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rowUser) => (
                    <tr
                      key={rowUser.id}
                      className="border-t border-neutral-800"
                    >
                      <td className="px-4 py-3 text-neutral-100">
                        {rowUser.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {rowUser.email}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                          value={
                            ROLE_OPTIONS.some(
                              (role) => role.value === rowUser.role,
                            )
                              ? (rowUser.role as RoleValue)
                              : "CONTENT_MANAGER"
                          }
                          onChange={(e) =>
                            setUsers((prev) =>
                              prev.map((u) =>
                                u.id === rowUser.id
                                  ? { ...u, role: e.target.value }
                                  : u,
                              ),
                            )
                          }
                          disabled={isReadOnly}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              savingId === rowUser.id || isReadOnly
                            }
                            onClick={() =>
                              void handleSave(
                                rowUser,
                                rowUser.role as RoleValue,
                              )
                            }
                          >
                            {savingId === rowUser.id ? "Saving…" : "Save"}
                          </Button>
                          {rowUser.id !== currentUser?.id ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={
                                deletingId === rowUser.id || isReadOnly
                              }
                              onClick={() =>
                                void handleRemoveAccess(rowUser)
                              }
                            >
                              {deletingId === rowUser.id
                                ? "Removing…"
                                : "Delete"}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
