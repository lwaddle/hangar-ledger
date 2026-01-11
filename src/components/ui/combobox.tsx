"use client";

import * as React from "react";
import { Command } from "cmdk";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (inputValue: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createNewLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function Combobox({
  options,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  createNewLabel = "Create",
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateNew =
    onCreateNew &&
    inputValue.trim().length > 0 &&
    !options.some(
      (opt) => opt.label.toLowerCase() === inputValue.trim().toLowerCase()
    );

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(selectedValue: string) {
    onValueChange(selectedValue);
    setOpen(false);
    setInputValue("");
  }

  function handleCreateNew() {
    if (onCreateNew && inputValue.trim()) {
      onCreateNew(inputValue.trim());
      setInputValue("");
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border shadow-md animate-in fade-in-0 zoom-in-95">
          <Command className="w-full" shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Command.Input
                value={inputValue}
                onValueChange={setInputValue}
                placeholder={searchPlaceholder}
                className="placeholder:text-muted-foreground flex h-10 w-full bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 && !showCreateNew && (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </Command.Empty>
              )}
              {filteredOptions.map((option) => (
                <Command.Item
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <span className="absolute right-2 flex size-3.5 items-center justify-center">
                      <CheckIcon className="size-4" />
                    </span>
                  )}
                </Command.Item>
              ))}
              {showCreateNew && (
                <Command.Item
                  value={`create-${inputValue}`}
                  onSelect={handleCreateNew}
                  className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground border-t mt-1 pt-2"
                >
                  <PlusIcon className="size-4" />
                  <span>
                    {createNewLabel} &quot;{inputValue.trim()}&quot;
                  </span>
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
