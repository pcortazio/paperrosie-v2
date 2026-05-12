"use client";

import { Reshaped } from "reshaped";

export default function ReshapedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Reshaped theme="rosie">{children}</Reshaped>;
}
