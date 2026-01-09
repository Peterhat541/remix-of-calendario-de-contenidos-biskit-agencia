import { useMemo } from 'react';

interface Post {
  id: string;
  day_of_month: number | null;
}

interface ShareMonthCalendarGridProps {
  month: string;
  year: number;
  posts: Post[];
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_MAP: Record<string, number> = {
  'enero': 0,
  'febrero': 1,
  'marzo': 2,
  'abril': 3,
  'mayo': 4,
  'junio': 5,
  'julio': 6,
  'agosto': 7,
  'septiembre': 8,
  'octubre': 9,
  'noviembre': 10,
  'diciembre': 11
};

const ShareMonthCalendarGrid = ({ month, year, posts }: ShareMonthCalendarGridProps) => {
  const calendarDays = useMemo(() => {
    const monthIndex = MONTH_MAP[month.toLowerCase()] ?? 0;
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let startDayOfWeek = firstDay.getDay();
    // Convert to Monday-based (0 = Monday, 6 = Sunday)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const postDays = new Set(posts.map(p => p.day_of_month).filter(Boolean));
    
    const days: Array<{ day: number | null; hasPost: boolean }> = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, hasPost: false });
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, hasPost: postDays.has(day) });
    }
    
    return days;
  }, [month, year, posts]);

  return (
    <div className="bg-muted/30 rounded-lg p-4 mb-8">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => (
          <div 
            key={idx}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-md transition-colors
              ${cell.day === null 
                ? 'bg-transparent' 
                : cell.hasPost 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                  : 'bg-white text-foreground/70 border border-border/30'
              }
            `}
          >
            {cell.day}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Día con publicación</span>
        </div>
      </div>
    </div>
  );
};

export default ShareMonthCalendarGrid;
