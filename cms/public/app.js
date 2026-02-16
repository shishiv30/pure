const API_BASE = window.location.origin;

let currentUser = null;

// Initialize app
async function init() {
	try {
		// Check setup status
		const setupRes = await fetch(`${API_BASE}/api/setup/status`);
		const setupData = await setupRes.json();

		if (!setupData.data.setupComplete) {
			showSetupScreen();
			return;
		}

		// Check if logged in
		const meRes = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
		if (meRes.ok) {
			const meData = await meRes.json();
			currentUser = meData.data.user;
			showAdminPanel();
		} else {
			showLoginScreen();
		}
	} catch (error) {
		console.error('Initialization error:', error);
		showLoginScreen();
	}
}

function showSetupScreen() {
	document.getElementById('setup-screen').classList.remove('hidden');
	document.getElementById('login-screen').classList.add('hidden');
	document.getElementById('admin-panel').classList.add('hidden');

	const form = document.getElementById('setup-form');
	form.onsubmit = async (e) => {
		e.preventDefault();
		clearError('setup-error');
		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData);

		try {
			const res = await fetch(`${API_BASE}/api/setup/create-admin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(data)
			});

			let result;
			try {
				result = await res.json();
			} catch (parseErr) {
				if (res.ok) {
					showError('setup-error', 'Invalid response from server');
				} else {
					showError('setup-error', 'Failed to create admin account');
				}
				return;
			}
			if (res.ok) {
				currentUser = result.data?.user;
				if (currentUser) {
					showAdminPanel();
				} else {
					showError('setup-error', 'Invalid response from server');
				}
			} else {
				showError('setup-error', result.message || 'Failed to create admin account');
			}
		} catch (error) {
			showError('setup-error', 'Failed to create admin account');
		}
	};
}

function showLoginScreen() {
	document.getElementById('setup-screen').classList.add('hidden');
	document.getElementById('login-screen').classList.remove('hidden');
	document.getElementById('admin-panel').classList.add('hidden');

	const form = document.getElementById('login-form');
	form.onsubmit = async (e) => {
		e.preventDefault();
		clearError('login-error');
		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData);

		try {
			const res = await fetch(`${API_BASE}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(data)
			});

			let result;
			try {
				result = await res.json();
			} catch (parseErr) {
				if (res.ok) {
					showError('login-error', 'Invalid response from server');
				} else {
					showError('login-error', 'Failed to login');
				}
				return;
			}
			if (res.ok) {
				currentUser = result.data?.user;
				if (currentUser) {
					showAdminPanel();
				} else {
					showError('login-error', 'Invalid response from server');
				}
			} else {
				showError('login-error', result.message || 'Failed to login');
			}
		} catch (error) {
			showError('login-error', 'Failed to login');
		}
	};
}

async function showAdminPanel() {
	document.getElementById('setup-screen').classList.add('hidden');
	document.getElementById('login-screen').classList.add('hidden');
	document.getElementById('admin-panel').classList.remove('hidden');

	document.getElementById('user-name').textContent = currentUser.name;
	const roleBadge = document.getElementById('user-role');
	roleBadge.textContent = currentUser.role.toUpperCase();
	roleBadge.className = `user-badge ${currentUser.role === 'admin' ? 'admin' : ''}`;

	// Show users and comp tabs only for admins
	const usersTabButton = document.getElementById('users-tab-button');
	const usersTabContent = document.getElementById('users-tab');
	const compTabButton = document.getElementById('comp-tab-button');
	const compTabContent = document.getElementById('comp-tab');
	if (currentUser.role === 'admin') {
		usersTabButton.classList.remove('hidden');
		compTabButton.classList.remove('hidden');
		loadUsers();
		loadComp();
	} else {
		usersTabButton.classList.add('hidden');
		usersTabContent.classList.add('hidden');
		compTabButton.classList.add('hidden');
		compTabContent.classList.add('hidden');
	}

	loadPages();
	loadSitemap();
}

async function logout() {
	try {
		await fetch(`${API_BASE}/api/auth/logout`, { credentials: 'include' });
	} catch (error) {
		console.error('Logout error:', error);
	}
	currentUser = null;
	showLoginScreen();
}

function showError(elementId, message) {
	const errorEl = document.getElementById(elementId);
	errorEl.textContent = message;
	errorEl.classList.remove('hidden');
	setTimeout(() => errorEl.classList.add('hidden'), 5000);
}

