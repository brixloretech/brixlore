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
  const [parentId, setParentId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit states
  const [editingCategory, setEditingCategory] = useState<AdminCategoryDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [updating, setUpdating] = useState(false);

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
      await adminService.createCategory({ name, parentId: parentId || undefined });
      setNewName("");
      setParentId("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category.",
      );
    } finally {
      setCreating(false);
    }
  }

  function handleStartEdit(category: AdminCategoryDto) {
    setEditingCategory(category);
    setEditName(category.name);
    setEditParentId(category.parentId || "");
    setError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    const name = editName.trim();
    if (!name) {
      setError("Category name is required.");
      return;
    }
    setUpdating(true);
    setError(null);
    try {
      await adminService.updateCategory(editingCategory.id, {
        name,
        parentId: editParentId || null,
      });
      setEditingCategory(null);
      setEditName("");
      setEditParentId("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category.",
      );
    } finally {
      setUpdating(false);
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

      {editingCategory ? (
        <Card className="mb-8 border-neutral-700/60 bg-neutral-900/50">
          <form onSubmit={handleUpdate}>
            <CardHeader>
              <CardTitle>Edit category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Category name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Tutorials"
                  required
                />
              </div>
              <div className="w-full sm:w-64">
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Parent Category
                </label>
                <select
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                >
                  <option value="">None (Main Category)</option>
                  {categories
                    .filter((c) => !c.parentId && c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="submit" disabled={updating}>
                  {updating ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      ) : (
        <Card className="mb-8 border-neutral-700/60 bg-neutral-900/50">
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
              <div className="w-full sm:w-64">
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Parent Category (Optional)
                </label>
                <select
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">None (Main Category)</option>
                  {categories
                    .filter((c) => !c.parentId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </CardContent>
          </form>
        </Card>
      )}

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
                {categories.map((category) => {
                  const parentName = category.parentId
                    ? categories.find((c) => c.id === category.parentId)?.name
                    : null;
                  return (
                    <tr
                      key={category.id}
                      className="border-b border-neutral-700/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {category.name}
                        {parentName && (
                          <span className="block text-xs font-normal text-neutral-500 mt-0.5">
                            Subcategory of {parentName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {formatCreatedAt(category.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deletingId === category.id}
                            onClick={() => handleStartEdit(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deletingId === category.id}
                            onClick={() => void handleDelete(category)}
                          >
                            {deletingId === category.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
