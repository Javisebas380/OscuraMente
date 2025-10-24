import AsyncStorage from '@react-native-async-storage/async-storage';
import { devLog, errorLog } from '../utils/environment';

export interface UnlockState {
  [key: string]: {
    isUnlocked: boolean;
    unlockedAt?: string;
    method?: 'ad' | 'premium' | 'free';
  };
}

const UNLOCK_STATE_KEY = '@unlock_state';
const FREE_UNLOCK_KEY = '@free_unlock_used';

class UnlockManager {
  private unlockState: UnlockState = {};
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      devLog('UnlockManager', 'Already initialized');
      return true;
    }

    try {
      devLog('UnlockManager', 'Initializing unlock manager...');
      const stored = await AsyncStorage.getItem(UNLOCK_STATE_KEY);

      if (stored) {
        this.unlockState = JSON.parse(stored);
        devLog('UnlockManager', `Loaded ${Object.keys(this.unlockState).length} unlock states`);
      } else {
        devLog('UnlockManager', 'No stored unlock state found');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      errorLog('UnlockManager', 'Failed to initialize', error);
      this.initialized = true;
      return false;
    }
  }

  async isUnlocked(sectionId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const state = this.unlockState[sectionId];
    return state?.isUnlocked || false;
  }

  async unlock(sectionId: string, method: 'ad' | 'premium' | 'free'): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      devLog('UnlockManager', `Unlocking section: ${sectionId} via ${method}`);

      this.unlockState[sectionId] = {
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
        method,
      };

      await AsyncStorage.setItem(UNLOCK_STATE_KEY, JSON.stringify(this.unlockState));
      devLog('UnlockManager', `Section ${sectionId} unlocked successfully`);

      return true;
    } catch (error) {
      errorLog('UnlockManager', `Failed to unlock section ${sectionId}`, error);
      return false;
    }
  }

  async lock(sectionId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      devLog('UnlockManager', `Locking section: ${sectionId}`);

      if (this.unlockState[sectionId]) {
        delete this.unlockState[sectionId];
        await AsyncStorage.setItem(UNLOCK_STATE_KEY, JSON.stringify(this.unlockState));
        devLog('UnlockManager', `Section ${sectionId} locked successfully`);
      }

      return true;
    } catch (error) {
      errorLog('UnlockManager', `Failed to lock section ${sectionId}`, error);
      return false;
    }
  }

  async unlockAll(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      devLog('UnlockManager', 'Unlocking all sections');

      const sections = Object.keys(this.unlockState);
      sections.forEach(sectionId => {
        this.unlockState[sectionId] = {
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
          method: 'premium',
        };
      });

      await AsyncStorage.setItem(UNLOCK_STATE_KEY, JSON.stringify(this.unlockState));
      devLog('UnlockManager', 'All sections unlocked');

      return true;
    } catch (error) {
      errorLog('UnlockManager', 'Failed to unlock all sections', error);
      return false;
    }
  }

  async lockAll(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      devLog('UnlockManager', 'Locking all sections');

      this.unlockState = {};
      await AsyncStorage.setItem(UNLOCK_STATE_KEY, JSON.stringify(this.unlockState));
      devLog('UnlockManager', 'All sections locked');

      return true;
    } catch (error) {
      errorLog('UnlockManager', 'Failed to lock all sections', error);
      return false;
    }
  }

  async canUseFreeUnlock(): Promise<boolean> {
    try {
      const lastUsed = await AsyncStorage.getItem(FREE_UNLOCK_KEY);

      if (!lastUsed) {
        return true;
      }

      const lastUsedDate = new Date(lastUsed);
      const now = new Date();

      const isSameDay = lastUsedDate.toDateString() === now.toDateString();

      return !isSameDay;
    } catch (error) {
      errorLog('UnlockManager', 'Error checking free unlock availability', error);
      return false;
    }
  }

  async useFreeUnlock(sectionId: string): Promise<boolean> {
    try {
      const canUse = await this.canUseFreeUnlock();

      if (!canUse) {
        devLog('UnlockManager', 'Free unlock already used today');
        return false;
      }

      await AsyncStorage.setItem(FREE_UNLOCK_KEY, new Date().toISOString());
      await this.unlock(sectionId, 'free');

      devLog('UnlockManager', `Free unlock used for section: ${sectionId}`);
      return true;
    } catch (error) {
      errorLog('UnlockManager', 'Error using free unlock', error);
      return false;
    }
  }

  getUnlockState(): UnlockState {
    return { ...this.unlockState };
  }

  async reset(): Promise<boolean> {
    try {
      devLog('UnlockManager', 'Resetting all unlock data');

      this.unlockState = {};
      await AsyncStorage.removeItem(UNLOCK_STATE_KEY);
      await AsyncStorage.removeItem(FREE_UNLOCK_KEY);

      devLog('UnlockManager', 'Unlock data reset successfully');
      return true;
    } catch (error) {
      errorLog('UnlockManager', 'Failed to reset unlock data', error);
      return false;
    }
  }
}

export const unlockManager = new UnlockManager();
