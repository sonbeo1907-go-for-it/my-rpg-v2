import { PrismaCrystal } from "./prisma-crystal";

export function BrandLogo({compact=false}:{compact?:boolean}) {
  return <span className={`origin-logo${compact?" origin-logo-compact":""}`} role="img" aria-label="The Prisma Origin">
    <span className="origin-logo-top" aria-hidden="true">
      <span className="origin-logo-the">The</span>
      <span className="origin-logo-prisma">Prisma</span>
      <span className="origin-logo-crystal">
        <PrismaCrystal isolated className="origin-crystal-base"/>
        <PrismaCrystal isolated className="origin-crystal-glow"/>
      </span>
    </span>
    <span className="origin-logo-origin" aria-hidden="true">Origin</span>
  </span>;
}
