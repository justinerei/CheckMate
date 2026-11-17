export type AdminNotification = {
  id: string;
  kind: "locked" | "failed" | "account" | "quiz";
  title: string;
  detail: string;
  href: string;
  date?: string;
};

export type AdminLiveData = {
  notifications: AdminNotification[];
  overview?: {
    waiting: number;
    processing: number;
    failed: number;
    activity: { date: string; count: number }[];
  };
};
