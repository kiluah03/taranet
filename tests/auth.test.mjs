import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { NextResponse as FrameworkResponse } from 'next/server.js';

// Execute the actual TypeScript handlers with isolated framework/provider boundaries.
function load(file, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, process, URL, Request, Response, AbortSignal, crypto,
    ...globals,
    require(name) { if (name in dependencies) return dependencies[name]; throw new Error('Unexpected import: ' + name); },
  }, { filename: file });
  return exports;
}
process.env.NEXT_PUBLIC_APP_URL = 'https://app.example';
const security = load('lib/auth/security.ts');
const NextResponse = {
  json(body, init) { return Response.json(body, init); },
  redirect(url, init = {}) { return new Response(null, { status: 307, ...init, headers: { ...init.headers, location: String(url) } }); },
};
let client;
let allowed = true;
function route(file) {
  return load(file, {
    'next/server': { NextResponse }, zod: { z },
    '../../../../lib/auth/security': security, '../../../lib/auth/security': security,
    '../../../../lib/auth/csrf': { checkCsrf: async () => allowed },
    '../../../../lib/supabase/auth-server': { createAuthServerClient: async writable => { assert.equal(writable, true); return client; } },
    '../../../lib/supabase/auth-server': { createAuthServerClient: async writable => { assert.equal(writable, true); return client; } },
  });
}
const password = route('app/api/auth/password/route.ts');
const oauth = route('app/api/auth/oauth/route.ts');
const resend = route('app/api/auth/resend/route.ts');
const callback = route('app/auth/callback/route.ts');
const signout = route('app/auth/signout/route.ts');
const post = body => new Request('https://app.example/api/auth/password', { method: 'POST', headers: { origin: 'https://app.example' }, body: JSON.stringify(body) });

