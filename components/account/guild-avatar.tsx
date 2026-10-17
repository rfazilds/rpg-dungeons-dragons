"use client";

import React from "react";
import { Swords, Sparkles, Crosshair, ShieldPlus, Dices } from "lucide-react";

export type GuildAvatarType =
  | "oauth"
  | "preset_warrior"
  | "preset_mage"
  | "preset_rogue"
  | "preset_cleric"
  | "preset_d20"
  | "preset";

export interface GuildAvatarPresetInfo {
  id: GuildAvatarType;
  label: string;
  subtitle: string;
  gradient: string;
  border: string;
  iconColor: string;
}

export const GUILD_AVATAR_PRESETS: GuildAvatarPresetInfo[] = [
  {
    id: "preset_warrior",
    label: "Guerreiro da vanguarda",
    subtitle: "Aço, força e honra",
    gradient: "from-red-950 via-stone-900 to-amber-950",
    border: "border-red-500/50",
    iconColor: "text-red-400",
  },
  {
    id: "preset_mage",
    label: "Arcanista da torre",
    subtitle: "Grimório e magia arcana",
    gradient: "from-indigo-950 via-slate-900 to-purple-950",
    border: "border-indigo-400/50",
    iconColor: "text-indigo-300",
  },
  {
    id: "preset_rogue",
    label: "Ladino das sombras",
    subtitle: "Furtividade e precisão",
    gradient: "from-emerald-950 via-stone-900 to-slate-950",
    border: "border-emerald-500/50",
    iconColor: "text-emerald-400",
  },
  {
    id: "preset_cleric",
    label: "Clérigo do santuário",
    subtitle: "Fé divina e proteção",
    gradient: "from-amber-950 via-stone-900 to-yellow-950",
    border: "border-amber-400/60",
    iconColor: "text-amber-300",
  },
  {
    id: "preset_d20",
    label: "Mestre do d20",
    subtitle: "Símbolo clássico da mesa",
    gradient: "from-stone-900 via-dungeon-abyss to-amber-950",
    border: "border-torch/60",
    iconColor: "text-torch-glow",
  },
];

interface GuildAvatarProps {
  avatarType?: string | null;
  avatarUrl?: string | null;
  oauthImage?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function GuildAvatar({
  avatarType = "preset_d20",
  avatarUrl,
  oauthImage,
  name,
  size = "md",
  className = "",
}: GuildAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  }[size];

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  }[size];

  const resolvedImageUrl =
    avatarType === "oauth" ? oauthImage || avatarUrl : null;

  if (resolvedImageUrl && resolvedImageUrl.startsWith("http")) {
    return (
      <div
        className={`relative overflow-hidden rounded-full border border-torch/50 bg-dungeon-abyss shrink-0 ${sizeClasses} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedImageUrl}
          alt={name || "Avatar da guilda"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const preset =
    GUILD_AVATAR_PRESETS.find((p) => p.id === avatarType) ||
    GUILD_AVATAR_PRESETS[4];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border bg-gradient-to-br shrink-0 shadow-inner ${preset.gradient} ${preset.border} ${sizeClasses} ${className}`}
      title={preset.label}
    >
      {preset.id === "preset_warrior" && (
        <Swords className={`${iconSizes} ${preset.iconColor}`} />
      )}
      {preset.id === "preset_mage" && (
        <Sparkles className={`${iconSizes} ${preset.iconColor}`} />
      )}
      {preset.id === "preset_rogue" && (
        <Crosshair className={`${iconSizes} ${preset.iconColor}`} />
      )}
      {preset.id === "preset_cleric" && (
        <ShieldPlus className={`${iconSizes} ${preset.iconColor}`} />
      )}
      {(preset.id === "preset_d20" || preset.id === "preset") && (
        <Dices className={`${iconSizes} ${preset.iconColor}`} />
      )}
    </div>
  );
}
