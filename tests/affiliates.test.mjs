import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';
import { NextResponse as FrameworkResponse } from 'next/server.js';

function load(file, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, process, URL, Request, Response, AbortSignal, crypto,
    ...globals,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error('Unexpected import: ' + name);
    },
  }, { filename: file });
  return exports;
}

process.env.NEXT_PUBLIC_APP_URL = 'https://www.taranet.nz';
const security = load('lib/auth/security.ts');
const codeLib = load('lib/affiliates/code.ts');

test('normalizeAffiliateCode trims, uppercases, and rejects invalid formats', () => {
  assert.equal(codeLib.normalizeAffiliateCode('  testcode  '), 'TESTCODE');
  assert.equal(codeLib.normalizeAffiliateCode('Barkada_5-NZ'), 'BARKADA_5-NZ');
  assert.equal(codeLib.normalizeAffiliateCode(''), null);
  assert.equal(codeLib.normalizeAffiliateCode('A'), null);
  assert.equal(codeLib.normalizeAffiliateCode('-BAD'), null);
  assert.equal(codeLib.normalizeAffiliateCode('BAD CODE!'), null);
  assert.equal(codeLib.normalizeAffiliateCode('A'.repeat(33)), null);
});

test('proxy sets last-touch 30-day HttpOnly taranet_ref cookie on /, /check, and /plans-ready', async () => {
  const proxyMod = load('proxy.ts', {
    '@supabase/ssr': { createServerClient: () => { throw new Error('Should not run auth on public routes'); } },
    'next/server': { NextResponse: FrameworkResponse },
    './lib/affiliates/code': codeLib,
    './lib/auth/security': security,
  });

  for (const path of ['/?ref=testcode', '/check?ref=testcode', '/plans-ready?ref=testcode']) {
    const cookieJar = new Map();
    const request = {
      url: 'https://www.taranet.nz' + path,
      nextUrl: new URL('https://www.taranet.nz' + path),
      cookies: {
        get: name => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
        getAll: () => Array.from(cookieJar, ([name, value]) => ({ name, value })),
        set: (name, value) => cookieJar.set(name, value),
      },
    };
    const response = await proxyMod.proxy(request);
    assert.equal(cookieJar.get('taranet_ref'), 'TESTCODE');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const setCookie = response.headers.get('set-cookie') || '';
    assert.match(setCookie, /taranet_ref=TESTCODE/);
    assert.match(setCookie, /Max-Age=2592000/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=lax/i);
    assert.match(setCookie, /Secure/i);
  }

  // Last-touch overwrites an existing taranet_ref cookie with the latest valid code.
  const jar = new Map([['taranet_ref', 'FIRSTCODE']]);
  const lastTouchReq = {
    url: 'https://www.taranet.nz/?ref=second_code',
    nextUrl: new URL('https://www.taranet.nz/?ref=second_code'),
    cookies: {
      get: name => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      set: (name, value) => jar.set(name, value),
    },
  };
  const lastTouchRes = await proxyMod.proxy(lastTouchReq);
  assert.equal(jar.get('taranet_ref'), 'SECOND_CODE');
  assert.match(lastTouchRes.headers.get('set-cookie') || '', /taranet_ref=SECOND_CODE/);

  // Public pages without ?ref= do not emit Set-Cookie or private no-store cache overrides.
  const cleanReq = {
    url: 'https://www.taranet.nz/',
    nextUrl: new URL('https://www.taranet.nz/'),
    cookies: { get: () => undefined, getAll: () => [], set: () => {} },
  };
  const cleanRes = await proxyMod.proxy(cleanReq);
  assert.equal(cleanRes.headers.get('set-cookie'), null);
  assert.equal(cleanRes.headers.get('cache-control'), null);
});

test('validateAffiliateCode returns only displayName for active affiliates and never leaks private fields', async () => {
  const rows = {
    TESTCODE: { id: 'aff-1', user_id: 'usr-1', name: 'TaraNet Test Partner', email: 'secret@taranet.nz', code: 'TESTCODE', status: 'active', commission_type: 'fixed', commission_value: 5 },
    PENDING1: { id: 'aff-2', user_id: null, name: 'Pending Partner', email: 'pending@taranet.nz', code: 'PENDING1', status: 'pending', commission_type: 'fixed', commission_value: 5 },
    SUSP1: { id: 'aff-3', user_id: null, name: 'Suspended Partner', email: 'susp@taranet.nz', code: 'SUSP1', status: 'suspended', commission_type: 'fixed', commission_value: 5 },
  };
  const fakeServiceClient = {
    from() {
      return {
        select() {
          return {
            eq(_col, val) {
              return { maybeSingle: async () => ({ data: rows[val] ?? null, error: null }) };
            },
          };
        },
      };
    },
  };
  const serverLib = load('lib/affiliates/server.ts', {
    '../supabase/server': { getServiceClient: () => fakeServiceClient },
    './code': codeLib,
  });

  const validateRoute = load('app/api/affiliates/validate/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '../../../../lib/affiliates/server': serverLib,
  });

  const okRes = await validateRoute.GET(new Request('https://www.taranet.nz/api/affiliates/validate?code=testcode'));
  const okBody = await okRes.json();
  assert.deepEqual(okBody, { valid: true, displayName: 'TaraNet Test Partner' });
  assert.equal('email' in okBody, false);
  assert.equal('id' in okBody, false);

  const pendingRes = await validateRoute.GET(new Request('https://www.taranet.nz/api/affiliates/validate?code=PENDING1'));
  assert.deepEqual(await pendingRes.json(), { valid: false });

  const suspRes = await validateRoute.GET(new Request('https://www.taranet.nz/api/affiliates/validate?code=SUSP1'));
  assert.deepEqual(await suspRes.json(), { valid: false });

  const unknownRes = await validateRoute.GET(new Request('https://www.taranet.nz/api/affiliates/validate?code=NOPE999'));
  assert.deepEqual(await unknownRes.json(), { valid: false });
});

