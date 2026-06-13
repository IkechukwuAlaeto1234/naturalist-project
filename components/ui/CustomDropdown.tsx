"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { createPortal } from "react-dom";
import { CountryFlag } from "@/components/ui/CountryFlag";

interface Option {
  value: string;
  label: string;
  buttonLabel?: string; // Optional compact label for the collapsed button view
  icon?: React.ComponentType<{ className?: string }>;
  countryCode?: string; // Optional code to render a CountryFlag
  subLabel?: string;    // Optional secondary label, e.g. dial code "+234"
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  textColorClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option",
  className = "",
  size = "md",
  textColorClassName = "",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !document.getElementById("dropdown-portal-menu")?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      setIsOpen(false);
    };
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      updateCoords();
      setSearchQuery("");
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const optionsMenu = isOpen && (
    <div
      id="dropdown-portal-menu"
      style={{
        position: "absolute",
        top: coords.top + 6,
        left: coords.left,
        width: coords.width,
      }}
      className="z-[9999] bg-white dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-2xl shadow-xl p-1.5 animate-menu-pop flex flex-col"
    >
      {/* Search Input */}
      {searchable && (
        <div className="p-2 border-b border-[#e2dacd]/60 dark:border-white/[0.08] flex items-center gap-2 mb-1.5 px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent border-none focus:outline-none text-xs text-foreground placeholder:text-muted-foreground/50"
            autoFocus
          />
        </div>
      )}

      {/* List of Options */}
      <div className="space-y-0.5 max-h-60 overflow-y-auto pr-1 custom-thin-scroll">
        {filteredOptions.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground text-center">No results</p>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = opt.value === value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full h-10 px-3 rounded-xl flex items-center justify-between transition-all font-semibold cursor-pointer text-left text-xs ${
                  isSelected
                    ? "bg-[#e8f0eb] dark:bg-emerald-950/30 text-[#2d4c38] dark:text-emerald-400"
                    : "text-foreground dark:text-emerald-100 hover:bg-muted dark:hover:bg-[#1a241e] bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {Icon && <Icon className={`h-4 w-4 ${isSelected ? "text-[#2d4c38] dark:text-emerald-400" : "text-[#b07e3a]"}`} />}
                  {opt.countryCode && (
                    <CountryFlag countryCode={opt.countryCode} size={18} className="flex-shrink-0 mr-0.5" />
                  )}
                  <span className={`font-medium ${isSelected ? "text-[#2d4c38] dark:text-emerald-400" : "text-foreground dark:text-emerald-100"}`}>{opt.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {opt.subLabel && (
                    <span className="tabular-nums text-muted-foreground text-[11px] font-normal mr-1">
                      {opt.subLabel}
                    </span>
                  )}
                  {isSelected && <Check className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div 
      className={`space-y-2 text-xs w-full ${className} ${disabled ? "opacity-60 pointer-events-none" : ""}`} 
      ref={dropdownRef}
    >
      {label && (
        <label className="font-bold text-muted-foreground uppercase tracking-widest block">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Dropdown Toggle Button */}
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`w-full ${
            size === "sm" ? "h-8 px-2.5 rounded-lg" : "h-12 px-4 rounded-xl"
          } border border-[#e2dacd] bg-[#faf8f4] dark:bg-[#151c18] ${
            textColorClassName || "text-[#141f19] dark:text-emerald-100"
          } flex items-center justify-between transition-all focus:outline-none focus:border-[#b07e3a] hover:bg-white dark:hover:bg-[#1a241e] cursor-pointer`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-[#b07e3a]" />}
            {selectedOption?.countryCode && (
              <CountryFlag countryCode={selectedOption.countryCode} size={18} className="flex-shrink-0" />
            )}
            <span className={`font-semibold ${size === "sm" ? "text-[10px]" : "text-sm"} truncate text-[#141f19] dark:text-[#a3b2a9]`}>
              {selectedOption ? (selectedOption.buttonLabel || selectedOption.label) : placeholder}
            </span>
            {selectedOption?.subLabel && (
              <span className="text-xs text-muted-foreground/80 tabular-nums ml-1">
                {selectedOption.subLabel}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[#8a9e90] flex-shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-[#2d4c38] dark:text-emerald-400" : ""
            }`}
          />
        </button>

        {/* Render portal dropdown options directly in body so it escapes parent stacking context */}
        {mounted && isOpen && createPortal(optionsMenu, document.body)}
      </div>
    </div>
  );
}
