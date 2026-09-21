"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitLeaveRequest } from "@/lib/actions/leave-requests";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { LeaveType } from "@/lib/types";

export function LeaveRequestForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [leaveType, setLeaveType] = React.useState<LeaveType>("conge");
  const [startDate, setStartDate] = React.useState(defaultDate);
  const [endDate, setEndDate] = React.useState(defaultDate);
  const [comment, setComment] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);
    const res = await submitLeaveRequest({ leave_type: leaveType, start_date: startDate, end_date: endDate, comment });
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setComment("");
    setSuccess(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle demande</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leave_type">Type</Label>
              <Select id="leave_type" value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Du</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">Au</Label>
              <Input id="end_date" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment">Motif / commentaire (optionnel)</Label>
            <Textarea id="comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              Demande envoyée. Vous serez informé dès que l&apos;administrateur l&apos;aura traitée.
            </p>
          )}

          <Button type="submit" disabled={pending}>
            <Send className="h-4 w-4" /> {pending ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
