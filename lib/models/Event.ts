import mongoose, { Schema, Document, model, models } from "mongoose";

export const EVENT_TYPES = [
  "conference",
  "exhibition",
  "webinar",
  "networking",
  "awards",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["upcoming", "ongoing", "past", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  image?: mongoose.Types.ObjectId;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  location: {
    city: string;
    country: string;
    venue: string;
    isOnline: boolean;
  };
  websiteUrl?: string;
  isFeatured: boolean;
  isTrending: boolean;
  status: EventStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    eventType: { type: String, enum: EVENT_TYPES, default: "conference" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: {
      city: { type: String, default: "" },
      country: { type: String, default: "" },
      venue: { type: String, default: "" },
      isOnline: { type: Boolean, default: false },
    },
    websiteUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    status: { type: String, enum: EVENT_STATUSES, default: "upcoming" },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

EventSchema.index({ startDate: 1 });
EventSchema.index({ status: 1 });

export const Event = models.Event || model<IEvent>("Event", EventSchema);
