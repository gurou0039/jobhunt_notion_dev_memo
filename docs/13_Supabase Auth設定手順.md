# Supabase Auth設定手順

Issue #26 の完了条件に合わせた、開発・本番環境のSupabase Auth設定と確認手順です。

## 1. 対象プロジェクトとURL

現在のアプリが参照しているSupabaseプロジェクトは次のとおりです。

- Project ref: `ytezevkhtwwgaccprwcf`
- Supabase URL: `https://ytezevkhtwwgaccprwcf.supabase.co`
- 開発アプリURL: `http://localhost:3000`
- 本番アプリURL: `https://jobhunt-notion-dev-memo.vercel.app`

SupabaseのプロジェクトURLやキーを変更した場合は、`app/.env.local` とデプロイ環境の設定を同時に更新する。キーの実値は、この文書・Issue・Pull Requestには記載しない。

## 2. アプリ側の環境変数

`app/.env.local` に次の値を設定する。`NEXT_PUBLIC_SUPABASE_ANON_KEY` はブラウザで使用する公開キーだけを設定し、Service role keyは設定しない。

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

確認方法:

1. `cd app` でアプリディレクトリへ移動する。
2. `npm run dev` を実行する。
3. `/login` を開き、環境変数エラーが表示されないことを確認する。

`.env.local` やキーの実値を含むファイルはコミットしない。環境変数名の見本だけを共有する。

## 3. Supabase管理画面の設定

### URL Configuration

Supabase Dashboardの `Authentication > URL Configuration` で次を設定する。

- Site URL（現在の設定）: `https://jobhunt-notion-dev-memo.vercel.app/login`
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://jobhunt-notion-dev-memo.vercel.app/reset-password`

本番の `/reset-password` はRedirect URLへ登録済み。Site URLは現在 `/login` が設定されており、登録後の確認メールからログイン画面へ戻す用途として利用する。

本アプリのパスワード再設定メールは、現在のアクセス元を基準に次のページへ遷移する。

- `http://localhost:3000/reset-password`
- `https://jobhunt-notion-dev-memo.vercel.app/reset-password`

本番ドメインが決まったら、ワイルドカードを広く許可したままにせず、そのドメインだけに置き換える。

### Email provider

`Authentication > Providers > Email` は有効にする。メール確認を必須にするため、Confirm emailはONにする。

この設定とアプリの動作は次のように対応する。

- 新規登録: 確認メールが送信される
- メール未確認でログイン: `Email not confirmed` として拒否される
- メール確認後のログイン: ダッシュボードへ遷移する
- パスワード再設定: 実装済みのメールリンクから `/reset-password` を開き、更新後に新しいパスワードでログインする

### Email送信設定

開発中はSupabase標準のメール送信で確認できる。送信制限や本番運用上の要件が出た場合だけ、SMTP providerを設定する。SMTPパスワードやAPIキーはSupabase DashboardのSecret設定と環境変数で管理し、リポジトリには保存しない。

## 4. 動作確認手順

### 正常系

1. `/login` で「アカウントを作成する」を選ぶ。
2. 新規メールアドレス、6文字以上のパスワード、表示名を入力する。
3. 登録完了メッセージが表示され、確認メールが届くことを確認する。
4. メール内の確認リンクを開き、現在設定されているSite URLのログイン画面へ遷移する。
5. `/login` から登録したメールアドレスとパスワードでログインする。
6. ダッシュボードが表示されることを確認する。
7. ログアウト後、再度ログインできることを確認する。
8. パスワード再設定メールのリンクを開き、本番の `/reset-password` でパスワードを更新する。
9. 更新後のパスワードで再ログインする。

### 異常系

- メール未確認の状態でログインすると、確認メールを案内するエラーになる。
- 登録済みメールアドレスで登録すると、重複登録のエラーになる。
- 間違ったパスワードではログインできない。
- 期限切れまたは無効なパスワード再設定リンクでは、再送を案内するエラーになる。
- Redirect URLが未登録の場合は、Supabaseのredirect URLエラーとして原因を記録し、Dashboardの許可URLを修正する。

確認結果は、実施日・環境（OS/ブラウザ）・使用したURL・結果・未解決事項をIssue #26または関連PRに残す。テスト用アカウントのメールアドレスやキーは記録しない。

## 5. 設定変更時のチェックリスト

- [ ] 対象SupabaseプロジェクトとProject refを確認した
- [ ] Site URLを開発/本番の実URLに設定した
- [ ] `http://localhost:3000/reset-password` を登録した
- [x] `https://jobhunt-notion-dev-memo.vercel.app/reset-password` を登録した
- [ ] Email providerとConfirm emailを確認した
- [ ] `app/.env.local` の3つの環境変数を設定した
- [x] 新規登録・メール確認・ログインを確認した
- [x] パスワード再設定・再ログインを確認した
- [ ] PC/スマホの主要ブラウザで確認した
- [ ] 秘密値をIssue、PR、ドキュメント、コミットに含めていない
