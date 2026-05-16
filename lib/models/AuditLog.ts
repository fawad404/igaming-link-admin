import mongoose, { Schema, Document, model, models } from "mongoose";

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "published"
  | "approved"
  | "generated"
  | "deployed";

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  entityTitle?: string;
  performedBy: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "published", "approved", "generated", "deployed"],
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    entityTitle: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
