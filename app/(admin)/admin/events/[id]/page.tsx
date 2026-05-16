"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/Spinner";
import { EventForm } from "@/components/events/EventForm";

interface EventData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image?: { _id: string; url: string; originalName: string } | null;
  eventType: string;
  startDate: string;
  endDate: string;
  location: { city: string; country: string; venue: string; isOnline: boolean };
  websiteUrl?: string;
  isFeatured: boolean;
  isTrending: boolean;
  status: string;
  tags: string[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setEvent(data);
      } catch {
        toast.error("Failed to load event");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew]);

  const title = isNew ? "New Event" : event?.title ?? "Edit Event";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/events"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-admin-bg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isNew ? "Add a new iGaming event" : "Edit event details"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <EventForm
          mode={isNew ? "create" : "edit"}
          initial={
            isNew
              ? undefined
              : {
                  _id:         event?._id,
                  title:       event?.title,
                  slug:        event?.slug,
                  description: event?.description ?? "",
                  image:       event?.image ?? null,
                  eventType:   event?.eventType ?? "conference",
                  startDate:   event?.startDate ? event.startDate.split("T")[0] : "",
                  endDate:     event?.endDate   ? event.endDate.split("T")[0]   : "",
                  location:    event?.location ?? { city: "", country: "", venue: "", isOnline: false },
                  websiteUrl:  event?.websiteUrl ?? "",
                  isFeatured:  event?.isFeatured ?? false,
                  isTrending:  event?.isTrending ?? false,
                  status:      event?.status ?? "upcoming",
                  tags:        event?.tags ?? [],
                }
          }
        />
      )}
    </div>
  );
}
