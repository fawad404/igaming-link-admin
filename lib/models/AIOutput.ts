import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAIOutput extends Document {
  job: mongoose.Types.ObjectId;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AIOutputSchema = new Schema<IAIOutput>(
  {
    job: { type: Schema.Types.ObjectId, ref: "AIJob", required: true },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AIOutput = models.AIOutput || model<IAIOutput>("AIOutput", AIOutputSchema);
