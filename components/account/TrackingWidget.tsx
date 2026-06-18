"use client";

import { useEffect, useState } from "react";
import { Package, Truck, MapPin, CheckCircle, Clock } from "lucide-react";
import type { ShiprocketTrackingResponse, ShiprocketTrackingMilestone } from "@/types";
import { cn } from "@/lib/utils";

interface TrackingWidgetProps {
  trackingId: string;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  delivered: CheckCircle,
  "out for delivery": Truck,
  shipped: Package,
  transit: MapPin,
  default: Clock,
};

function getStatusIcon(status: string) {
  const lower = status.toLowerCase();
  for (const [key, Icon] of Object.entries(STATUS_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return STATUS_ICONS.default;
}

export function TrackingWidget({ trackingId }: TrackingWidgetProps) {
  const [data, setData] = useState<ShiprocketTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/tracking?tracking_id=${trackingId}`);
        if (!res.ok) throw new Error("Failed to fetch tracking");
        const tracking: ShiprocketTrackingResponse = await res.json();
        setData(tracking);
      } catch (e) {
        setError("Unable to load tracking information");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [trackingId]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <p className="text-muted-foreground text-sm">{error ?? "Tracking unavailable"}</p>
      </div>
    );
  }

  const milestones: ShiprocketTrackingMilestone[] = data.milestones ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Tracking</h3>
        <span className="text-xs font-mono text-muted-foreground">{trackingId}</span>
      </div>

      <div className="px-5 py-4">
        {/* Current status */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-muted">
          <Truck className="h-5 w-5 text-gold flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">{data.current_status}</p>
            <p className="text-xs text-muted-foreground">Current Status</p>
          </div>
        </div>

        {/* Timeline */}
        {milestones.length > 0 && (
          <div className="space-y-0">
            {milestones.map((milestone, i) => {
              const Icon = getStatusIcon(milestone.status);
              const isFirst = i === 0;
              return (
                <div key={i} className="flex gap-4 relative">
                  {/* Line */}
                  {i < milestones.length - 1 && (
                    <div className="absolute left-[17px] top-8 bottom-0 w-px bg-border" />
                  )}
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border",
                      isFirst
                        ? "bg-gold/10 border-gold/40 text-gold"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Content */}
                  <div className="pb-6 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isFirst ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {milestone.activity}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {milestone.location && `${milestone.location} · `}
                      {milestone.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {milestones.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No milestone updates yet
          </p>
        )}
      </div>
    </div>
  );
}
