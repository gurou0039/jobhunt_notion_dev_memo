import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

function loadModule(file, dependencies = {}) {
  const source = fs.readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};

  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      return dependencies[name];
    },
    Date,
  });

  return exports;
}

const calendar = loadModule("../src/lib/calendar.ts");
const actions = loadModule("../src/app/calendar/actions.ts", {
  "@/lib/calendar": calendar,
  "@/lib/supabase/server": {
    createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    }),
  },
  "next/cache": { revalidatePath() {} },
  "next/navigation": { redirect() { throw new Error("Unexpected redirect"); } },
});

function invalidEventForm() {
  const formData = new FormData();
  formData.set("title", "面接の準備");
  formData.set("event_type", "interview");
  formData.set("start_at", "2026-10-18T10:00");
  formData.set("end_at", "2026-10-18T09:00");
  formData.set("related_company_id", "company-1");
  return formData;
}

test("create validation errors return every submitted field", async () => {
  const state = await actions.createEvent({}, invalidEventForm());

  assert.match(state.error, /終了日時は開始日時以降/);
  assert.equal(state.values.title, "面接の準備");
  assert.equal(state.values.event_type, "interview");
  assert.equal(state.values.start_at, "2026-10-18T10:00");
  assert.equal(state.values.end_at, "2026-10-18T09:00");
  assert.equal(state.values.related_company_id, "company-1");
});

test("edit validation errors return every submitted field", async () => {
  const formData = invalidEventForm();
  formData.set("event_id", "event-1");

  const state = await actions.updateEvent({}, formData);

  assert.match(state.error, /終了日時は開始日時以降/);
  assert.equal(state.values.title, "面接の準備");
  assert.equal(state.values.related_company_id, "company-1");
});

test("the form renders returned values alongside the error", async () => {
  const state = await actions.createEvent({}, invalidEventForm());
  const form = loadModule("../src/components/calendar/event-form.tsx", {
    "@/lib/calendar": calendar,
    "next/link": {
      default: ({ children, href }) => React.createElement("a", { href }, children),
    },
    react: { useActionState: () => [state, "/submit"] },
    "react/jsx-runtime": jsxRuntime,
  });
  const html = renderToStaticMarkup(
    form.EventForm({ action: actions.createEvent, companies: [], submitLabel: "予定を保存" }),
  );

  assert.match(html, /終了日時は開始日時以降/);
  assert.match(html, /name="title"[^>]*value="面接の準備"/);
  assert.match(html, /name="start_at"[^>]*value="2026-10-18T10:00"/);
  assert.match(html, /name="end_at"[^>]*value="2026-10-18T09:00"/);
});
