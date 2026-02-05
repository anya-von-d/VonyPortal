import React, { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({ 
  options = [], 
  value, 
  onSelect, 
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found."
}) {
  const [open, setOpen] = useState(false)
  
  // Ensure options is always an array and handle selection safely
  const safeOptions = Array.isArray(options) ? options : [];

  const handleSelect = (selectedValue) => {
    try {
      const newValue = selectedValue === value ? "" : selectedValue;
      if (onSelect && typeof onSelect === 'function') {
        onSelect(newValue);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error in combobox selection:', error);
      setOpen(false);
    }
  };

  const selectedOption = safeOptions.find((option) => option && option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {safeOptions.map((option) => {
              if (!option || !option.value) return null;
              
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.content || option.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}