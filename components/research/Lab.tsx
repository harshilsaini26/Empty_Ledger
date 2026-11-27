"use client";
import { EpoLab } from "./EpoLab";
import { BuffettLab } from "./BuffettLab";
import { RetirementLab } from "./RetirementLab";

export function Lab({ id }: { id: string }) {
  if (id === "enhanced-portfolio-optimization") return <EpoLab />;
  if (id === "buffetts-alpha") return <BuffettLab />;
  return <RetirementLab />;
}