function clearError(elementId) {
	const errorEl = document.getElementById(elementId);
	if (errorEl) {
		errorEl.textContent = '';
		errorEl.classList.add('hidden');
	}
}

function showTab(tabName, element) {
	// Prevent non-admin users from accessing users or comp tab
	if ((tabName === 'users' || tabName === 'comp') && (!currentUser || currentUser.role !== 'admin')) {
		alert('Access denied. Admin privileges required.');
		return;
	}

	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));

	if (element) {
		element.classList.add('active');
	}
	const tabContent = document.getElementById(`${tabName}-tab`);
	if (tabContent) {
		tabContent.classList.remove('hidden');
	}
}

// Format date helper
function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

// Pages
async function loadPages() {
	try {
		const res = await fetch(`${API_BASE}/api/pages`, { credentials: 'include' });
		const data = await res.json();
		const tbody = document.getElementById('pages-list');
		tbody.innerHTML = '';

		if (data.data && data.data.length > 0) {
			data.data.forEach(page => {
				const tr = document.createElement('tr');
				const statusClass = `badge badge-${page.status}`;
				tr.innerHTML = `
					<td><strong>${escapeHtml(page.name)}</strong></td>
					<td>${escapeHtml(page.title)}</td>
					<td class="text-muted">${escapeHtml(page.path || '—')}</td>
					<td><span class="badge">${escapeHtml(page.type || '')}</span></td>
					<td><span class="${statusClass}">${page.status}</span></td>
					<td class="text-muted">${formatDate(page.updated_at)}</td>
					<td>
						<div class="actions">
							${currentUser.role === 'admin' ? `
								<button class="btn btn-primary btn-sm" onclick="editPage(${page.id})">Edit</button>
								<button class="btn btn-danger btn-sm" onclick="deletePage(${page.id})">Delete</button>
							` : '<span class="text-muted">View only</span>'}
						</div>
					</td>
				`;
				tbody.appendChild(tr);
			});
		} else {
			tbody.innerHTML = `
				<tr>
					<td colspan="7" class="empty-state">
						<div>
							<h3>No pages yet</h3>
							<p>Create your first page to get started</p>
						</div>
					</td>
				</tr>
			`;
		}
	} catch (error) {
		console.error('Failed to load pages:', error);
		const tbody = document.getElementById('pages-list');
		tbody.innerHTML = `
			<tr>
				<td colspan="7" class="empty-state">
					<div>
						<h3>Error loading pages</h3>
						<p>Please refresh the page</p>
					</div>
				</td>
			</tr>
		`;
	}
}

