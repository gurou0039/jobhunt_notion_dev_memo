"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildCalendarHref,
  eventDateKey,
  EventFormFields,
  EventFormState,
  isEventType,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function parseLocalDateTime(value: string, fieldName: string) {
  if (!LOCAL_DATE_TIME_PATTERN.test(value)) {
    throw new Error(`${fieldName}を入力してください`);
  }

  const date = new Date(`${value}:00+09:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName}の形式が正しくありません`);
  }

  return date.toISOString();
}

function getSubmittedValues(formData: FormData): EventFormFields {
  return {
    title: getText(formData, "title"),
    event_type: getText(formData, "event_type"),
    start_at: getText(formData, "start_at"),
    end_at: getText(formData, "end_at"),
    related_company_id: getText(formData, "related_company_id"),
  };
}

function parseEventValues(fields: EventFormFields) {
  const title = fields.title;
  const eventType = fields.event_type;
  const startValue = fields.start_at;
  const endValue = fields.end_at;
  const relatedCompanyId = fields.related_company_id;

  if (!title) {
    throw new Error("予定名を入力してください");
  }

  if (title.length > 120) {
    throw new Error("予定名は120文字以内で入力してください");
  }

  if (!isEventType(eventType)) {
    throw new Error("予定の種別を選択してください");
  }

  const startAt = parseLocalDateTime(startValue, "開始日時");
  const endAt = endValue ? parseLocalDateTime(endValue, "終了日時") : null;

  if (endAt && new Date(endAt) < new Date(startAt)) {
    throw new Error("終了日時は開始日時以降にしてください");
  }

  return {
    title,
    event_type: eventType,
    start_at: startAt,
    end_at: endAt,
    related_company_id: relatedCompanyId || null,
  };
}

function formError(message: string, values: EventFormFields): EventFormState {
  return { error: message, values };
}

async function validateRelatedCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string | null,
) {
  if (!companyId) {
    return true;
  }

  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

async function getWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (workspace) {
    return workspace.id as string;
  }

  const { data: createdWorkspace } = await supabase
    .from("workspaces")
    .insert({ user_id: userId, name: "Default workspace" })
    .select("id")
    .single();

  return (createdWorkspace?.id as string | undefined) ?? null;
}

export async function createEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const submittedValues = getSubmittedValues(formData);
  let values: ReturnType<typeof parseEventValues>;

  try {
    values = parseEventValues(submittedValues);
  } catch (error) {
    return formError(
      error instanceof Error ? error.message : "入力内容を確認してください",
      submittedValues,
    );
  }

  if (!(await validateRelatedCompany(supabase, user.id, values.related_company_id))) {
    return formError("選択した企業を確認できません", submittedValues);
  }

  const workspaceId = await getWorkspaceId(supabase, user.id);

  if (!workspaceId) {
    return formError("予定の保存先を準備できませんでした", submittedValues);
  }

  const { data, error } = await supabase
    .from("events")
    .insert({ workspace_id: workspaceId, ...values })
    .select("id,start_at")
    .single();

  if (error || !data) {
    return formError("予定を保存できませんでした", submittedValues);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(buildCalendarHref("month", eventDateKey(data.start_at), data.id));
}

export async function updateEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const eventId = getText(formData, "event_id");
  const editPath = eventId ? `/calendar/events/${eventId}/edit` : "/calendar";
  const submittedValues = getSubmittedValues(formData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!eventId) {
    return formError("更新する予定を確認できません", submittedValues);
  }

  let values: ReturnType<typeof parseEventValues>;

  try {
    values = parseEventValues(submittedValues);
  } catch (error) {
    return formError(
      error instanceof Error ? error.message : "入力内容を確認してください",
      submittedValues,
    );
  }

  if (!(await validateRelatedCompany(supabase, user.id, values.related_company_id))) {
    return formError("選択した企業を確認できません", submittedValues);
  }

  const { data, error } = await supabase
    .from("events")
    .update(values)
    .eq("id", eventId)
    .select("id,start_at")
    .maybeSingle();

  if (error || !data) {
    return formError("予定を更新できませんでした", submittedValues);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath(editPath);
  redirect(buildCalendarHref("month", eventDateKey(data.start_at), data.id));
}

export async function deleteEvent(formData: FormData) {
  const eventId = getText(formData, "event_id");
  const editPath = eventId ? `/calendar/events/${eventId}/edit` : "/calendar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!eventId) {
    redirectWithError(editPath, "削除する予定を確認できません");
  }

  const { data: event } = await supabase
    .from("events")
    .select("start_at")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    redirectWithError(editPath, "削除する予定が見つかりません");
  }

  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    redirectWithError(editPath, "予定を削除できませんでした");
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(buildCalendarHref("month", eventDateKey(event.start_at)));
}
