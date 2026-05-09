import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { isBefore, isSameDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { formatRangeLabel, PRESETS, type DashboardRangePreset } from './date-range'

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
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between sm:w-auto sm:min-w-[240px]"
        >
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
