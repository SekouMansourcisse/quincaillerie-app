import axios from 'axios';

const testLogin = async () => {
    try {
        console.log('Testing login...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@quincaillerie.com',
            password: 'admin123'
        });
        console.log('✅ Login successful!');
        console.log('Token:', response.data.token ? 'Received' : 'Missing');
        console.log('User:', response.data.user.email);
    } catch (error: any) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

testLogin();
