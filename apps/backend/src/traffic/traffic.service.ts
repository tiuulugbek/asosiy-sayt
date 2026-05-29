import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

type TrafficRow = {
  ip: string;
  dt: Date;
  method: string;
  urlPath: string;
  status: string;
  referrer: string;
  userAgent: string;
};

type DailyStats = {
  date: string;
  pageviews: number;
  visits: number;
  uniqueIps: number;
  botRequests: number;
  rawRequests: number;
};

type MonthlyStats = {
  month: string;
  pageviews: number;
  visits: number;
  uniqueIps: number;
  rawRequests: number;
  botRequests: number;
};

const LOG_RE =
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) ([^"]+)" (\d{3}) (\S+) "([^"]*)" "([^"]*)"/;

const BOT_RE =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|curl|wget|python-requests|go-http-client|node|postman|insomnia|uptimerobot|headless|monitor|scanner|bytespider|petalbot|ahrefs|semrush|mj12bot|yandex/i;

const ASSET_RE =
  /\.(?:js|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|txt|xml)$/i;

const INTERNAL_RE = /^\/(?:_next\/|next\/|favicon\.ico|robots\.txt|sitemap\.xml)/;
const ADMIN_RE = /^\/(?:assets\/|version\.json|login|dashboard|admin)(?:\/|$)/;

@Injectable()
export class TrafficService {
  constructor(private readonly configService: ConfigService) {}

  getReport(days = 15) {
    const safeDays = Math.min(Math.max(Number(days) || 15, 1), 60);
    const today = this.startOfDay(new Date());
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - safeDays + 1);

    const rows = this.readRows(startDate, today);
    const publicRows = rows.filter((row) => this.isPublicPage(row));
    const daily = this.buildDailyStats(rows, publicRows, startDate, today);
    const monthly = this.buildMonthlyStats(rows, publicRows);
    const topPages = this.topList(publicRows.map((row) => this.cleanPath(row.urlPath)), 10);
    const topReferrers = this.topList(
      publicRows
        .map((row) => this.referrerHost(row.referrer))
        .filter((value): value is string => Boolean(value)),
      8,
    );

    const statusCounter = this.countBy(publicRows, (row) => row.status);
    const totalPageviews = publicRows.length;
    const totalVisits = this.sessionCount(publicRows);
    const uniqueIps = new Set(publicRows.map((row) => row.ip)).size;
    const botRequests = rows.filter((row) => this.isBot(row)).length;

    return {
      range: {
        from: this.formatDate(startDate),
        to: this.formatDate(today),
        generatedAt: new Date().toISOString(),
      },
      summary: {
        pageviews: totalPageviews,
        visits: totalVisits,
        uniqueIps,
        botRequests,
        rawRequests: rows.length,
        ok200: statusCounter.get('200') ?? 0,
        notFound404: statusCounter.get('404') ?? 0,
        serverErrors5xx: Array.from(statusCounter.entries())
          .filter(([status]) => status.startsWith('5'))
          .reduce((sum, [, count]) => sum + count, 0),
      },
      daily,
      monthly,
      topPages,
      topReferrers,
      note:
        'Hisoblash nginx access loglari asosida qilinadi. Botlar, API so‘rovlari, statik fayllar va admin yo‘llar tashriflardan chiqarib tashlanadi.',
    };
  }

  private readRows(startDate: Date, endDate: Date): TrafficRow[] {
    const primaryGlob = this.configService.get<string>(
      'TRAFFIC_REPORT_LOG_GLOB',
      '/var/log/nginx/acoustic.uz.access.log*',
    );
    const includeFallbackUntil = this.parseOptionalDate(
      this.configService.get<string>('TRAFFIC_REPORT_INCLUDE_FALLBACK_UNTIL'),
    );

    const files = this.expandLogGlob(primaryGlob);
    if (includeFallbackUntil && startDate <= includeFallbackUntil) {
      files.push(...this.expandLogGlob('/var/log/nginx/access.log*'));
    }

    const seenFiles = Array.from(new Set(files));
    const rows: TrafficRow[] = [];
    const seenRows = new Set<string>();

    for (const file of seenFiles) {
      for (const line of this.readLogFile(file).split('\n')) {
        const match = LOG_RE.exec(line);
        if (!match) continue;

        const dt = this.parseLogDate(match[2]);
        if (!dt || dt < startDate || dt > this.endOfDay(endDate)) continue;

        const row: TrafficRow = {
          ip: match[1],
          dt,
          method: match[3],
          urlPath: match[4],
          status: match[6],
          referrer: match[8],
          userAgent: match[9],
        };
        const key = [
          row.ip,
          row.dt.toISOString(),
          row.method,
          row.urlPath,
          row.status,
          row.referrer,
          row.userAgent,
        ].join('|');
        if (seenRows.has(key)) continue;
        seenRows.add(key);
        rows.push(row);
      }
    }

    return rows;
  }

  private expandLogGlob(globPath: string): string[] {
    const directory = path.dirname(globPath);
    const basename = path.basename(globPath).replace(/\*/g, '');

    try {
      return fs
        .readdirSync(directory)
        .filter((file) => file.startsWith(basename))
        .map((file) => path.join(directory, file))
        .sort();
    } catch {
      return [];
    }
  }

  private readLogFile(file: string): string {
    try {
      const buffer = fs.readFileSync(file);
      return file.endsWith('.gz') ? zlib.gunzipSync(buffer).toString('utf8') : buffer.toString('utf8');
    } catch {
      return '';
    }
  }

  private buildDailyStats(rows: TrafficRow[], publicRows: TrafficRow[], startDate: Date, endDate: Date): DailyStats[] {
    const result: DailyStats[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = this.formatDate(cursor);
      const rawForDay = rows.filter((row) => this.formatDate(row.dt) === dateKey);
      const publicForDay = publicRows.filter((row) => this.formatDate(row.dt) === dateKey);

      result.push({
        date: dateKey,
        pageviews: publicForDay.length,
        visits: this.sessionCount(publicForDay),
        uniqueIps: new Set(publicForDay.map((row) => row.ip)).size,
        botRequests: rawForDay.filter((row) => this.isBot(row)).length,
        rawRequests: rawForDay.length,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private buildMonthlyStats(rows: TrafficRow[], publicRows: TrafficRow[]): MonthlyStats[] {
    const months = new Set([
      ...rows.map((row) => this.formatMonth(row.dt)),
      ...publicRows.map((row) => this.formatMonth(row.dt)),
    ]);

    return Array.from(months)
      .sort()
      .map((month) => {
        const rawForMonth = rows.filter((row) => this.formatMonth(row.dt) === month);
        const publicForMonth = publicRows.filter((row) => this.formatMonth(row.dt) === month);
        return {
          month,
          pageviews: publicForMonth.length,
          visits: this.sessionCount(publicForMonth),
          uniqueIps: new Set(publicForMonth.map((row) => row.ip)).size,
          rawRequests: rawForMonth.length,
          botRequests: rawForMonth.filter((row) => this.isBot(row)).length,
        };
      });
  }

  private isPublicPage(row: TrafficRow): boolean {
    const cleanPath = this.cleanPath(row.urlPath);
    if (!['GET', 'HEAD'].includes(row.method)) return false;
    if (this.isBot(row)) return false;
    if (cleanPath === '/api' || cleanPath.startsWith('/api/')) return false;
    if (INTERNAL_RE.test(cleanPath) || ASSET_RE.test(cleanPath) || ADMIN_RE.test(cleanPath)) return false;
    if (Number(row.status) >= 500) return false;
    return true;
  }

  private isBot(row: TrafficRow): boolean {
    return BOT_RE.test(row.userAgent);
  }

  private sessionCount(rows: TrafficRow[]): number {
    const groups = new Map<string, Date[]>();
    for (const row of rows) {
      const key = `${row.ip}|${row.userAgent}`;
      groups.set(key, [...(groups.get(key) ?? []), row.dt]);
    }

    let sessions = 0;
    for (const dates of groups.values()) {
      let previous: Date | null = null;
      for (const current of dates.sort((a, b) => a.getTime() - b.getTime())) {
        if (!previous || current.getTime() - previous.getTime() > 30 * 60 * 1000) {
          sessions += 1;
        }
        previous = current;
      }
    }
    return sessions;
  }

  private topList(values: string[], limit: number) {
    return Array.from(this.countBy(values, (value) => value).entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  private countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = getKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  private cleanPath(urlPath: string): string {
    return urlPath.split('?')[0] || '/';
  }

  private referrerHost(referrer: string): string | null {
    if (!referrer || referrer === '-') return null;
    try {
      return new URL(referrer).hostname || null;
    } catch {
      return null;
    }
  }

  private parseLogDate(value: string): Date | null {
    const match = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/.exec(value);
    if (!match) return null;

    const monthMap: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    return new Date(
      Number(match[3]),
      monthMap[match[2]],
      Number(match[1]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    );
  }

  private parseOptionalDate(value?: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return this.endOfDay(new Date(year, month - 1, day));
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private endOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMonth(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
