"use client";
import { PrismaCrystal } from "./prisma-crystal";
import { useSettings } from "../runtime/settings-context";

export function BrandLogo({compact=false,variant}:{compact?:boolean;variant?:"en"|"jp"}) {
  const {preferences}=useSettings();
  const style=variant??preferences.logoStyle;
  const japanese=style==="jp";
  return <span className={`origin-logo${compact?" origin-logo-compact":""}${japanese?" origin-logo-jp":""}`} data-logo-style={style} lang={japanese?"ja":"en"} role="img" aria-label={japanese?"プリズマ オリジン（起源）":"The Prisma Origin"}>
    <span className="origin-logo-top" aria-hidden="true">
      {!japanese&&<span className="origin-logo-the">The</span>}
      <span className="origin-logo-prisma">{japanese?"プリズマ":"Prisma"}</span>
      <span className="origin-logo-crystal">
        <PrismaCrystal isolated className="origin-crystal-base"/>
        <PrismaCrystal isolated className="origin-crystal-glow"/>
      </span>
    </span>
    <span className="origin-logo-origin" aria-hidden="true">{japanese?<>オリジン<span className="origin-logo-kanji">起源</span></>:"Origin"}</span>
  </span>;
}
