document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather icons
  feather.replace();

  // Pobierz dane po załadowaniu strony
  setTimeout(fetchHealthData, 1500);

  // Odświeżaj co minutę
  setInterval(fetchHealthData, 60000);
});

// Declare feather variable
const feather = window.feather;

async function fetchHealthData() {
  try {
    // Pobierz prawdziwe dane z API
    const response = await fetch('/health', { headers: { accept: 'application/json' } });
    const data = await response.json();

    updateUI(data);

    // Hide skeleton and show actual content
    document.getElementById('skeleton-card').style.display = 'none';
    document.getElementById('status-card').style.display = 'block';
  } catch (error) {
    console.error('Error fetching health data:', error);
    // Show error state
    updateUIWithError();
  }
}

function updateUI(data) {
  // Update version
  document.getElementById('version-text').textContent = `v${data.version}`;

  // Update status indicator
  const statusIndicator = document.getElementById('status-indicator');
  const statusIcon = statusIndicator.querySelector('.status-icon');
  const statusIconContainer = statusIndicator.querySelector('.status-icon-container');
  const statusTitle = document.getElementById('status-title');
  const statusDescription = document.getElementById('status-description');

  if (data.status === 'running') {
    statusIconContainer.style.backgroundColor = 'var(--green-background)';
    statusIcon.style.color = 'var(--green-text)';
    statusTitle.textContent = 'Service is running';
    statusDescription.textContent = 'All systems operational';
    statusDescription.className = 'status-description-ok';

    // Replace icon
    replaceIcon(statusIcon, 'check-circle');
  } else {
    statusIconContainer.style.backgroundColor = 'var(--red-background)';
    statusIcon.style.color = 'var(--red-text)';
    statusTitle.textContent = 'Service is down';
    statusDescription.textContent = 'Service is experiencing issues';
    statusDescription.className = 'status-description-error';

    // Replace icon
    replaceIcon(statusIcon, 'alert-circle');
  }

  // Update last checked time
  document.getElementById('last-checked').textContent = new Date().toLocaleString();

  // Update uptime
  document.getElementById('uptime-value').textContent = data.uptime;

  // Update progress bar
  const progressBar = document.getElementById('uptime-progress');
  progressBar.style.width = `${data.uptimePercentage}%`;

  // Update uptime percentage
  document.getElementById('uptime-percentage').textContent = `${data.uptimePercentage}% uptime`;
}

function updateUIWithError() {
  // Show error state in the UI
  document.getElementById('skeleton-card').style.display = 'none';
  document.getElementById('status-card').style.display = 'block';

  const statusIndicator = document.getElementById('status-indicator');
  const statusIcon = statusIndicator.querySelector('.status-icon');
  const statusIconContainer = statusIndicator.querySelector('.status-icon-container');
  const statusTitle = document.getElementById('status-title');
  const statusDescription = document.getElementById('status-description');

  statusIconContainer.style.backgroundColor = 'var(--red-background)';
  statusIcon.style.color = 'var(--red-text)';
  statusTitle.textContent = 'Unable to fetch status';
  statusDescription.textContent = 'Could not connect to service';
  statusDescription.className = 'status-description-error';

  // Replace icon
  replaceIcon(statusIcon, 'alert-circle');

  // Update last checked time
  document.getElementById('last-checked').textContent = new Date().toLocaleString();

  // Set uptime to unknown
  document.getElementById('uptime-value').textContent = 'Unknown';

  // Update progress bar to show error
  const progressBar = document.getElementById('uptime-progress');
  progressBar.style.width = '0%';

  // Update uptime percentage
  document.getElementById('uptime-percentage').textContent = 'Unable to determine uptime';
}

function replaceIcon(element, iconName) {
  // Remove existing icon
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  // Create new icon
  const newIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  newIcon.setAttribute('class', element.getAttribute('class'));
  newIcon.setAttribute('width', '24');
  newIcon.setAttribute('height', '24');
  newIcon.setAttribute('viewBox', '0 0 24 24');
  newIcon.setAttribute('fill', 'none');
  newIcon.setAttribute('stroke', 'currentColor');
  newIcon.setAttribute('stroke-width', '2');
  newIcon.setAttribute('stroke-linecap', 'round');
  newIcon.setAttribute('stroke-linejoin', 'round');

  // Set the icon path based on the icon name
  let path = '';
  if (iconName === 'check-circle') {
    path =
      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
  } else if (iconName === 'alert-circle') {
    path =
      '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
  }

  newIcon.innerHTML = path;
  element.appendChild(newIcon);
}
