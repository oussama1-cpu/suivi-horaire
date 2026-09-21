"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMeetingAction } from "@/lib/actions/meetings";
import { Profile, MeetingRecurrence } from "@/lib/types";

interface MeetingDialogProps {
  open: boolean;
  onClose: () => void;
  attendees: Profile[];
}

function defaultStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

export function MeetingDialog({ open, onClose, attendees }: MeetingDialogProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [link, setLink] = React.useState("");
  const [startAt, setStartAt] = React.useState(defaultStart());
  const [endAt, setEndAt] = React.useState("");
  const [recurrence, setRecurrence] = React.useState<MeetingRecurrence>("none");
  const [recurrenceUntil, setRecurrenceUntil] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle("");
      setDescription("");
      setLocation("");
      setLink("");
      setStartAt(defaultStart());
      setEndAt("");
      setRecurrence("none");
      setRecurrenceUntil("");
      setSelected([]);
      setError(null);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createMeetingAction({
      title,
      description,
      location,
      meeting_link: link,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      recurrence,
      recurrence_until: recurrence !== "none" ? recurrenceUntil || null : null,
      participant_ids: selected,
    });

    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle réunion" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mt-title">Titre</Label>
          <Input id="mt-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mt-desc">Description</Label>
          <Textarea id="mt-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mt-start">Début</Label>
            <Input id="mt-start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mt-end">Fin (optionnel)</Label>
            <Input id="mt-end" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mt-location">Lieu</Label>
            <Input id="mt-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Salle de réunion" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mt-link">Lien visio</Label>
            <Input id="mt-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mt-recur">Récurrence</Label>
            <Select id="mt-recur" value={recurrence} onChange={(e) => setRecurrence(e.target.value as MeetingRecurrence)}>
              <option value="none">Aucune</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </Select>
          </div>
          {recurrence !== "none" && (
            <div className="space-y-1.5">
              <Label htmlFor="mt-until">Jusqu&apos;au</Label>
              <Input id="mt-until" type="date" value={recurrenceUntil} onChange={(e) => setRecurrenceUntil(e.target.value)} required />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Participants</Label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
            {attendees.map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <span className="text-slate-900">{p.full_name}</span>
                <span className="text-xs text-slate-400">{p.function_title}</span>
              </label>
            ))}
            {attendees.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Aucun compte disponible.</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Création..." : "Créer la réunion"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
