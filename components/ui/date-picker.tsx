"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2026, index, 1)));
const valueFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function DatePicker({ name, value, onChange, required = false, label = "Choose a date" }: { name: string; value: string; onChange: (value: string) => void; required?: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pickerView, setPickerView] = useState<"days" | "months" | "years">("days");
  const [visibleMonth, setVisibleMonth] = useState(() => value ? fromDateValue(value) : new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? fromDateValue(value) : undefined;
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(1 - firstDay.getDay());
  const dates = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const yearOptions = Array.from({ length: 12 }, (_, index) => visibleMonth.getFullYear() - 5 + index);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function selectDate(date: Date) {
    onChange(toDateValue(date));
    setVisibleMonth(date);
    setPickerView("days");
    setOpen(false);
  }

  return <div ref={rootRef} className="relative">
    <input type="hidden" name={name} value={value} required={required} autoComplete="off" />
    <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={label} onClick={() => { setPickerView("days"); setOpen((current) => !current); }} className={cn("!flex !h-11 !w-full !flex-none !items-center !justify-start !gap-3 rounded-xl border bg-surface px-3 !text-left text-sm font-semibold transition", value ? "border-line text-ink" : "border-line text-muted", "hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40")}>
      <CalendarDays size={17} className="shrink-0" />
      <span>{selectedDate ? valueFormatter.format(selectedDate) : label}</span>
    </button>
    {open && <div role="dialog" aria-label="Calendar" className="z-50 mt-2 w-full rounded-2xl border border-line bg-surface p-3 shadow-[0_20px_60px_rgba(0,0,0,.48)]">
      {pickerView === "days" ? <><div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="icon-button !size-8"><ChevronLeft size={17} /></button>
        <div className="flex items-center gap-1"><button type="button" aria-label="Choose month" onClick={() => setPickerView("months")} className="!inline-flex !h-auto !w-auto !items-center rounded-lg px-1.5 py-1 text-sm font-extrabold hover:bg-soft">{months[visibleMonth.getMonth()]}</button><button type="button" aria-label="Choose year" onClick={() => setPickerView("years")} className="!inline-flex !h-auto !w-auto !items-center rounded-lg px-1.5 py-1 text-sm font-extrabold hover:bg-soft">{visibleMonth.getFullYear()}</button></div>
        <button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="icon-button !size-8"><ChevronRight size={17} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[.65rem] font-extrabold uppercase tracking-[.08em] text-muted">{weekdays.map((day) => <span key={day} className="py-1">{day.slice(0, 1)}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">{dates.map((date) => {
        const dateValue = toDateValue(date);
        const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
        const isSelected = dateValue === value;
        const isToday = dateValue === toDateValue(new Date());

        return <button key={dateValue} type="button" aria-label={valueFormatter.format(date)} aria-pressed={isSelected} onClick={() => selectDate(date)} className={cn("grid size-9 place-items-center rounded-xl text-sm font-bold transition", !isCurrentMonth && "text-muted/35", isCurrentMonth && !isSelected && "hover:bg-soft hover:text-ink", isToday && !isSelected && "ring-1 ring-accent/60", isSelected && "bg-accent text-[#10140a]")}>{date.getDate()}</button>;
      })}</div></> : pickerView === "months" ? <><div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Back to dates" onClick={() => setPickerView("days")} className="icon-button !size-8"><ChevronLeft size={17} /></button><p className="text-sm font-extrabold">Choose month</p><span className="size-8" /></div><div className="grid grid-cols-3 gap-2">{months.map((month, index) => <button key={month} type="button" aria-pressed={index === visibleMonth.getMonth()} onClick={() => { setVisibleMonth((current) => new Date(current.getFullYear(), index, 1)); setPickerView("days"); }} className={cn("grid h-10 place-items-center rounded-xl text-sm font-bold transition hover:bg-soft", index === visibleMonth.getMonth() && "bg-accent text-[#10140a]")}>{month}</button>)}</div></> : <><div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Previous years" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear() - 12, current.getMonth(), 1))} className="icon-button !size-8"><ChevronLeft size={17} /></button><p className="text-sm font-extrabold">{yearOptions[0]}–{yearOptions.at(-1)}</p><button type="button" aria-label="Next years" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear() + 12, current.getMonth(), 1))} className="icon-button !size-8"><ChevronRight size={17} /></button></div><div className="grid grid-cols-3 gap-2">{yearOptions.map((year) => <button key={year} type="button" aria-pressed={year === visibleMonth.getFullYear()} onClick={() => { setVisibleMonth((current) => new Date(year, current.getMonth(), 1)); setPickerView("days"); }} className={cn("grid h-10 place-items-center rounded-xl text-sm font-bold transition hover:bg-soft", year === visibleMonth.getFullYear() && "bg-accent text-[#10140a]")}>{year}</button>)}</div></>}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs font-bold">
        <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-muted transition hover:text-ink">Clear</button>
        <button type="button" onClick={() => selectDate(new Date())} className="text-accent transition hover:text-[#d5ff75]">Today</button>
      </div>
    </div>}
  </div>;
}
