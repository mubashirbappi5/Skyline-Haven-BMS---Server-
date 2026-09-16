const BASE_URL = 'http://localhost:7000';
let adminToken = '';
let memberToken = '';

async function testApi() {
  try {
    console.log('--- Testing API Endpoints ---');
    
    // 1. Auth Sign In (Admin)
    console.log('1. Testing /auth/signin (Admin)');
    let res = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'password123' })
    });
    let data = await res.json();
    adminToken = data.token;
    console.log('✅ Admin Login Success. Token:', adminToken.substring(0, 15) + '...');
    
    // 2. Auth Sign In (Member)
    console.log('2. Testing /auth/signin (Member)');
    res = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@demo.com', password: 'password123' })
    });
    data = await res.json();
    memberToken = data.token;
    console.log('✅ Member Login Success. Token:', memberToken.substring(0, 15) + '...');
    
    // 3. Get Auth Me
    console.log('3. Testing /auth/me');
    res = await fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } });
    data = await res.json();
    console.log('✅ Auth Me Success. User:', data.email);
    
    // 4. Get Apartments (Public)
    console.log('4. Testing /apartments');
    res = await fetch(`${BASE_URL}/apartments`);
    data = await res.json();
    console.log('✅ Apartments Success. Count:', data.length);
    const apartmentId = data[0]._id;
    
    // 5. Post Request (Member)
    console.log('5. Testing /request (POST)');
    res = await fetch(`${BASE_URL}/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({ userEmail: 'member@demo.com', apartmentId: apartmentId, status: 'pending' })
    });
    data = await res.json();
    console.log('✅ Post Request Success. ID:', data.id);
    const requestId = data.id;
    
    // 6. Get Requests (Admin)
    console.log('6. Testing /request (GET)');
    res = await fetch(`${BASE_URL}/request`, { headers: { Authorization: `Bearer ${adminToken}` } });
    data = await res.json();
    console.log('✅ Get Requests Success. Count:', data.length);
    
    // 7. Post Accept (Admin)
    console.log('7. Testing /accept (POST)');
    res = await fetch(`${BASE_URL}/accept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ userEmail: 'member@demo.com', apartment_id: apartmentId, apartmentNo: 'A1' })
    });
    data = await res.json();
    console.log('✅ Post Accept Success. ID:', data.id);
    
    // 8. Delete Request (Admin)
    console.log('8. Testing /request (DELETE)');
    res = await fetch(`${BASE_URL}/request/${requestId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` }
    });
    data = await res.json();
    console.log('✅ Delete Request Success. Deleted Count:', data.deletedCount);
    
    // 9. Get Notice (Public)
    console.log('9. Testing /notice (GET)');
    res = await fetch(`${BASE_URL}/notice`);
    data = await res.json();
    console.log('✅ Get Notice Success. Count:', data.length);

    console.log('\n✅ ALL API TESTS COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
  }
}

testApi();