function showPageForm(pageId = null) {
	const form = document.getElementById('page-form');
	const title = document.getElementById('page-form-title');
	form.classList.remove('hidden');

	if (pageId) {
		title.textContent = 'Edit Page';
		loadPage(pageId);
	} else {
		title.textContent = 'Create New Page';
		document.getElementById('page-form-element').reset();
		document.getElementById('page-id').value = '';
		document.getElementById('page-status').value = 'draft';
	}

	// Scroll to form
	form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hidePageForm() {
	document.getElementById('page-form').classList.add('hidden');
}

async function loadPage(id) {
	try {
		const res = await fetch(`${API_BASE}/api/pages/${id}`, { credentials: 'include' });
		const data = await res.json();
		const page = data.data;

		document.getElementById('page-id').value = page.id;
		document.getElementById('page-name').value = page.name;
		document.getElementById('page-title').value = page.title;
		document.getElementById('page-path').value = page.path || '';
		document.getElementById('page-type').value = page.type || 'html';
		document.getElementById('page-data').value = page.data || '';
		document.getElementById('page-meta').value = page.meta || '';
		document.getElementById('page-status').value = page.status;
	} catch (error) {
		showError('page-error', 'Failed to load page');
	}
}

document.getElementById('page-form-element').onsubmit = async (e) => {
	e.preventDefault();
	clearError('page-error');
	const id = document.getElementById('page-id').value;
	const data = {
		name: document.getElementById('page-name').value.trim(),
		title: document.getElementById('page-title').value.trim(),
		path: document.getElementById('page-path').value.trim() || undefined,
		type: document.getElementById('page-type').value,
		data: document.getElementById('page-data').value,
		meta: document.getElementById('page-meta').value.trim(),
		status: document.getElementById('page-status').value
	};

	try {
		const url = id ? `${API_BASE}/api/pages/${id}` : `${API_BASE}/api/pages`;
		const method = id ? 'PUT' : 'POST';
		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		let result;
		try {
			result = await res.json();
		} catch (parseErr) {
			if (res.ok) {
				hidePageForm();
				loadPages();
				return;
			}
			showError('page-error', 'Failed to save page');
			return;
		}
		if (res.ok) {
			clearError('page-error');
			hidePageForm();
			loadPages();
		} else {
			showError('page-error', result.message || 'Failed to save page');
		}
	} catch (error) {
		showError('page-error', 'Failed to save page');
	}
};

async function editPage(id) {
	showPageForm(id);
}

async function deletePage(id) {
	if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;

	try {
		const res = await fetch(`${API_BASE}/api/pages/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (res.ok) {
			loadPages();
		} else {
			const result = await res.json();
			alert(result.message || 'Failed to delete page');
		}
	} catch (error) {
		alert('Failed to delete page');
	}
}

// Sitemap
async function loadSitemap() {
	try {
		const res = await fetch(`${API_BASE}/api/sitemap`, { credentials: 'include' });
		const data = await res.json();
		const tbody = document.getElementById('sitemap-list');
		tbody.innerHTML = '';

		if (data.data && data.data.length > 0) {
			data.data.forEach(entry => {
				const tr = document.createElement('tr');
				const statusClass = `badge badge-${entry.status}`;
				tr.innerHTML = `
					<td><code>${escapeHtml(entry.url)}</code></td>
					<td>${entry.priority}</td>
					<td>${entry.changefreq}</td>
					<td><span class="${statusClass}">${entry.status}</span></td>
					<td>
						<div class="actions">
							${currentUser.role === 'admin' ? `
								<button class="btn btn-primary btn-sm" onclick="editSitemap(${entry.id})">Edit</button>
								<button class="btn btn-danger btn-sm" onclick="deleteSitemap(${entry.id})">Delete</button>
							` : '<span class="text-muted">View only</span>'}
						</div>
					</td>
				`;
				tbody.appendChild(tr);
			});
		} else {
			tbody.innerHTML = `
				<tr>
					<td colspan="5" class="empty-state">
						<div>
							<h3>No sitemap entries yet</h3>
							<p>Add your first sitemap entry</p>
						</div>
					</td>
				</tr>
			`;
		}
	} catch (error) {
		console.error('Failed to load sitemap:', error);
	}
}

function showSitemapForm(entryId = null) {
	const form = document.getElementById('sitemap-form');
	const title = document.getElementById('sitemap-form-title');
	form.classList.remove('hidden');

	if (entryId) {
		title.textContent = 'Edit Sitemap Entry';
		loadSitemapEntry(entryId);
	} else {
		title.textContent = 'Add Sitemap Entry';
		document.getElementById('sitemap-form-element').reset();
		document.getElementById('sitemap-id').value = '';
		document.getElementById('sitemap-priority').value = '0.5';
		document.getElementById('sitemap-status').value = 'active';
	}

	form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideSitemapForm() {
	document.getElementById('sitemap-form').classList.add('hidden');
}

async function loadSitemapEntry(id) {
	try {
		const res = await fetch(`${API_BASE}/api/sitemap/${id}`, { credentials: 'include' });
		const data = await res.json();
		const entry = data.data;

		document.getElementById('sitemap-id').value = entry.id;
		document.getElementById('sitemap-url').value = entry.url;
		document.getElementById('sitemap-priority').value = entry.priority;
		document.getElementById('sitemap-changefreq').value = entry.changefreq;
		document.getElementById('sitemap-status').value = entry.status;
	} catch (error) {
		showError('sitemap-error', 'Failed to load sitemap entry');
	}
}

document.getElementById('sitemap-form-element').onsubmit = async (e) => {
	e.preventDefault();
	clearError('sitemap-error');
	const id = document.getElementById('sitemap-id').value;
	const data = {
		url: document.getElementById('sitemap-url').value.trim(),
		priority: parseFloat(document.getElementById('sitemap-priority').value),
		changefreq: document.getElementById('sitemap-changefreq').value,
		status: document.getElementById('sitemap-status').value
	};

	try {
		const url = id ? `${API_BASE}/api/sitemap/${id}` : `${API_BASE}/api/sitemap`;
		const method = id ? 'PUT' : 'POST';
		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		let result;
		try {
			result = await res.json();
		} catch (parseErr) {
			if (res.ok) {
				hideSitemapForm();
				loadSitemap();
				return;
			}
			showError('sitemap-error', 'Failed to save sitemap entry');
			return;
		}
		if (res.ok) {
			clearError('sitemap-error');
			hideSitemapForm();
			loadSitemap();
		} else {
			showError('sitemap-error', result.message || 'Failed to save sitemap entry');
		}
	} catch (error) {
		showError('sitemap-error', 'Failed to save sitemap entry');
	}
};

async function editSitemap(id) {
	showSitemapForm(id);
}

async function deleteSitemap(id) {
	if (!confirm('Are you sure you want to delete this sitemap entry?')) return;

	try {
		const res = await fetch(`${API_BASE}/api/sitemap/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (res.ok) {
			loadSitemap();
		} else {
			const result = await res.json();
			alert(result.message || 'Failed to delete entry');
		}
	} catch (error) {
		alert('Failed to delete sitemap entry');
	}
}

// Comp (Admin only)
async function loadComp() {
	try {
		const res = await fetch(`${API_BASE}/api/comp`, { credentials: 'include' });
		const data = await res.json();
		const tbody = document.getElementById('comp-list');
		tbody.innerHTML = '';

		if (data.data && data.data.length > 0) {
			data.data.forEach((row) => {
				const tr = document.createElement('tr');
				const dataPreview =
					row.data && row.data.length > 80
						? escapeHtml(row.data.substring(0, 80)) + '…'
						: escapeHtml(row.data || '');
				tr.innerHTML = `
					<td><code>${escapeHtml(row.key)}</code></td>
					<td>${escapeHtml(row.type)}</td>
					<td class="text-muted" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${dataPreview}</td>
					<td>
						<div class="actions">
							<button class="btn btn-primary btn-sm" onclick="editComp(${row.id})">Edit</button>
							<button class="btn btn-danger btn-sm" onclick="deleteComp(${row.id})">Delete</button>
						</div>
					</td>
				`;
				tbody.appendChild(tr);
			});
		} else {
			tbody.innerHTML = `
				<tr>
					<td colspan="4" class="empty-state">
						<div>
							<h3>No comp entries yet</h3>
							<p>Add comp data (e.g. header)</p>
						</div>
					</td>
				</tr>
			`;
		}
	} catch (error) {
		console.error('Failed to load comp:', error);
	}
}

function showCompForm(id = null) {
	const form = document.getElementById('comp-form');
	const title = document.getElementById('comp-form-title');
	form.classList.remove('hidden');
	if (id) {
		title.textContent = 'Edit Comp';
		loadCompEntry(id);
	} else {
		title.textContent = 'Add Comp';
		document.getElementById('comp-form-element').reset();
		document.getElementById('comp-id').value = '';
	}
	form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideCompForm() {
	document.getElementById('comp-form').classList.add('hidden');
}

async function loadCompEntry(id) {
	try {
		const res = await fetch(`${API_BASE}/api/comp/by-id/${id}`, { credentials: 'include' });
		const data = await res.json();
		if (!data.data) {
			showError('comp-error', 'Comp not found');
			return;
		}
		const row = data.data;
		document.getElementById('comp-id').value = row.id;
		document.getElementById('comp-key').value = row.key;
		document.getElementById('comp-type').value = row.type;
		document.getElementById('comp-data').value = row.data || '';
	} catch (error) {
		showError('comp-error', 'Failed to load comp');
	}
}

document.getElementById('comp-form-element').onsubmit = async (e) => {
	e.preventDefault();
	clearError('comp-error');
	const id = document.getElementById('comp-id').value;
	const key = document.getElementById('comp-key').value.trim();
	const type = document.getElementById('comp-type').value.trim();
	const dataVal = document.getElementById('comp-data').value.trim();

	if (!key || !type) {
		showError('comp-error', 'Key and type are required');
		return;
	}

	try {
		const url = id ? `${API_BASE}/api/comp/${id}` : `${API_BASE}/api/comp`;
		const method = id ? 'PUT' : 'POST';
		const body = id ? { key, type, data: dataVal } : { key, type, data: dataVal };
		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(body)
		});

		let result;
		try {
			result = await res.json();
		} catch (parseErr) {
			if (res.ok) {
				hideCompForm();
				loadComp();
				return;
			}
			showError('comp-error', 'Failed to save comp');
			return;
		}
		if (res.ok) {
			clearError('comp-error');
			hideCompForm();
			loadComp();
		} else {
			showError('comp-error', result.message || 'Failed to save comp');
		}
	} catch (error) {
		showError('comp-error', 'Failed to save comp');
	}
};

function editComp(id) {
	showCompForm(id);
}

async function deleteComp(id) {
	if (!confirm('Are you sure you want to delete this comp entry?')) return;
	try {
		const res = await fetch(`${API_BASE}/api/comp/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (res.ok) {
			loadComp();
		} else {
			const result = await res.json();
			alert(result.message || 'Failed to delete comp');
		}
	} catch (error) {
		alert('Failed to delete comp');
	}
}

// Users (Admin only)
async function loadUsers() {
	try {
		const res = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
		const data = await res.json();
		const tbody = document.getElementById('users-list');
		tbody.innerHTML = '';

		if (data.data && data.data.length > 0) {
			data.data.forEach(user => {
				const tr = document.createElement('tr');
				const roleClass = `badge badge-${user.role}`;
				tr.innerHTML = `
					<td>${escapeHtml(user.email)}</td>
					<td>${escapeHtml(user.name)}</td>
					<td><span class="${roleClass}">${user.role}</span></td>
					<td class="text-muted">${formatDate(user.created_at)}</td>
					<td>
						<div class="actions">
							<button class="btn btn-primary btn-sm" onclick="editUser(${user.id})">Edit</button>
							${user.id !== currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>` : '<span class="text-muted">Current user</span>'}
						</div>
					</td>
				`;
				tbody.appendChild(tr);
			});
		} else {
			tbody.innerHTML = `
				<tr>
					<td colspan="5" class="empty-state">
						<div>
							<h3>No users yet</h3>
							<p>Create users to manage access</p>
						</div>
					</td>
				</tr>
			`;
		}
	} catch (error) {
		console.error('Failed to load users:', error);
	}
}

