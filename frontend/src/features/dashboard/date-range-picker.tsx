import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import {
  endOfDay,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

const PRESETS = ['wtd', 'mtd', '7d', '14d', '30d'] as const

export type DashboardRangePreset = (typeof PRESETS)[number] | 'custom'

type DashboardDateRangePickerProps = {
  value: DateRange
  preset: DashboardRangePreset
  onPresetChange: (preset: DashboardRangePreset) => void
  onRangeChange: (range: DateRange) => void
}

export function DashboardDateRangePicker({
  value,
  preset,
  onPresetChange,
  onRangeChange,
}: DashboardDateRangePickerProps) {
  const label = formatRangeLabel(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between sm:w-auto sm:min-w-[240px]">
          <span className="flex items-center gap-2">
            <CalendarIcon data-icon="inline-start" />
            {label}
          </span>
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <ToggleGroup
            type="single"
            value={preset === 'custom' ? '' : preset}
            onValueChange={(next) => next && onPresetChange(next as DashboardRangePreset)}
            className="grid min-w-[170px] grid-cols-1 items-start gap-1 border-b p-3 sm:border-r sm:border-b-0"
          >
            {PRESETS.map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={presetLabel(value)}
                className={cn('justify-start')}
              >
                {presetLabel(value)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="p-3">
            <Calendar
              numberOfMonths={2}
              showOutsideDays={false}
              modifiers={{
                selected: value,
                range_start: value.from,
                range_end: value.to,
                range_middle:
                  value.from && value.to
                    ? {
                        after: value.from,
                        before: value.to,
                      }
                    : undefined,
              }}
              onDayClick={(day, modifiers) => {
                if (modifiers.disabled || modifiers.hidden) return
                if (!value.from || value.to) {
                  onRangeChange({ from: day, to: undefined })
                  return
                }

                if (isSameDay(day, value.from)) {
                  onRangeChange({ from: day, to: day })
                  return
                }

                if (isBefore(day, value.from)) {
                  onRangeChange({ from: day, to: value.from })
                  return
                }

                onRangeChange({ from: value.from, to: day })
              }}
              defaultMonth={value.from}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function presetToDateRange(preset: Exclude<DashboardRangePreset, 'custom'>): DateRange {
  const now = new Date()

  switch (preset) {
    case 'wtd':
      return { from: startOfWeek(now, { weekStartsOn: 0 }), to: now }
    case 'mtd':
      return { from: startOfMonth(now), to: now }
    case '7d':
      return { from: subDays(now, 6), to: now }
    case '14d':
      return { from: subDays(now, 13), to: now }
    case '30d':
      return { from: subDays(now, 29), to: now }
  }
}

export function formatRangeLabel(range: DateRange) {
  if (!range.from) return 'Select date range'
  if (!range.to) return format(range.from, 'MM/dd/yy')
  return `${format(range.from, 'MM/dd/yy')} - ${format(range.to, 'MM/dd/yy')}`
}

export function rangeToDashboardQuery(range: DateRange) {
  if (!range.from) return ''
  const start = startOfDay(range.from).toISOString()
  const end = endOfDay(range.to ?? range.from).toISOString()
  const params = new URLSearchParams({ start, end })
  return params.toString()
}

export function rangeToUsageRange(range: DateRange) {
  if (!range.from) return '7d'
  const end = range.to ?? range.from
  const spanMs = endOfDay(end).getTime() - startOfDay(range.from).getTime()
  const spanDays = Math.max(1, Math.ceil(spanMs / (24 * 60 * 60 * 1000)))
  if (spanDays <= 1) return '24h'
  if (spanDays <= 7) return '7d'
  if (spanDays <= 30) return '30d'
  return 'all'
}

function presetLabel(value: Exclude<DashboardRangePreset, 'custom'>) {
  switch (value) {
    case 'wtd':
      return 'Week to date'
    case 'mtd':
      return 'Month to date'
    case '7d':
      return 'Last 7 days'
    case '14d':
      return 'Last 14 days'
    case '30d':
      return 'Last 30 days'
  }
}
