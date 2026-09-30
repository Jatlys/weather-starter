import { useStore } from '../state/store';
import { CloseIcon, CloudIcon, DropletIcon, HomeIcon } from './icons';
import { formatReading, formatTemperature, formatTime } from './format';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Location } from '../types';

interface SidebarCardProps {
  location: Location;
  isHome: boolean;
}

export function SidebarCard({ location, isHome }: SidebarCardProps) {
  const { selectedId, select, remove, deletingId } = useStore();
  const isSelected = selectedId === location.id;
  const isDeleting = deletingId === location.id;
  const observed = formatTime(location.weather.observed_at);
  const area =
    location.weather.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  const condition = location.weather.condition || '-';
  const temperature = formatTemperature(location.weather.temperature_c);
  const high = formatTemperature(location.weather.forecast_high_c);
  const low = formatTemperature(location.weather.forecast_low_c);
  const humidity = formatReading(location.weather.humidity_percent, '%');
  const rainfall = formatReading(location.weather.rainfall_mm, ' mm', 1);

  const onSelect = () => select(location.id);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };
  const onDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void remove(location.id);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={isSelected}
      className={`relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left backdrop-blur-xl transition ${
        isSelected
          ? 'border-white/30 bg-white/20 shadow-lg shadow-black/20'
          : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
      }`}
    >
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label={`Delete ${area}`}
        title="Delete location"
        className="absolute right-2 top-2 rounded-full p-1 text-white/50 transition hover:bg-white/15 hover:text-white focus-visible:bg-white/15 focus-visible:text-white disabled:cursor-wait disabled:opacity-40"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start justify-between gap-3 pl-4 pr-9 pt-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold leading-tight text-white">{area}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
            {isHome ? (
              <>
                <span>My Location</span>
                <span className="text-white/40">·</span>
                <HomeIcon className="h-3 w-3" />
                <span>Home</span>
              </>
            ) : observed ? (
              <span>{observed}</span>
            ) : (
              <span className="text-white/50">Not refreshed</span>
            )}
          </div>
        </div>
        <div className="text-3xl font-light tabular-nums text-white/90">{temperature}</div>
      </div>
      <div className="mt-2 flex items-center gap-4 px-4 text-[11px] tabular-nums text-white/75">
        <span className="flex items-center gap-1" title="Relative humidity">
          <DropletIcon className="h-3 w-3 text-sky-200/80" />
          <span className="text-white/55">Humidity</span>
          <span>{humidity}</span>
        </span>
        <span className="flex items-center gap-1" title="Rainfall (latest reading)">
          <span className="text-white/55">Rain</span>
          <span>{rainfall}</span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <CloudIcon className="h-4 w-4 text-white/70" />
          <span>{condition}</span>
        </div>
        <div className="text-white/60 tabular-nums">
          H:{high} L:{low}
        </div>
      </div>
    </div>
  );
}
