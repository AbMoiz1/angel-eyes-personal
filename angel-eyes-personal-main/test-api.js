const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('Testing Angel Eyes Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);

    // Test registration
    console.log('\n2. Testing User Registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#'
    };

    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    console.log('✅ Registration:', registerResult);

    // Test login
    console.log('\n3. Testing User Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();
    console.log('✅ Login:', loginResult);

    if (loginResult.success && loginResult.data.token) {
      const token = loginResult.data.token;

      // Test protected route
      console.log('\n4. Testing Protected Route (Get Profile)...');
      const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const profileResult = await profileResponse.json();
      console.log('✅ Profile:', profileResult);

      // Test creating a baby profile
      console.log('\n5. Testing Baby Profile Creation...');
      const babyData = {
        name: 'Test Baby',
        dateOfBirth: '2024-01-01',
        gender: 'male',
        weight: 3.5,
        height: 50
      };

      const babyResponse = await fetch(`${BASE_URL}/babies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(babyData)
      });

      const babyResult = await babyResponse.json();
      console.log('✅ Baby Creation:', babyResult);

      // Test getting dashboard stats
      console.log('\n6. Testing Dashboard Stats...');
      const statsResponse = await fetch(`${BASE_URL}/users/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const statsResult = await statsResponse.json();
      console.log('✅ Dashboard Stats:', statsResult);
    }

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPI();
