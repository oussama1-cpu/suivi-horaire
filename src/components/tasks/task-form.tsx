"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTaskAction } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

export function TaskForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [date, setDate] = React.useState(defaultDate);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [innovation, setInnovation] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await addTaskAction({ task_date: date, title, description, is_innovation: innovation });
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setTitle("");
    setDescription("");
    setInnovation(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle tâche</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task_date">Date</Label>
              <Input id="task_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task_title">Titre</Label>
              <Input
                id="task_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Préparer le rapport mensuel"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task_description">Description (optionnel)</Label>
            <Textarea
              id="task_description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails, résultats attendus, idée d'amélioration…"
            />
          </div>

          <button
            type="button"
            onClick={() => setInnovation((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              innovation
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
            aria-pressed={innovation}
          >
            <Lightbulb className={cn("h-4 w-4", innovation ? "text-amber-500" : "text-slate-400")} />
            Innovation {innovation ? "— activée" : ""}
          </button>
          <p className="text-xs text-slate-500">
            Cochez « Innovation » pour signaler une idée, une amélioration ou une initiative nouvelle.
          </p>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          <Button type="submit" disabled={pending}>
            <Plus className="h-4 w-4" /> {pending ? "Ajout..." : "Ajouter la tâche"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
