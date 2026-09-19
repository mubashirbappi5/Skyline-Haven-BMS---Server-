async function test() {
  const loginRes = await fetch('https://skyline-haven-server.vercel.app/auth/signin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@demo.com', password: 'password123' })
  });
  const { token } = await loginRes.json();
  
  console.log('Got token, testing stripe API...');
  
  const res = await fetch('https://skyline-haven-server.vercel.app/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ price: 1500 })
  });
  
  console.log(res.status, await res.text());
}
test();
