"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Loader,
} from "@/components/ui";
import { adminService } from "@/lib/services";
import type { AdminCategoryDto } from "@/types/api";

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminService.getCategories();
      setCategories(list);
    } catch (err) {
      setCategories([]);
      setError(
        err instanceof Error ? err.message : "Failed to load categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError("Category name is required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await adminService.createCategory({ name });
      setNewName("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(category: AdminCategoryDto) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setDeletingId(category.id);
    setError(null);
    try {
      await adminService.deleteCategory(category.id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Create and manage categories for your content uploads.
          </p>
        </div>
      </header>

      <Card className="mb-8">
        <form onSubmit={handleCreate}>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Category name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Tutorials"
                required
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
          <Loader size="lg" label="Loading categories…" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12 text-center">
          <p className="text-neutral-400">No categories yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-900/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-700/50 bg-neutral-800/50">
                  <th className="px-4 py-3 font-medium text-neutral-300">
                    Name
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-300">
                    Slug
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-300">
                    Created
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-neutral-700/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {category.slug}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {formatCreatedAt(category.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deletingId === category.id}
                        onClick={() => void handleDelete(category)}
                      >
                        {deletingId === category.id ? "Deleting…" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
