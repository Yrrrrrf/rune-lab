<!--
  DatePicker — Locale-aware calendar grid primitive.
  Reads LanguageStore from context for weekday/month names.
  Zero domain knowledge.
-->
<script module lang="ts">
    export interface DatePickerProps {
        /** Currently selected date */
        value?: Date | string;
        /** Disabled dates (cannot be selected) */
        disabledDates?: Date[];
        /** Highlighted dates (visual emphasis) */
        highlightedDates?: Date[];
        /** Minimum selectable date */
        minDate?: Date;
        /** Maximum selectable date */
        maxDate?: Date;
        /** Fired when a date is selected */
        onchange?: (date: Date) => void;
    }
</script>

<script lang="ts">
    import { getLanguageStore } from "@internal/state";

    let {
        value,
        disabledDates = [],
        highlightedDates = [],
        minDate,
        maxDate,
        onchange,
    }: DatePickerProps = $props();

    const languageStore = getLanguageStore();

    // Parse initial value
    function parseDate(d?: Date | string): Date {
        if (!d) return new Date();
        return typeof d === "string" ? new Date(d) : d;
    }

    let selectedDate = $state(parseDate(value));
    let viewYear = $state(parseDate(value).getFullYear());
    let viewMonth = $state(parseDate(value).getMonth());

    // Locale-aware formatting
    const locale = $derived(String(languageStore.current) || "en");

    const weekdayNames = $derived(
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(2024, 0, i + 1); // Mon=1 Jan 2024
            return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
                d,
            );
        }),
    );

    const monthName = $derived(
        new Intl.DateTimeFormat(locale, { month: "long" }).format(
            new Date(viewYear, viewMonth),
        ),
    );

    // Calendar grid
    const calendarDays = $derived.by(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
        const totalDays = lastDay.getDate();

        const days: (number | null)[] = [];

        // Leading empty slots
        for (let i = 0; i < startOffset; i++) days.push(null);
        // Actual days
        for (let d = 1; d <= totalDays; d++) days.push(d);

        return days;
    });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    function dateKey(year: number, month: number, day: number): string {
        return `${year}-${month}-${day}`;
    }

    const disabledSet = $derived(
        new Set(
            disabledDates.map((d) =>
                dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
            ),
        ),
    );

    const highlightedSet = $derived(
        new Set(
            highlightedDates.map((d) =>
                dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
            ),
        ),
    );

    function isDisabled(day: number): boolean {
        const k = dateKey(viewYear, viewMonth, day);
        if (disabledSet.has(k)) return true;
        const d = new Date(viewYear, viewMonth, day);
        if (minDate && d < minDate) return true;
        if (maxDate && d > maxDate) return true;
        return false;
    }

    function isSelected(day: number): boolean {
        return (
            selectedDate.getFullYear() === viewYear &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getDate() === day
        );
    }

    function isToday(day: number): boolean {
        return dateKey(viewYear, viewMonth, day) === todayStr;
    }

    function isHighlighted(day: number): boolean {
        return highlightedSet.has(dateKey(viewYear, viewMonth, day));
    }

    function selectDay(day: number) {
        if (isDisabled(day)) return;
        selectedDate = new Date(viewYear, viewMonth, day);
        onchange?.(selectedDate);
    }

    function prevMonth() {
        if (viewMonth === 0) {
            viewMonth = 11;
            viewYear--;
        } else {
            viewMonth--;
        }
    }

    function nextMonth() {
        if (viewMonth === 11) {
            viewMonth = 0;
            viewYear++;
        } else {
            viewMonth++;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        const day = selectedDate.getDate();
        let newDate: Date | null = null;

        switch (e.key) {
            case "ArrowLeft":
                newDate = new Date(viewYear, viewMonth, day - 1);
                break;
            case "ArrowRight":
                newDate = new Date(viewYear, viewMonth, day + 1);
                break;
            case "ArrowUp":
                newDate = new Date(viewYear, viewMonth, day - 7);
                break;
            case "ArrowDown":
                newDate = new Date(viewYear, viewMonth, day + 7);
                break;
            case "Enter":
                selectDay(day);
                return;
            case "Escape":
                (e.currentTarget as HTMLElement)?.blur();
                return;
            default:
                return;
        }

        if (newDate) {
            e.preventDefault();
            selectedDate = newDate;
            viewYear = newDate.getFullYear();
            viewMonth = newDate.getMonth();
        }
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
    class="rl-datepicker inline-flex flex-col gap-2 p-4 rounded-box bg-base-200 border border-base-content/10 select-none"
    tabindex="0"
    role="grid"
    aria-label="Date picker"
    onkeydown={handleKeydown}
>
    <!-- Header: Month/Year + Navigation -->
    <div class="flex items-center justify-between">
        <button
            class="btn btn-ghost btn-sm btn-square"
            onclick={prevMonth}
            aria-label="Previous month"
        >
            ‹
        </button>
        <span class="font-semibold text-sm capitalize">
            {monthName}
            {viewYear}
        </span>
        <button
            class="btn btn-ghost btn-sm btn-square"
            onclick={nextMonth}
            aria-label="Next month"
        >
            ›
        </button>
    </div>

    <!-- Weekday Headers -->
    <div class="grid grid-cols-7 gap-1 text-center">
        {#each weekdayNames as wd}
            <span class="text-xs text-base-content/50 font-medium">{wd}</span>
        {/each}
    </div>

    <!-- Day Grid -->
    <div class="grid grid-cols-7 gap-1">
        {#each calendarDays as day}
            {#if day === null}
                <div></div>
            {:else}
                <button
                    class="btn btn-sm btn-square text-xs transition-all duration-150"
                    class:btn-primary={isSelected(day)}
                    class:btn-ghost={!isSelected(day)}
                    class:ring-2={isToday(day) && !isSelected(day)}
                    class:ring-primary={isToday(day) && !isSelected(day)}
                    class:btn-disabled={isDisabled(day)}
                    class:opacity-30={isDisabled(day)}
                    class:bg-accent={isHighlighted(day) && !isSelected(day)}
                    class:bg-opacity-20={isHighlighted(day) && !isSelected(day)}
                    onclick={() => selectDay(day)}
                    disabled={isDisabled(day)}
                    aria-label={`${day} ${monthName} ${viewYear}`}
                    aria-pressed={isSelected(day)}
                >
                    {day}
                </button>
            {/if}
        {/each}
    </div>
</div>
