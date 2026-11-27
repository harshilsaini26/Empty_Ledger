"use client";
import { CompareLab, CostLab, PhilosophyLab, SavingEarlyLab, SavingRateLab, StartupLab } from "../bogleheads/BogleLabs";
import { BuffettLab } from "./BuffettLab";
import { EpoLab } from "./EpoLab";
import { RetirementLab } from "./RetirementLab";

const LABS: Record<string, () => React.ReactNode> = {
  "enhanced-portfolio-optimization": EpoLab,
  "buffetts-alpha": BuffettLab,
  "retirement-income": RetirementLab,
  philosophy: PhilosophyLab,
  "start-up-kit": StartupLab,
  "humble-arithmetic": CostLab,
  "saving-rate": SavingRateLab,
  "saving-early": SavingEarlyLab,
  "comparing-investments": CompareLab,
};

export function Lab({ id }: { id: string }) {
  const L = LABS[id];
  return L ? <L /> : null;
}
