"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export default function BlogCommentForm({ slug, defaultName = "" }: { slug: string; defaultName?: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please tell us your name so we can publish the comment.");
      return;
    }
    if (!message.trim()) {
      setError("Please write a comment.");
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment.");
      }

      setMessage("");
      setSuccess("Comment posted.");
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="h-11 rounded-full border border-border/60 bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comment</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts on this post..."
          rows={5}
          className="rounded-3xl border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 resize-none"
        />
      </div>

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {success && <p className="text-xs font-medium text-[#2d4c38] dark:text-emerald-400">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] px-5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#203628] disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Post Comment
      </button>
    </form>
  );
}