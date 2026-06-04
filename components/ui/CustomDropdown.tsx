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
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option",
  className = "",
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
    <div className={`space-y-1.5 text-xs w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Dropdown Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white flex items-center justify-between transition-all focus:outline-none focus:border-[#b07e3a] hover:bg-white/[0.01]"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-[#b07e3a]" />}
            <span className="font-semibold text-sm truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[#a3b2a9] transition-transform duration-300 ${
              isOpen ? "transform rotate-180 text-white" : ""
            }`}
          />
        </button>

        {/* Dropdown Options Drawer */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-[#1a241e] bg-[#0c100e]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-scale-up py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full h-10 px-4 flex items-center justify-between text-left transition-colors text-xs font-semibold ${
                    isSelected
                      ? "bg-[#2d4c38] text-white"
                      : "text-[#a3b2a9] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <opt.icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-[#b07e3a]"}`} />}
                    <span className="text-sm truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
