"use client";

import React, { useRef } from "react";

interface VerificationCodeInputProps {
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: VerificationCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Normaliza o valor para sempre conter apenas [A-Z0-9] em maiúsculas (máx 6)
  const sanitized = value
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);

  const slots = Array.from({ length: 6 }, (_, index) => sanitized[index] || "");

  function updateSlot(index: number, rawChar: string) {
    const clean = rawChar.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!clean && rawChar !== "") {
      // Símbolo especial rejeitado
      return;
    }

    const nextSlots = [...slots];
    nextSlots[index] = clean.slice(-1);
    const nextCode = nextSlots.join("");
    onChange(nextCode);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const nextSlots = [...slots];
      if (nextSlots[index]) {
        nextSlots[index] = "";
        onChange(nextSlots.join(""));
      } else if (index > 0) {
        nextSlots[index - 1] = "";
        onChange(nextSlots.join(""));
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
      return;
    }

    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
      return;
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData("text/plain")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);

    if (!pastedText) return;

    onChange(pastedText);
    const targetIndex = Math.min(pastedText.length, 5);
    inputRefs.current[targetIndex]?.focus();
  }

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label="Código de verificação de 6 caracteres"
    >
      {slots.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          spellCheck={false}
          maxLength={2}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          value={char}
          onChange={(e) => updateSlot(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`Dígito ${index + 1} do código`}
          className={`h-12 w-10 sm:h-14 sm:w-12 rounded-lg border text-center font-mono text-lg sm:text-xl font-bold uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50 ${
            char
              ? "border-torch bg-dungeon-abyss text-torch-glow shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              : "border-stone-700 bg-dungeon-abyss/90 text-dungeon-parchment focus:border-torch"
          }`}
        />
      ))}
    </div>
  );
}
