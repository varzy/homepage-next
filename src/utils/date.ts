import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function formatAbsoluteDate(dateStr: string, tpl: string = 'MMM DD, YYYY'): string {
  const date = dayjs(dateStr).tz('Asia/Shanghai');
  if (!date.isValid()) return dateStr;

  return date.locale('en').format(tpl);
}

export function getYearMonth(dateStr: string): { year: string; month: string } | null {
  const date = dayjs(dateStr).tz('Asia/Shanghai');
  if (!date.isValid()) return null;

  return {
    year: String(date.year()),
    month: String(date.month() + 1).padStart(2, '0'),
  };
}

export function formatYearMonth(
  year: string | number,
  month: string | number,
  tpl: string = 'MMM YYYY',
): string {
  const paddedMonth = String(month).padStart(2, '0');
  const date = dayjs.tz(`${year}-${paddedMonth}-01`, 'Asia/Shanghai');
  if (!date.isValid()) return `${year}/${paddedMonth}`;

  return date.locale('en').format(tpl);
}
