"use client";

import React from "react";

type LogoAnimationVariant =
  | "Frame 1"
  | "Frame 4"
  | "Frame 5"
  | "Frame 6"
  | "Variant5"
  | "Variant6"
  | "Variant7"
  | "Variant8"
  | "Variant9"
  | "Variant10"
  | "Variant11"
  | "Variant12";

type LogoAnimationProps = {
  property1?: LogoAnimationVariant;
};

function Frames({ property1 = "Frame 1" }: LogoAnimationProps) {
  const element = (
    <div className="border-[#f0fafa] border-[17.185px] border-solid rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px]" />
  );

  if (property1 === "Frame 4") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Frame 4" data-node-id="726:1566">
        <div className="absolute flex items-center justify-center left-0 size-[88.013px] top-[-0.02px]">
          <div className="flex-none rotate-[180deg]">
            <div className="border-[#f0fafa] border-[5.95px] border-solid rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px]" data-node-id="715:1107" />
          </div>
        </div>
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-0 top-[0.02px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg] scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[0.02px]" data-node-id="715:1109" />
        <div className="absolute flex items-center justify-center left-[99.71px] size-[88.013px] top-0">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Frame 5") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Frame 5" data-node-id="726:1567">
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[-0.02px] top-[99.69px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg]">
            <div className="border-[#f0fafa] border-[5.95px] border-solid rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px]" data-node-id="715:1113" />
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[0.02px] size-[88.013px] top-[99.69px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[0.02px]" data-node-id="715:1115" />
        <div className="absolute flex items-center justify-center left-[99.71px] size-[88.013px] top-0">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Frame 6") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Frame 6" data-node-id="726:1565">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[99.67px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="715:1118" />
        <div className="absolute flex items-center justify-center left-[0.02px] size-[88.013px] top-[99.69px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[0.02px]" data-node-id="715:1120" />
        <div className="absolute flex items-center justify-center left-[99.71px] size-[88.013px] top-0">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant5") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant5" data-node-id="726:1586">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[99.67px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="726:1587" />
        <div className="absolute flex items-center justify-center left-[0.02px] size-[88.013px] top-[99.69px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[0.02px]" data-node-id="726:1589" />
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-0 top-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant6") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant6" data-node-id="726:1605">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[99.67px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="726:1606" />
        <div className="absolute flex items-center justify-center left-[0.02px] size-[88.013px] top-[99.99px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[0.01px] top-[99.99px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[270deg]">
            <div className="border-[#f0fafa] border-[17.185px] border-solid rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px]" data-node-id="726:1608" />
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-[-0.01px] size-[88.013px] top-[99.99px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant7") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant7" data-node-id="726:1610">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[100px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="726:1611" />
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[99.99px] top-[99.97px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[270deg] scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute flex items-center justify-center left-[99.99px] size-[88.013px] top-[99.98px]">
          <div className="flex-none rotate-[180deg]">
            <div className="border-[#f0fafa] border-[17.185px] border-solid rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px]" data-node-id="726:1613" />
          </div>
        </div>
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[99.99px] top-[100px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[270deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant8") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant8" data-node-id="726:1620">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[100px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="726:1621" />
        <div className="absolute flex items-center justify-center left-0 size-[88.013px] top-[99.97px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-0 top-[99.98px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[270deg]">
            <div className="border-[#f0fafa] border-[17.185px] border-solid rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px]" data-node-id="726:1623" />
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-0 size-[88.013px] top-[100px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant9") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant9" data-node-id="726:1635">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[100px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="726:1636" />
        <div className="absolute flex items-center justify-center left-0 size-[88.013px] top-[99.97px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[-0.01px]" data-node-id="726:1638" />
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-0 top-[-0.01px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant10") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant10" data-node-id="726:1640">
        <div className="absolute border-[#f0fafa] border-[44.627px] border-solid left-[100px] rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px] top-[99.69px]" data-node-id="726:1641" />
        <div className="absolute flex items-center justify-center left-0 size-[88.013px] top-[99.97px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[-0.01px]" data-node-id="726:1643" />
        <div className="absolute flex items-center justify-center left-[100px] size-[88.013px] top-[-0.01px]">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant11") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant11" data-node-id="726:1653">
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[-0.01px] top-[99.69px] w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg]">
            <div className="border-[#f0fafa] border-[44.627px] border-solid opacity-0 rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px]" data-node-id="726:1654" />
          </div>
        </div>
        <div className="absolute flex items-center justify-center left-0 size-[88.013px] top-[99.97px]">
          <div className="flex-none scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-[-0.01px]" data-node-id="726:1656" />
        <div className="absolute flex items-center justify-center left-[100px] size-[88.013px] top-[-0.01px]">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }
  if (property1 === "Variant12") {
    return (
      <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Variant12" data-node-id="726:1658">
        <div className="absolute flex items-center justify-center left-[0.14px] size-[88.013px] top-[-0.01px]">
          <div className="flex-none rotate-[180deg]">
            <div className="border-[#f0fafa] border-[44.627px] border-solid opacity-0 rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px]" data-node-id="726:1659" />
          </div>
        </div>
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[-0.15px] top-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[90deg] scale-y-[-100%]">{element}</div>
        </div>
        <div className="absolute border-[#f0fafa] border-[17.185px] border-solid left-0 rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px] top-0" data-node-id="726:1661" />
        <div className="absolute flex items-center justify-center left-[100px] size-[88.013px] top-[-0.01px]">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-[187.435px] translate-x-[-50%] translate-y-[-50%]" data-name="Property 1=Frame 1" data-node-id="726:1568">
      <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[99.71px] top-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <div className="border-[#f0fafa] border-[5.95px] border-solid rounded-bl-[61.376px] rounded-br-[61.376px] rounded-tr-[61.376px] size-[88.013px]" data-node-id="715:978" />
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[99.67px] size-[88.013px] top-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
      </div>
      <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-[99.67px] top-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <div className="border-[#f0fafa] border-[17.185px] border-solid rounded-bl-[19.64px] rounded-tl-[44.006px] rounded-tr-[19.64px] size-[88.013px]" data-node-id="715:979" />
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[99.71px] size-[88.013px] top-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">{element}</div>
      </div>
    </div>
  );
}

export type AnimatedLogoProps = {
  className?: string;
  speedMs?: number; // tiempo entre frames
  pauseOnHover?: boolean;
  scale?: number; // escala del lienzo base ~187.435px
  autoplay?: boolean;
};

const VARIANTS: LogoAnimationVariant[] = [
  "Frame 1",
  "Frame 4",
  "Frame 5",
  "Frame 6",
  "Variant5",
  "Variant6",
  "Variant7",
  "Variant8",
  "Variant9",
  "Variant10",
  "Variant11",
  "Variant12",
];

export default function LogoAnimation({
  className,
  speedMs = 120,
  pauseOnHover = true,
  scale = 1,
  autoplay = true,
}: AnimatedLogoProps) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!autoplay || paused) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % VARIANTS.length);
    }, speedMs);
    return () => clearInterval(id);
  }, [autoplay, paused, speedMs]);

  const variant = VARIANTS[index] ?? "Frame 1";

  return (
    <div
      className={className}
      style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
      aria-label="Animated logo"
      role="img"
    >
      <Frames property1={variant} />
    </div>
  );
}



