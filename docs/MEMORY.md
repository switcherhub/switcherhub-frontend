# Чому Next.js жере багато пам’яті і що робити

## Основні причини

### 1. **Turbopack (за замовчуванням у Next 16)**

У dev і build за замовчуванням використовується Turbopack. Він часто споживає **6–12 GB RAM** проти **~3.5–4 GB** у Webpack.

**Що зробити:** запускати з Webpack замість Turbopack:

```bash
npm run dev:webpack    # замість npm run dev
npm run build:webpack  # замість npm run build
```

Або вручну:

```bash
NODE_OPTIONS='--max-old-space-size=8192' next dev --webpack
NODE_OPTIONS='--max-old-space-size=8192' next build --webpack
```

### 2. **Ліміт heap Node.js**

За замовчуванням Node обмежує heap (~2–4 GB). При збірці великого проєкту цього може не вистачати.

**Що зробити:** у проєкті вже додано `NODE_OPTIONS='--max-old-space-size=8192'` (8 GB) у скрипти `dev` та `build`. Якщо пам’яті все одно не вистачає — підніміть до 10240 (10 GB) або 12288 (12 GB).

### 3. **Важкі залежності**

- Два набори графіків у `package.json`: **apexcharts** + **react-apexcharts** і **recharts**. У коді використовується лише **recharts** (`components/ui/chart.tsx`). Apexcharts можна видалити, якщо графіки на ньому не будуються.
- **radix-ui** — мета-пакет, тягне багато пакетів.
- **leaflet** + **react-leaflet** — карта.
- **motion**, **react-aria-components** — додаткові об’єми при компіляції.

Зменшення кількості залежностей і дублікатів (наприклад, одна бібліотека іконок замість двох) знижує навантаження на збірку.

### 4. **Source maps у dev**

У режимі розробки генерація source maps додатково навантажує пам’ять. Змінювати це зазвичай не потрібно, але варто мати на увазі.

---

## Діагностика

### Подивитися використання пам’яті під час збірки

```bash
NODE_OPTIONS='--max-old-space-size=8192' next build --experimental-debug-memory-usage
```

У консолі будуть логи по heap і збирачу сміття. Під час виконання можна зняти heap snapshot (деякі версії Next підтримують SIGUSR2 у цьому режимі).

### Профіль heap (знайти, хто тримає пам’ять)

```bash
node --heap-prof node_modules/next/dist/bin/next build
```

Після завершення (або падіння) з’явиться файл `.heapprofile`. Відкрити його в Chrome DevTools: **DevTools → Memory → Load** (або через Node.js inspector).

### Запуск з інспектором Node

```bash
NODE_OPTIONS='--inspect' next build
```

Далі підключитися до процесу через Chrome `chrome://inspect` і знімати heap snapshots під час збірки.

---

## Рекомендований порядок дій

1. **Спочатку:** перейти на Webpack для dev/build (`npm run dev:webpack` / `npm run build:webpack`) і перевірити, чи зменшилось споживання пам’яті.
2. **Якщо все ще падає:** збільшити `--max-old-space-size` у скриптах (наприклад, до 10240 або 12288).
3. **Довгостроково:** переглянути залежності (прибрати невикористані, наприклад apexcharts), перевірити дублікати в `node_modules` (наприклад, `npm ls` / `pnpm why`).
