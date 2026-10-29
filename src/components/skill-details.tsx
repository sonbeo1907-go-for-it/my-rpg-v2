"use client";
import type { ReactNode } from "react";
import { skillPresentation, passivePresentation } from "../ui/skill-copy.js";

export function RulesDisclosure({ rules = [], children, title = "Chi tiết cơ chế" }: { rules?: string[]; children?: ReactNode; title?: string }) {
  if (!rules.length && !children) return null;
  return <details className="skill-rules"><summary>{title}</summary>{children}{rules.length > 0 && <ul>{rules.map((rule, i) => <li key={i}>{rule}</li>)}</ul>}</details>;
}

// The same copy hierarchy is used in character previews and combat help.
export function SkillBody({ skill, actor, content, choices = {}, combat = false }: { skill: any; actor: any; content: any; choices?: any; combat?: boolean }) {
  const info = skillPresentation(skill, actor, content, choices);
  return <>
    <p className="skill-summary">{info.summary}</p>
    <ul className="skill-facts scaling">{info.facts.map((line: string, i: number) => <li key={i}>{line}</li>)}</ul>
    {combat && info.rules.length > 0 && <ul className="skill-quick-rules">{info.rules.map((line: string, i: number) => <li key={i}>{line}</li>)}</ul>}
  </>;
}

export function PassiveBody({ actor, content }: { actor: any; content: any }) {
  const info = passivePresentation(actor, content);
  if (!info) return null;
  return <section className="passive-copy" aria-label="Nội tại nhân vật">
    <h3><span>Nội tại</span>{info.name}</h3><p className="skill-summary">{info.summary}</p>
    <ul className="skill-facts">{info.facts.map((line: string, i: number) => <li key={i}>{line}</li>)}</ul>
    <RulesDisclosure rules={info.rules}/>
  </section>;
}