test('recordAffiliateReferral blocks self-referrals, computes commission server-side, and tracks link vs manual attribution', async () => {
  const inserted = [];
  const affiliates = {
    TESTCODE: { id: 'aff-1', user_id: 'partner-uid', name: 'TaraNet Test Partner', email: 'partner@taranet.nz', code: 'TESTCODE', status: 'active', commission_type: 'fixed', commission_value: 5 },
    PCT10: { id: 'aff-2', user_id: null, name: 'Percent Partner', email: 'pct@taranet.nz', code: 'PCT10', status: 'active', commission_type: 'percentage', commission_value: 10 },
  };
  const fakeServiceClient = {
    from(table) {
      if (table === 'affiliates') {
        return {
          select() {
            return {
              eq(_col, val) {
                return { maybeSingle: async () => ({ data: affiliates[val] ?? null, error: null }) };
              },
            };
          },
        };
      }
      if (table === 'affiliate_referrals') {
        return {
          insert: async row => {
            inserted.push(row);
            return { error: null };
          },
        };
      }
      throw new Error('Unexpected table: ' + table);
    },
  };
  const serverLib = load('lib/affiliates/server.ts', {
    '../supabase/server': { getServiceClient: () => fakeServiceClient },
    './code': codeLib,
  });

  // Self-referral by email is blocked.
  const selfEmail = await serverLib.recordAffiliateReferral({
    code: 'TESTCODE',
    cookieCode: 'TESTCODE',
    referredEmail: 'PARTNER@taranet.nz',
    referredUserId: 'other-user',
  });
  assert.deepEqual({ ...selfEmail }, { recorded: false, reason: 'self_referral' });

  // Self-referral by user ID is blocked.
  const selfUid = await serverLib.recordAffiliateReferral({
    code: 'TESTCODE',
    cookieCode: null,
    referredEmail: 'different@example.co.nz',
    referredUserId: 'partner-uid',
  });
  assert.deepEqual({ ...selfUid }, { recorded: false, reason: 'self_referral' });

  // Valid link-attributed referral records pending row with fixed $5 commission.
  const validLink = await serverLib.recordAffiliateReferral({
    code: 'testcode',
    cookieCode: 'TESTCODE',
    referredEmail: 'Customer@Example.co.nz',
    referredUserId: 'cust-1',
  });
  assert.deepEqual({ ...validLink }, { recorded: true });
  assert.equal(inserted.length, 1);
  assert.deepEqual({ ...inserted[0] }, {
    affiliate_id: 'aff-1',
    application_id: null,
    referred_user_id: 'cust-1',
    referred_email: 'customer@example.co.nz',
    code_used: 'TESTCODE',
    status: 'pending',
    commission_amount: 5,
    attribution_source: 'link',
  });

  // Manual code override records attribution_source='manual' and computes percentage commission.
  const validManual = await serverLib.recordAffiliateReferral({
    code: 'PCT10',
    cookieCode: 'TESTCODE',
    referredEmail: 'manual@example.co.nz',
    applicationId: 'app-123',
    planMonthlyPriceNzd: 99,
  });
  assert.deepEqual({ ...validManual }, { recorded: true });
  assert.equal(inserted.length, 2);
  assert.equal(inserted[1].attribution_source, 'manual');
  assert.equal(inserted[1].commission_amount, 9.9);
  assert.equal(inserted[1].application_id, 'app-123');

  // Invalid code returns gracefully without throwing.
  const invalid = await serverLib.recordAffiliateReferral({
    code: 'EXPIRED99',
    referredEmail: 'buyer@example.co.nz',
  });
  assert.deepEqual({ ...invalid }, { recorded: false, reason: 'invalid_or_inactive' });
  assert.equal(inserted.length, 2);
});

test('password signup succeeds even when referral code is invalid or throws', async () => {
  const passwordRoute = load('app/api/auth/password/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'BADCODE' }) }) },
    zod: { z },
    '../../../../lib/affiliates/code': codeLib,
    '../../../../lib/affiliates/server': { recordAffiliateReferral: async () => { throw new Error('Simulated DB error'); } },
    '../../../../lib/auth/security': security,
    '../../../../lib/auth/csrf': { checkCsrf: async () => true },
    '../../../../lib/supabase/auth-server': {
      createAuthServerClient: async () => ({
        auth: {
          signUp: async () => ({ data: { user: { id: 'new-user-1' }, session: null }, error: null }),
        },
      }),
    },
  });

  const res = await passwordRoute.POST(new Request('https://www.taranet.nz/api/auth/password', {
    method: 'POST',
    headers: { origin: 'https://www.taranet.nz' },
    body: JSON.stringify({
      mode: 'signup',
      email: 'newfamily@example.co.nz',
      password: 'Password123!',
      fullName: 'New Family',
      mobile: '0211234567',
      referralCode: 'BADCODE',
    }),
  }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.match(body.message, /check your inbox/i);
});
