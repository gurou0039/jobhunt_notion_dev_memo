import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const source = fs.readFileSync(
  fileURLToPath(new URL("../src/lib/calendar.ts", import.meta.url)),
  "utf8",
);
const compiled = typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.CommonJS },
}).outputText;
const calendar = {};
vm.runInNewContext(compiled, { exports: calendar, Date, Intl });

test("an event spanning a week boundary appears on each day it occupies", () => {
  const event = {
    id: "spanning-event",
    title: "複数日イベント",
    event_type: "other",
    start_at: "2026-10-17T01:00:00Z",
    end_at: "2026-10-19T08:00:00Z",
    related_company_id: null,
  };

  assert.equal(calendar.eventOccursOnDate(event, "2026-10-16"), false);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-17"), true);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-18"), true);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-19"), true);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-20"), false);
});

test("an event ending at midnight does not occupy the following day", () => {
  const event = {
    start_at: "2026-10-17T14:00:00Z",
    end_at: "2026-10-17T15:00:00Z",
  };

  assert.equal(calendar.eventOccursOnDate(event, "2026-10-17"), true);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-18"), false);
});

test("an event without an end time appears on its start date", () => {
  const event = { start_at: "2026-10-17T15:00:00Z", end_at: null };

  assert.equal(calendar.eventOccursOnDate(event, "2026-10-17"), false);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-18"), true);
  assert.equal(calendar.eventOccursOnDate(event, "2026-10-19"), false);
});
