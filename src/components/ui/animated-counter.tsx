"use client";

import React, { useEffect, useState } from "react";
import { formatINR } from "@/lib/msme-calculator";

interface AnimatedCurrencyProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedCurrency({
  value,
  className = "",
  duration = 450,
}: AnimatedCurrencyProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const targetValue = value;

    if (startValue === targetValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  return (
    <span className={`tabular-nums font-feature-settings-tnum ${className}`}>
      {formatINR(displayValue)}
    </span>
  );
}
