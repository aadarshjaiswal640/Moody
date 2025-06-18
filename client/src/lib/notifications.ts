export async function initializeNotifications(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    setupNotificationSchedule();
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setupNotificationSchedule();
      return true;
    }
  }

  return false;
}

function setupNotificationSchedule() {
  // Schedule daily mood check-in reminder
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(20, 0, 0, 0); // 8 PM reminder
  
  if (now > reminderTime) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const timeUntilReminder = reminderTime.getTime() - now.getTime();
  
  setTimeout(() => {
    showMoodReminder();
    // Set up daily recurring reminder
    setInterval(showMoodReminder, 24 * 60 * 60 * 1000);
  }, timeUntilReminder);
}

function showMoodReminder() {
  if (Notification.permission === 'granted') {
    new Notification('MoodSync Reminder 🌟', {
      body: 'How are you feeling today? Take a moment to log your mood.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'mood-reminder',
      requireInteraction: false,
    });
  }
}

export function scheduleBreathingReminder() {
  if (Notification.permission === 'granted') {
    // Show breathing reminder after detecting stress/anxiety
    setTimeout(() => {
      new Notification('Take a Deep Breath 🫁', {
        body: 'Feeling stressed? Try a quick breathing exercise to relax.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'breathing-reminder',
      });
    }, 5000);
  }
}