test('redirect validation rejects external and ambiguous destinations', () => {
  for (const path of [null, '//evil.example', '/\\evil.example', 'https://evil.example', '/%2f%2fevil.example', '/login', '/ dashboard', '/portal/../login'])
    assert.equal(security.safeNext(path), '/dashboard');
  assert.equal(security.safeNext('/portal?tab=billing#invoice'), '/portal?tab=billing#invoice');
  assert.equal(security.safeNext('/admin'), '/admin');
});
test('CSRF requires both same origin and the matching token', () => {
  const token = 'a'.repeat(64);
  const request = (origin, supplied, site = 'same-origin') => new Request('https://app.example/api/auth/password', { headers: { origin, 'x-csrf-token': supplied, 'sec-fetch-site': site } });
  assert.equal(security.validCsrf(request('https://app.example', token), token), true);
  assert.equal(security.validCsrf(request('https://evil.example', token), token), false);
  assert.equal(security.validCsrf(request('https://app.example', 'b'.repeat(64)), token), false);
  assert.equal(security.validCsrf(request('https://app.example', token, 'cross-site'), token), false);
  assert.equal(security.validCsrf(request('https://app.example', token), undefined), false);
});
test('session cookies are HttpOnly, secure in HTTPS, and Lax for OAuth callbacks', () => {
  const options = security.sessionCookieOptions();
  assert.equal(options.httpOnly, true); assert.equal(options.secure, true); assert.equal(options.sameSite, 'lax');
});
test('credential login validates input and does not expose session tokens', async () => {
  let credentials;
  client = { auth: { signInWithPassword: async input => { credentials = input; return { data: { session: { access_token: 'secret' } } }; } } };
  const response = await password.POST(post({ mode: 'login', email: ' user@example.com ', password: 'short', next: '//evil.example' }));
  const data = await response.json();
  assert.equal(data.redirect, '/dashboard'); assert.equal(JSON.stringify(data).includes('secret'), false);
  assert.equal(credentials.email, 'user@example.com'); assert.equal(credentials.password, 'short');
  assert.equal((await password.POST(post({ mode: 'login', email: 'invalid', password: 'pw' }))).status, 400);
});
test('credential failures and provider outages return feedback', async () => {
  client = { auth: { signInWithPassword: async () => ({ error: { code: 'invalid_credentials' } }) } };
  assert.match((await (await password.POST(post({ mode: 'login', email: 'a@b.com', password: 'bad' }))).json()).error, /Invalid email or password/);
  client.auth.signInWithPassword = async () => { throw new Error('private infrastructure detail'); };
  const response = await password.POST(post({ mode: 'login', email: 'a@b.com', password: 'bad' }));
  assert.equal(response.status, 503); assert.equal((await response.text()).includes('private infrastructure'), false);
});
test('signup enforces stronger passwords and handles pending email confirmation', async () => {
  client = { auth: { signUp: async input => {
    assert.match(input.options.emailRedirectTo, /^https:\/\/app.example\/auth\/callback/);
    return { data: { session: null } };
  } } };
  const input = { mode: 'signup', email: 'user@example.com', password: 'abcdefgh', fullName: 'User', mobile: '123456789' };
  assert.match((await (await password.POST(post(input))).json()).message, /confirm your account/);
  assert.equal((await password.POST(post({ ...input, password: 'short' }))).status, 400);
});
test('auth POST handlers reject CSRF before contacting Supabase', async () => {
  allowed = false; client = null;
  try {
    assert.equal((await password.POST(post({}))).status, 403);
    assert.equal((await oauth.POST(post({}))).status, 403);
    assert.equal((await resend.POST(post({}))).status, 403);
  } finally { allowed = true; }
});
test('social sign-in stays disabled without contacting Supabase', async () => {
  client = { auth: { signInWithOAuth: async () => { assert.fail('OAuth must not be initiated'); } } };
  for (const provider of ['google', 'github', 'facebook']) {
    const response = await oauth.POST(post({ provider }));
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.match(data.error, /disabled.*email and password/);
    assert.equal(data.redirect, undefined);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});

test('callback succeeds only after verified code exchange and returns failures to login', async () => {
  client = { auth: { exchangeCodeForSession: async code => {
    assert.equal(code, 'one-time-code'); return { data: { user: { id: 'user' }, session: { access_token: 'secret' } } };
  } } };
  let response = await callback.GET(new Request('https://internal.example/auth/callback?code=one-time-code&next=//evil.example'));
  assert.equal(response.headers.get('location'), 'https://app.example/dashboard');
  response = await callback.GET(new Request('https://app.example/auth/callback?error=access_denied'));
  assert.match(response.headers.get('location'), /\/login\?error=access_denied/);
  client.auth.exchangeCodeForSession = async () => ({ error: { code: 'flow_state_not_found' }, data: {} });
  response = await callback.GET(new Request('https://app.example/auth/callback?code=expired'));
  assert.match(response.headers.get('location'), /\/login\?error=/);
  client.auth.exchangeCodeForSession = async () => { throw new Error('network'); };
  assert.match((await callback.GET(new Request('https://app.example/auth/callback?code=expired'))).headers.get('location'), /\/login\?error=callback/);
});
test('signout rejects foreign origins and clears session with a 303', async () => {
  client = { auth: { signOut: async () => ({ error: null }) } };
  assert.equal((await signout.POST(new Request('https://app.example/auth/signout', { method: 'POST', headers: { origin: 'https://evil.example' } }))).status, 403);
  const response = await signout.POST(post({}));
  assert.equal(response.status, 303); assert.equal(response.headers.get('location'), 'https://app.example/login');
});


test('installed Supabase SDK persists HttpOnly PKCE and session cookies through exchange', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  const jar = new Map();
  const writes = [];
  let exchangeBody;
  const server = load('lib/supabase/auth-server.ts', {
    '@supabase/ssr': { createServerClient },
    'next/headers': { cookies: async () => ({
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      set: (name, value, options) => { jar.set(name, value); writes.push({ name, value, options }); },
    }) },
    '../auth/security': security,
  }, { fetch: async (_url, init) => {
    exchangeBody = JSON.parse(init.body);
    return Response.json({ access_token: 'test-token', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600,
      user: { id: '00000000-0000-0000-0000-000000000001', email: 'user@example.com', aud: 'authenticated', role: 'authenticated' } });
  } });
  let supabase = await server.createAuthServerClient(true);
  const initiated = await supabase.auth.signInWithOAuth({ provider: 'google', options: { skipBrowserRedirect: true, redirectTo: 'https://app.example/auth/callback' } });
  assert.equal(initiated.error, null);
  const authorization = new URL(initiated.data.url);
  assert.equal(authorization.searchParams.get('code_challenge_method'), 's256');
  assert.ok(authorization.searchParams.get('code_challenge'));
  assert.ok(writes.some(cookie => cookie.name.includes('code-verifier') && cookie.value));
  supabase = await server.createAuthServerClient(true);
  const exchanged = await supabase.auth.exchangeCodeForSession('one-time-code');
  assert.equal(exchanged.error, null);
  assert.equal(exchangeBody.auth_code, 'one-time-code');
  assert.ok(exchangeBody.code_verifier.length > 32);
  assert.ok(writes.some(cookie => !cookie.name.includes('code-verifier') && cookie.value));
  for (const cookie of writes) {
    assert.equal(cookie.options.httpOnly, true); assert.equal(cookie.options.sameSite, 'lax');
    assert.equal(cookie.options.secure, true); assert.equal(cookie.options.path, '/');
  }
});

