import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { DriverVehicle } from '@features/profile/profile.api';

interface Props {
  vehicles: DriverVehicle[];
  value: string;
  onChange: (next: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  id?: string;
}

export function AssignedVehicleSelect({
  vehicles,
  value,
  onChange,
  isLoading,
  placeholder = 'Select vehicle…',
  id = 'attendance-vehicle',
}: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        String(v.vehicleNumber ?? '').toLowerCase().includes(q) ||
        String(v.vehicleType ?? '').toLowerCase().includes(q),
    );
  }, [vehicles, query]);

  const selected = vehicles.find((v) => v.vehicleNumber === value);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector(
      `[data-idx="${activeIndex}"]`,
    ) as HTMLElement | null;
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const pick = (v: DriverVehicle): void => {
    if (v.vehicleNumber) onChange(v.vehicleNumber);
    setOpen(false);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const v = filtered[activeIndex];
      if (v) pick(v);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition ${
          open ? 'border-yellow-400 bg-yellow-50' : 'border-black bg-white hover:bg-gray-50'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected?.vehicleNumber ? (
            <>
              <span className="font-mono text-sm font-bold uppercase">
                {selected.vehicleNumber}
              </span>
              {selected.vehicleType ? (
                <span className="ml-2 text-[11px] text-gray-500">{selected.vehicleType}</span>
              ) : null}
            </>
          ) : (
            <span className="text-sm text-gray-400">
              {vehicles.length === 0 && !isLoading ? 'No vehicles assigned' : placeholder}
            </span>
          )}
        </span>
        <svg
          className={`ml-2 h-4 w-4 flex-none text-gray-500 transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0l-4.25-4.4a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl"
        >
          <div className="border-b border-gray-200 p-2">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search vehicle…"
                aria-controls={`${id}-listbox`}
                aria-activedescendant={`${id}-opt-${activeIndex}`}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-7 text-sm focus:border-black focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="max-h-60 space-y-0.5 overflow-y-auto p-1"
          >
            {isLoading ? (
              <li className="p-3 text-center text-xs text-gray-500">Loading vehicles…</li>
            ) : filtered.length === 0 ? (
              <li className="p-3 text-center text-xs text-gray-500">
                {query
                  ? `No vehicles match “${query}”.`
                  : 'No vehicles assigned. Ask admin to assign one.'}
              </li>
            ) : (
              filtered.map((v, idx) => {
                const isSelected = v.vehicleNumber === value;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={v.vehicleNumber}
                    id={`${id}-opt-${idx}`}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => pick(v)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`cursor-pointer rounded-md px-3 py-2 text-sm transition ${
                      isSelected
                        ? 'bg-yellow-400 font-bold text-black'
                        : isActive
                          ? 'bg-yellow-100 text-gray-900'
                          : 'text-gray-700 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono uppercase">{v.vehicleNumber}</span>
                      {v.vehicleType ? (
                        <span className="text-[10px] font-normal text-gray-500">
                          {v.vehicleType}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {value ? (
            <div className="border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="w-full rounded-md bg-gray-100 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-200"
              >
                Clear selection
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
