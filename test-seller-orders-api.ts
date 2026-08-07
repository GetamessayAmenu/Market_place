import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';

async function testSellerOrders() {
  try {
    // Get the auth cookie from browser (you'll need to extract this)
    // For now, let's test without auth to see the error
    const response = await axios.get(`${API_BASE}/orders/seller`, {
      withCredentials: true,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.response?.status);
    console.error('Error data:', error.response?.data);
  }
}

testSellerOrders();