// Reproduce production without the optional explicit application URL.
test('Vercel auth bootstrap uses trusted deployment metadata when APP_URL is absent', async () => {
  const keys = ['APP_URL', 'NEXT_PUBLIC_APP_URL', 'VERCEL_ENV', 'VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL'];
  const saved = keys.map(key => [key, process.env[key]]);
  try {
    for (const key of keys) delete process.env[key];
    assert.throws(() => security.appOrigin(), /not configured/);
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_URL = 'deployment-123.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'taranet.vercel.app';
    assert.equal(security.appOrigin(), 'https://taranet.vercel.app');
    const csrf = load('app/api/auth/csrf/route.ts', {
      'next/server': { NextResponse: FrameworkResponse },
      'next/headers': { cookies: async () => ({ get: () => undefined }) },
      '../../../../lib/auth/security': security,
    });
    const response = await csrf.GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const { token } = await response.json();
    assert.match(token, /^[a-f0-9]{64}$/);
    const cookie = response.headers.get('set-cookie');
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=lax']) assert.ok(cookie.includes(flag));
    const request = origin => new Request('https://taranet.vercel.app/api/auth/password', {
      headers: { origin, 'x-csrf-token': token },
    });
    assert.equal(security.validCsrf(request('https://taranet.vercel.app'), token), true);
    assert.equal(security.validCsrf(request('https://evil.example'), token), false);
    const redirect = await callback.GET(new Request('https://untrusted.example/auth/callback'));
    assert.ok(redirect.headers.get('location').startsWith('https://taranet.vercel.app/login?'));
    process.env.VERCEL_ENV = 'preview';
    assert.equal(security.appOrigin(), 'https://deployment-123.vercel.app');
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom.example';
    assert.equal(security.appOrigin(), 'https://custom.example');
    process.env.APP_URL = 'https://runtime.example';
    assert.equal(security.appOrigin(), 'https://runtime.example');
    for (const invalid of ['https://user:pass@example.com', 'https://example.com/path', 'http://example.com', 'https://example.com?query=1']) {
      process.env.APP_URL = invalid;
      assert.throws(() => security.appOrigin(), /must be an HTTPS origin/);
    }
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('confirmation resend validates email, preserves PKCE client writes, and restricts redirects', async () => {
  let calls = 0;
  client = { auth: { resend: async input => {
    calls++;
    assert.equal(input.type, 'signup');
    assert.equal(input.email, 'user@example.com');
    assert.equal(input.options.emailRedirectTo, 'https://app.example/auth/callback?next=%2Fdashboard');
    return { error: null };
  } } };
  assert.equal((await resend.POST(post({ email: 'bad' }))).status, 400);
  assert.equal(calls, 0);
  const response = await resend.POST(post({ email: ' user@example.com ', next: '//evil.example' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match((await response.json()).message, /If this email has an account awaiting confirmation/);
  assert.equal(calls, 1);
});

test('confirmation resend reports email restrictions and rate limits without leaking infrastructure errors', async () => {
  client = { auth: { resend: async () => ({ error: { code: 'email_address_not_authorized', status: 400 } }) } };
  let response = await resend.POST(post({ email: 'user@example.com' }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Confirmation email could not be sent/);
  client.auth.resend = async () => ({ error: { code: 'over_email_send_rate_limit', status: 429 } });
  assert.equal((await resend.POST(post({ email: 'user@example.com' }))).status, 429);
  client.auth.resend = async () => { throw new Error('private SMTP credentials'); };
  response = await resend.POST(post({ email: 'user@example.com' }));
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('private SMTP'), false);
});

test('signup does not falsely promise another email for an existing confirmed account', async () => {
  const input = { mode: 'signup', email: 'user@example.com', password: 'abcdefgh', fullName: 'User', mobile: '123456789' };
  const messages = [];
  for (const identities of [[], [{ id: 'new-user' }]]) {
    client = { auth: { signUp: async () => ({ data: { session: null, user: { identities } } }) } };
    const response = await password.POST(post(input));
    assert.equal(response.status, 200);
    messages.push((await response.json()).message);
  }
  assert.equal(messages[0], messages[1]);
  assert.match(messages[0], /If you already registered and confirmed it, sign in instead/);
});
