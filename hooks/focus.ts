//this file has all the logic for tracking focus sessions and logging session data
//you should create a single hook file for every page on the app

import Constants from 'expo-constants';

interface SessionData {
  startTime: number;
  endTime?: number;
  duration?: number;
  userId?: string;
}

// API functions for backend communication
const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

async function saveFocusTimeToBackend(userId: string, duration: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/focus/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, duration }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save focus time: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Focus time saved: ${result.sessionTime}`);
    console.log(`📅 Total today: ${result.totalToday}`);
  } catch (error) {
    console.error('❌ Failed to save focus time to database:', error);
    throw error;
  }
}

class SessionTracker {
  private currentSession: SessionData | null = null;

  startSession(userId?: string): void {
    const startTime = Date.now();
    this.currentSession = {
      startTime,
      userId,
    };
    
    console.log(`📚 Focus session started`);
    console.log(`⏰ Start time: ${new Date(startTime).toLocaleTimeString()}`);
    if (userId) {
      console.log(`👤 User ID: ${userId}`);
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) {
      console.log('⚠️ No active session to end');
      return;
    }

    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;
    const durationMinutes = Math.floor(duration / (1000 * 60));
    const durationSeconds = Math.floor((duration % (1000 * 60)) / 1000);

    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;

    // Log session summary
    console.log(`\n🎯 FOCUS SESSION COMPLETE`);
    console.log(`⏰ Duration: ${durationMinutes}m ${durationSeconds}s`);
    console.log(`🕐 Start: ${new Date(this.currentSession.startTime).toLocaleTimeString()}`);
    console.log(`🕕 End: ${new Date(endTime).toLocaleTimeString()}`);

    // Save to backend if user is available
    if (this.currentSession.userId) {
      try {
        console.log(`💾 Saving focus time to database...`);
        await saveFocusTimeToBackend(this.currentSession.userId, duration);
      } catch (error) {
        console.error('❌ Failed to save focus time:', error);
        // Continue execution even if backend save fails
      }
    } else {
      console.log(`⚠️ No user ID available - focus time not saved`);
    }
    
    console.log(`\n`);

    // Reset current session
    this.currentSession = null;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  getSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Date.now() - this.currentSession.startTime;
  }
}

// Export singleton instance
export const sessionTracker = new SessionTracker();