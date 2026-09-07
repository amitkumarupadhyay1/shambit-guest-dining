"use client";
import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, value, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";
    return (
      <div className="relative">
        <input
          ref={ref}
          value={value}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={cn(
            "w-full px-4 pt-6 pb-2 text-base bg-white border-2 rounded-2xl outline-none transition-all peer",
            focused ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-200",
            error ? "border-red-400 ring-4 ring-red-400/10" : "",
            className
          )}
          placeholder=" "
          {...props}
        />
        <motion.label
          animate={{
            y: focused || hasValue ? -8 : 0,
            scale: focused || hasValue ? 0.85 : 1,
          }}
          className={cn(
            "absolute left-4 top-4 text-slate-400 pointer-events-none origin-left transition-colors",
            focused ? "text-emerald-600" : ""
          )}
        >
          {label}
        </motion.label>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-red-500 text-sm mt-1 ml-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Input.displayName = "Input";
