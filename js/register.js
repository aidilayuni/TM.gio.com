document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const staffid = document.getElementById('staffid').value.trim();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const errorEl = document.getElementById('errorMsg');
    const successEl = document.getElementById('successMsg');
    errorEl.textContent = '';
    successEl.textContent = '';

    if (!staffid || !password) {
        errorEl.textContent = 'Staff ID and password are required.';
        return;
    }
    if (password !== password2) {
        errorEl.textContent = 'Passwords do not match.';
        return;
    }

    try {
        const resp = await fetch('php/register_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffid, password })
        });

        const text = await resp.text(); // read raw response
        // log for debugging
        console.log('Response status:', resp.status, resp.statusText);
        console.log('Response body:', text);

        // try parse JSON if content-type is JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            errorEl.textContent = 'Server returned invalid response. See console for details.';
            return;
        }

        if (data.success) {
            successEl.textContent = 'Account created. Redirecting to login...';
            setTimeout(() => location.href = 'login.html', 1300);
        } else {
            errorEl.textContent = data.message || 'Registration failed.';
        }
    } catch (err) {
        console.error('Fetch error:', err);
        errorEl.textContent = 'Network error. Please try again.';
    }
});