function showUserForm(userId = null) {
	const form = document.getElementById('user-form');
	const title = document.getElementById('user-form-title');
	const passwordInput = document.getElementById('user-password');
	const passwordHint = document.getElementById('password-hint');

	form.classList.remove('hidden');

	if (userId) {
		title.textContent = 'Edit User';
		passwordInput.required = false;
		passwordHint.textContent = 'Leave blank to keep current password';
		loadUser(userId);
	} else {
		title.textContent = 'Create User';
		document.getElementById('user-form-element').reset();
		document.getElementById('user-id').value = '';
		passwordInput.required = true;
		passwordHint.textContent = 'Required for new users';
		document.getElementById('user-role-select').value = 'user';
	}

	form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideUserForm() {
	document.getElementById('user-form').classList.add('hidden');
}

async function loadUser(id) {
	try {
		const res = await fetch(`${API_BASE}/api/users/${id}`, { credentials: 'include' });
		const data = await res.json();
		const user = data.data;

		document.getElementById('user-id').value = user.id;
		document.getElementById('user-email').value = user.email;
		document.getElementById('user-name-input').value = user.name;
		document.getElementById('user-phone').value = user.phone || '';
		document.getElementById('user-role-select').value = user.role;
	} catch (error) {
		showError('user-error', 'Failed to load user');
	}
}

document.getElementById('user-form-element').onsubmit = async (e) => {
	e.preventDefault();
	clearError('user-error');
	const id = document.getElementById('user-id').value;
	const password = document.getElementById('user-password').value;

	const data = {
		email: document.getElementById('user-email').value.trim(),
		name: document.getElementById('user-name-input').value.trim(),
		phone: document.getElementById('user-phone').value.trim(),
		role: document.getElementById('user-role-select').value
	};

	if (password || !id) {
		if (!password && !id) {
			showError('user-error', 'Password is required for new users');
			return;
		}
		data.password = password;
	}

	try {
		const url = id ? `${API_BASE}/api/users/${id}` : `${API_BASE}/api/users`;
		const method = id ? 'PUT' : 'POST';
		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data)
		});

		let result;
		try {
			result = await res.json();
		} catch (parseErr) {
			if (res.ok) {
				hideUserForm();
				loadUsers();
				return;
			}
			showError('user-error', 'Failed to save user');
			return;
		}
		if (res.ok) {
			clearError('user-error');
			hideUserForm();
			loadUsers();
		} else {
			showError('user-error', result.message || 'Failed to save user');
		}
	} catch (error) {
		showError('user-error', 'Failed to save user');
	}
};

async function editUser(id) {
	showUserForm(id);
}

async function deleteUser(id) {
	if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

	try {
		const res = await fetch(`${API_BASE}/api/users/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (res.ok) {
			loadUsers();
		} else {
			const result = await res.json();
			alert(result.message || 'Failed to delete user');
		}
	} catch (error) {
		alert('Failed to delete user');
	}
}

// Utility function to escape HTML
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Initialize on load
init();
