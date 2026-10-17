"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  exchangePasswordResetCode,
  getPasswordResetSession,
  updatePassword,
} from "../../lib/supabase/auth";

function getFriendlyError(error: unknown) {
  if (!(error instanceof Error)) {
    return "エラーが発生しました。再設定リンクを開き直してください。";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("expired") ||
    message.includes("invalid") ||
    message.includes("auth session missing") ||
    message.includes("code verifier") ||
    message.includes("access token")
  ) {
    return "再設定リンクが期限切れ、または無効です。もう一度メールを送信してください。";
  }

  return error.message;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const resetCode = searchParams.get("code");
  const [isPreparing, setIsPreparing] = useState(true);
  const [hasResetSession, setHasResetSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const exchangePromiseRef = useRef<{
    code: string;
    promise: ReturnType<typeof exchangePasswordResetCode>;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const prepareResetSession = async () => {
      try {
        let session;
        if (resetCode) {
          const currentExchange = exchangePromiseRef.current;
          const exchangePromise =
            currentExchange?.code === resetCode
              ? currentExchange.promise
              : exchangePasswordResetCode(resetCode);

          exchangePromiseRef.current = { code: resetCode, promise: exchangePromise };
          session = (await exchangePromise).session;
        } else {
          session = await getPasswordResetSession();
        }

        if (!session) {
          throw new Error("Auth session missing");
        }

        if (!isMounted) return;
        if (resetCode) {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.hash}`,
          );
        }
        setError(null);
        setHasResetSession(true);
      } catch (err) {
        if (!isMounted) return;

        // The reset code exchange can run twice in development. If the first
        // attempt already established a session, keep the form usable and do
        // not show the second attempt's stale error.
        const session = await getPasswordResetSession().catch(() => null);
        if (session) {
          setError(null);
          setHasResetSession(true);
          return;
        }

        setError(getFriendlyError(err));
      } finally {
        if (!isMounted) return;
        setIsPreparing(false);
      }
    };

    prepareResetSession()
      .catch(() => {
        // prepareResetSession handles the user-facing error state.
      });

    return () => {
      isMounted = false;
    };
  }, [resetCode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!hasResetSession) {
      setError("再設定リンクが期限切れ、または無効です。もう一度メールを送信してください。");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setIsSaving(true);

    try {
      await updatePassword(password);
      setSuccessMessage("パスワードを更新しました。新しいパスワードでログインできます。");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error", err);
      setError(getFriendlyError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center">
        <section className="w-full space-y-8">
          <header className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              新しいパスワードを設定
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              メール内のリンクを開いた後、新しいパスワードを入力してください。
            </p>
          </header>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          )}

          {isPreparing ? (
            <p className="rounded-md bg-white p-4 text-center text-sm text-gray-600 shadow-sm">
              再設定リンクを確認しています...
            </p>
          ) : hasResetSession ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  新しいパスワード
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  新しいパスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "更新中..." : "パスワードを更新"}
              </button>
            </form>
          ) : null}

          <div className="text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              ログイン画面に戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">読み込み中...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
