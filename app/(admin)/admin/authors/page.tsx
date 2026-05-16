"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

interface Author {
  _id: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthorFormState {
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: AuthorFormState = {
  name: "",
  email: "",
  bio: "",
  avatarUrl: "",
  isActive: true,
};

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AuthorFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/authors");
      const data = await res.json();
      setAuthors(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load authors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (author: Author) => {
    setEditingId(author._id);
    setForm({
      name: author.name,
      email: author.email ?? "",
      bio: author.bio ?? "",
      avatarUrl: author.avatarUrl ?? "",
      isActive: author.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email || undefined,
        bio: form.bio || undefined,
        avatarUrl: form.avatarUrl || undefined,
        isActive: form.isActive,
      };

      const url = editingId ? `/api/authors/${editingId}` : "/api/authors";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      toast.success(editingId ? "Author updated" : "Author created");
      setModalOpen(false);
      fetchAuthors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/authors/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Author deleted");
      setDeleteId(null);
      fetchAuthors();
    } catch {
      toast.error("Failed to delete author");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Authors</h1>
          <p className="text-sm text-text-muted mt-1">{authors.length} authors</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Author
        </Button>
      </div>

      {/* Authors table */}
      <div className="rounded-xl border border-admin-border bg-admin-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : authors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
            <UserCircle className="h-10 w-10 opacity-40" />
            <p>No authors yet. Add your first author.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr
                  key={author._id}
                  className="border-b border-admin-border last:border-0 hover:bg-admin-bg/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {author.avatarUrl ? (
                        <img
                          src={author.avatarUrl}
                          alt={author.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-admin-bg border border-admin-border flex items-center justify-center text-text-muted text-xs font-medium">
                          {author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-main">{author.name}</p>
                        {author.bio && (
                          <p className="text-xs text-text-muted mt-0.5 max-w-xs truncate">
                            {author.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{author.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={author.isActive ? "published" : "archived"}>
                      {author.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5"
                        onClick={() => openEdit(author)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5 text-danger hover:bg-red-50"
                        onClick={() => setDeleteId(author._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Author" : "New Author"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email (optional)"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Avatar URL (optional)"
            value={form.avatarUrl}
            onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
            placeholder="https://..."
          />
          <Textarea
            label="Bio (optional)"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
          />
          <div className="flex items-center gap-3">
            <Toggle
              checked={form.isActive}
              onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
            <span className="text-sm text-text-main">Active</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingId ? "Save Changes" : "Create Author"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Author"
        message="This author will be permanently deleted. Articles assigned to them will lose the author reference."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
