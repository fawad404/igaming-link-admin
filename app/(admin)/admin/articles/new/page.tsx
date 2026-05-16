import { ArticleForm } from "@/components/articles/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main">New Article</h1>
        <p className="text-sm text-text-muted mt-1">Create and publish a new article</p>
      </div>
      <ArticleForm />
    </div>
  );
}
