const BASE_URL = 'https://skyline-haven-server.vercel.app';
let adminToken = '';
let memberToken = '';
let userToken = '';

let totalTests = 0;
let passedTests = 0;

async function runTest(name, apiCall) {
  totalTests++;
  try {
    const res = await apiCall();
    if (res.ok) {
      console.log(`✅ [PASS] ${name}`);
      passedTests++;
      return await res.json();
    } else {
      let errText = await res.text();
      console.log(`❌ [FAIL] ${name} - Status: ${res.status} - ${errText}`);
      return null;
    }
  } catch (err) {
    console.log(`❌ [FAIL] ${name} - Error: ${err.message}`);
    return null;
  }
}

async function startTests() {
  console.log(`Starting E2E API Tests on ${BASE_URL}\n`);

  // --- 1. AUTH & TOKENS ---
  console.log('--- 1. Authentication ---');
  
  const adminRes = await runTest('Login Admin', () => fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'password123' })
  }));
  if (adminRes) adminToken = adminRes.token;

  const memberRes = await runTest('Login Member', () => fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'member@demo.com', password: 'password123' })
  }));
  if (memberRes) memberToken = memberRes.token;
  
  const userRes = await runTest('Login Normal User', () => fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@demo.com', password: 'password123' })
  }));
  if (userRes) userToken = userRes.token;

  await runTest('Get Auth /me (Admin)', () => fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }));

  // --- 2. USERS ---
  console.log('\n--- 2. Users ---');
  await runTest('Check Admin Role (Admin)', () => fetch(`${BASE_URL}/users/admin/admin@demo.com`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }));
  
  await runTest('Check Member Role (Member)', () => fetch(`${BASE_URL}/users/member/member@demo.com`, {
    headers: { Authorization: `Bearer ${memberToken}` }
  }));

  await runTest('Get All Users (Admin)', () => fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }));

  // --- 3. APARTMENTS ---
  console.log('\n--- 3. Apartments ---');
  const apts = await runTest('Get Apartments (Public)', () => fetch(`${BASE_URL}/apartments`));
  let testApartmentId = apts && apts.length > 0 ? apts[0]._id : null;

  // --- 4. AGREEMENT REQUESTS ---
  console.log('\n--- 4. Requests ---');
  let requestId = null;
  if (testApartmentId) {
      const reqRes = await runTest('Create Agreement Request (Member)', () => fetch(`${BASE_URL}/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({ userEmail: 'member@demo.com', apartmentId: testApartmentId, status: 'pending' })
      }));
      if (reqRes) requestId = reqRes.id;
  }

  const allRequests = await runTest('Get All Requests (Admin)', () => fetch(`${BASE_URL}/request`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }));
  
  // Find a valid request id to accept and delete
  if (allRequests && allRequests.length > 0 && testApartmentId) {
      await runTest('Accept Request (Admin)', () => fetch(`${BASE_URL}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ userEmail: 'member@demo.com', apartmentId: testApartmentId, apartmentNo: 'A1' })
      }));
      
      await runTest('Delete Request (Admin)', () => fetch(`${BASE_URL}/request/${allRequests[0]._id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` }
      }));
  }

  await runTest('Get Accepted Requests (Member)', () => fetch(`${BASE_URL}/accept/member@demo.com`, {
    headers: { Authorization: `Bearer ${memberToken}` }
  }));

  // --- 5. ANNOUNCEMENTS & COUPONS ---
  console.log('\n--- 5. Announcements & Coupons ---');
  await runTest('Create Notice (Admin)', () => fetch(`${BASE_URL}/notice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: 'Test Notice', content: 'This is a test notice from E2E test' })
  }));

  await runTest('Get Notice (Public)', () => fetch(`${BASE_URL}/notice`));

  const couponRes = await runTest('Create Coupon (Admin)', () => fetch(`${BASE_URL}/coupons`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: 'E2ETEST', discount: 20, status: 'active' })
  }));

  if (couponRes) {
      await runTest('Update Coupon Status (Admin)', () => fetch(`${BASE_URL}/coupons/${couponRes.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'inactive' })
      }));
  }

  await runTest('Get Coupons (Public)', () => fetch(`${BASE_URL}/coupons`));

  // --- 6. PAYMENTS & ADMIN REPORT ---
  console.log('\n--- 6. Payments & Admin Report ---');
  await runTest('Create Payment Intent (Member)', () => fetch(`${BASE_URL}/create-payment-intent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ price: 1500 })
  }));

  await runTest('Create Payment Record (Member)', () => fetch(`${BASE_URL}/payments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ email: 'member@demo.com', amount: 1500, status: 'completed' })
  }));

  await runTest('Get Payments (Public)', () => fetch(`${BASE_URL}/payments`));
  await runTest('Get Admin Report (Public)', () => fetch(`${BASE_URL}/adminreport`));


  console.log(`\n\n--- SUMMARY ---`);
  console.log(`Passed: ${passedTests}/${totalTests}`);
  if (passedTests === totalTests) {
      console.log('STATUS: ALL CLEAR! No bugs found.');
  } else {
      console.log('STATUS: BUGS FOUND! Some endpoints failed.');
  }
}

startTests();
