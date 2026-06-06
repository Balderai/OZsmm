"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { NOTIFICATION_LABELS } from "@/lib/constants";
import type { PortalNotification } from "@/types/domain";

export function NotificationBell({ notifications }: { notifications: PortalNotification[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Bildirimleri ac"
        className="relative grid size-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell aria-hidden="true" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <h2 className="text-sm font-semibold">Bildirimler</h2>
          <div className="mt-2 space-y-2">
            {notifications.map((notification) => (
              <article key={notification.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
                <p className="text-[11px] font-medium uppercase text-cyan-800">{NOTIFICATION_LABELS[notification.category]}</p>
                <h3 className="mt-1 text-sm font-semibold">{notification.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{notification.body}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
