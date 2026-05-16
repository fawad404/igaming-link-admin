import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IRole extends Document {
  name: "super-admin" | "editor" | "seo-manager" | "reviewer" | "developer" | "viewer";
  permissions: string[];
  createdAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      enum: ["super-admin", "editor", "seo-manager", "reviewer", "developer", "viewer"],
      required: true,
      unique: true,
    },
    permissions: [{ type: String }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Role = models.Role || model<IRole>("Role", RoleSchema);
