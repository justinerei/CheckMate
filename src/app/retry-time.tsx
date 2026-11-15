"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

export function RetryTime({ value }: { value: string }) {
  const mounted = useSyncExternalStore(subscribe, client, server);
  const date = new Date(value);
  if (!mounted || !Number.isFinite(date.getTime())) return null;
  return <time dateTime={value}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)}</time>;
}
