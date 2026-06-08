"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
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
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div 
      className={`space-y-1.5 text-xs w-full ${className} ${disabled ? "opacity-60 pointer-events-none" : ""}`} 
      ref={dropdownRef}
    >
      {label && (
        <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Dropdown Toggle Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full ${
            size === "sm" ? "h-8 px-2.5 rounded-lg" : "h-10 px-4 rounded-xl"
          } border border-[#e2dacd] bg-[#faf8f4] ${
            textColorClassName || "text-[#141f19]"
          } flex items-center justify-between transition-all focus:outline-none focus:border-[#b07e3a] hover:bg-white cursor-pointer`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-[#b07e3a]" />}
            <span className={`font-semibold ${size === "sm" ? "text-[10px]" : "text-sm"} truncate text-[#141f19]`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[#8a9e90] flex-shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-[#2d4c38]" : ""
            }`}
          />
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl border border-[#e2dacd] bg-white shadow-xl overflow-hidden animate-scale-up py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full ${
                    size === "sm" ? "h-8 px-2.5 text-[10px]" : "h-10 px-4 text-xs"
                  } flex items-center justify-between text-left transition-colors font-semibold cursor-pointer ${
                    isSelected
                      ? "bg-[#e8f0eb] text-[#2d4c38]"
                      : "text-[#5e6f64] hover:bg-[#f5f2ed] hover:text-[#141f19]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <opt.icon className={`h-4 w-4 ${isSelected ? "text-[#2d4c38]" : "text-[#b07e3a]"}`} />}
                    <span className={`${size === "sm" ? "text-[10px]" : "text-sm"} truncate`}>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-[#2d4c38] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
