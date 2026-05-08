import { useEffect, useRef, useState } from 'react';
import { useVehicleSearch } from '@features/tracker/tracker.hooks';
import { useDebounce } from '@shared/hooks/useDebounce';
import type { VehicleRow } from '@features/tracker/tracker.api';

interface Props {
  value: string;
  onChange: (next: string) => void;
  pageSize?: number;
  debounceMs?: number;
  placeholder?: string;
  id?: string;
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_DEBOUNCE_MS = 300;

export function VehicleSearchSelect({
  value,
  onChange,
  pageSize = DEFAULT_PAGE_SIZE,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  placeholder = 'Search vehicle…',
  id = 'sup-vehicle-search',
}: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), debounceMs);
  const isTyping = debouncedQuery !== query.trim();

  const { data, isFetching } = useVehicleSearch(debouncedQuery, page, pageSize);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
    setActiveIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const display = open
    ? query
    : value
      ? value
      : '';

  const pick = (v: VehicleRow): void => {
    onChange(v.number);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'PageDown' && safePage < totalPages) {
      e.preventDefault();
      setPage(safePage + 1);
      setActiveIndex(0);
    } else if (e.key === 'PageUp' && safePage > 1) {
      e.preventDefault();
      setPage(safePage - 1);
      setActiveIndex(0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = items[activeIndex];
      if (target) pick(target);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && value) {
      onChange('');
    }
  };

  const showLoading = isTyping || isFetching;

  return (
    <div ref={wrapperRef} className="sup-vsel" style={{ position: 'relative' }}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className="sup-emp-field-input-wide"
        placeholder={placeholder}
        value={display}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        role="combobox"
      />
      {value ? (
        <button
          type="button"
          className="sup-vsel-clear"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange('');
            setQuery('');
            inputRef.current?.focus();
          }}
          aria-label="Clear vehicle"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#888',
          }}
        >
          ✕
        </button>
      ) : null}

      {open ? (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="sup-vsel-pop"
          style={{
            position: 'absolute',
            zIndex: 30,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: 360,
            overflowY: 'auto',
            background: 'white',
            border: '2px solid #111',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {showLoading && items.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: '#666' }}>Searching…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: '#666' }}>
              {debouncedQuery
                ? `No vehicles match “${debouncedQuery}”.`
                : 'No vehicles available.'}
            </div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', margin: 0, padding: 4 }}>
                {items.map((v, i) => {
                  const active = i === activeIndex;
                  const isSelected = v.number === value;
                  return (
                    <li
                      key={v.number}
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(v);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: 4,
                        fontSize: 13,
                        background: active ? '#fef3c7' : isSelected ? '#fff7ed' : 'transparent',
                        fontWeight: isSelected ? 700 : 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span>{v.number}</span>
                      {v.type ? (
                        <span style={{ color: '#888', fontWeight: 400 }}>{v.type}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 10px',
                  borderTop: '1px solid #eee',
                  fontSize: 12,
                  background: '#fafafa',
                }}
              >
                <span style={{ color: '#666' }}>
                  {showLoading
                    ? 'Searching…'
                    : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, total)} of ${total}`}
                </span>
                {totalPages > 1 ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (safePage > 1) {
                          setPage(safePage - 1);
                          setActiveIndex(0);
                        }
                      }}
                      disabled={safePage === 1 || showLoading}
                      className="sup-btn sup-btn-outline"
                      style={{ padding: '2px 8px', fontSize: 12 }}
                    >
                      ‹ Prev
                    </button>
                    <span style={{ alignSelf: 'center', minWidth: 56, textAlign: 'center' }}>
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (safePage < totalPages) {
                          setPage(safePage + 1);
                          setActiveIndex(0);
                        }
                      }}
                      disabled={safePage === totalPages || showLoading}
                      className="sup-btn sup-btn-outline"
                      style={{ padding: '2px 8px', fontSize: 12 }}
                    >
                      Next ›
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
