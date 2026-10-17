import { createClient } from './client'

/**
 * ユーザーをサインアップする
 */
export async function signUp(email: string, password: string, displayName?: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email,
      },
    },
  })
  
  if (error) {
    // レート制限エラーを含むエラーメッセージを保持
    const errorMessage = error.message || "サインアップに失敗しました"
    const customError = new Error(errorMessage)
    throw customError
  }
  
  return data
}

/**
 * ユーザーをログインする
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * Send a password reset email.
 */
export async function requestPasswordReset(email: string, redirectTo: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) throw error
  return data
}

/**
 * Exchange a Supabase auth callback code for a session.
 */
export async function exchangePasswordResetCode(code: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) throw error
  return data
}

/**
 * Read the session established by a password reset link.
 */
export async function getPasswordResetSession() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error
  return data.session
}

/**
 * Update the current user's password after a reset session is established.
 */
export async function updatePassword(password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) throw error
  return data
}

/**
 * ユーザーをログアウトする
 */
export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) throw error
}

/**
 * 現在のセッションユーザーを取得
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  return user
}

/**
 * 現在のセッションを取得
 */
export async function getSession() {
  const supabase = await createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  return session
}
