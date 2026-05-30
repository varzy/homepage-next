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

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(dateStr: string): dayjs.Dayjs {
  if (DATE_ONLY_RE.test(dateStr)) {
    return dayjs.tz(dateStr, 'Asia/Shanghai');
  }
  return dayjs(dateStr);
}

export function formatAbsoluteDate(dateStr: string, tpl: string = 'MMM DD, YYYY'): string {
  const date = dayjs(dateStr).tz('Asia/Shanghai');
  if (!date.isValid()) return dateStr;

  return date.locale('en').format(tpl);
}

export function formatRelativeDate(dateStr: string): string {
  const past = parseDate(dateStr);
  if (!past.isValid()) return dateStr;

  return past.fromNow();
}
