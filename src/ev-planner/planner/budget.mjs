// Hard server-side budget for the free ORS key. Counters are checked and incremented BEFORE any upstream call; over budget = refuse, never fall back to a paid path.
export const LIMITS = { perDay: 1500, perMinute: 30, perTripCalls: 14 }; // ORS free key: 2000/day, 40/min. Margin kept.
export class MemoryStore { constructor() { this.m = new Map(); } async incr(k) { const v = (this.m.get(k) || 0) + 1; this.m.set(k, v); return v; } async get(k) { return this.m.get(k) || 0; } }
export class BudgetError extends Error { constructor(why) { super(why); this.code = 'BUDGET'; } }
export class Budget {
  constructor(store, limits = LIMITS, clock = () => new Date()) { this.s = store; this.l = limits; this.clock = clock; }
  async take(n = 1) {
    const d = this.clock(), day = 'd:' + d.toISOString().slice(0, 10), min = 'm:' + d.toISOString().slice(0, 16);
    if ((await this.s.get(day)) + n > this.l.perDay) throw new BudgetError('daily free budget used up');
    if ((await this.s.get(min)) + n > this.l.perMinute) throw new BudgetError('per-minute free limit reached');
    for (let i = 0; i < n; i++) { await this.s.incr(day); await this.s.incr(min); }
  }
}
