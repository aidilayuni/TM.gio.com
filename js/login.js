document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const staffid = document.getElementById('staffid').value.trim();
    const password = document.getElementById('password').value;
    const err = document.getElementById('errorMsg');
    err.textContent = '';

    // absolute endpoint (adjust '/TM' if your folder name differs)
    const endpoint = window.location.origin + '/TM/php/login_api.php';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffid, password })
        });

        const text = await res.text();
        console.log('POST', endpoint, 'Status:', res.status, res.statusText);
        console.log('Response body:', text);

        let data;
        try { data = JSON.parse(text); } catch (ex) {
            err.textContent = 'Server returned invalid JSON. Check console.';
            return;
        }

        if (data.success) {
            window.location.href = 'kpi.html';
        } else {
            err.textContent = data.message || 'Login failed. Please try again.';
        }
    } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        err.textContent = 'Network error. Make sure Apache is running and you opened the page via http://localhost/TM/';
    }
});