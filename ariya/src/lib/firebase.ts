import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredVars.filter((varName) => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.warn("Missing Firebase environment variables:", missingVars);
}

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const storage = app.storage();
const auth = app.auth();

// Types
export interface ForumPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: firebase.firestore.Timestamp;
  likes: string[];
  replies?: ForumPost[];
}

export interface CommunityResource {
  id: string;
  communityId: string;
  name: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploaderId: string;
  uploaderName: string;
  timestamp: firebase.firestore.Timestamp;
  downloads: number;
  downloaders: string[];
}

export interface CommunityMember {
  userId: string;
  communityId: string;
  name: string;
  joinedAt: firebase.firestore.Timestamp;
  lastActive: firebase.firestore.Timestamp;
  contributionScore: number;
  role: "member" | "moderator" | "admin";
}

// Community Posts Service
export class CommunityPostsService {
  static async getPosts(communityId: string): Promise<ForumPost[]> {
    try {
      const querySnapshot = await db
        .collection("community_posts")
        .where("communityId", "==", communityId)
        .orderBy("timestamp", "desc")
        .get();

      const posts: ForumPost[] = [];

      querySnapshot.forEach((doc: any) => {
        posts.push({ id: doc.id, ...doc.data() } as ForumPost);
      });

      return posts;
    } catch (error) {
      console.error("Error getting posts:", error);
      return [];
    }
  }

  static async createPost(
    post: Omit<ForumPost, "id" | "timestamp">
  ): Promise<string> {
    try {
      const docRef = await db.collection("community_posts").add({
        ...post,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [],
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  static async getReplies(postId: string): Promise<ForumPost[]> {
    try {
      const querySnapshot = await db
        .collection("community_posts")
        .where("parentPostId", "==", postId)
        .orderBy("timestamp", "asc")
        .get();

      const replies: ForumPost[] = [];

      querySnapshot.forEach((doc: any) => {
        replies.push({ id: doc.id, ...doc.data() } as ForumPost);
      });

      return replies;
    } catch (error) {
      console.error("Error getting replies:", error);
      return [];
    }
  }

  static async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const postRef = db.collection("community_posts").doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new Error("Post not found");
      }

      const postData = postDoc.data();
      const likes = postData?.likes || [];
      const userLiked = likes.includes(userId);

      if (userLiked) {
        await postRef.update({
          likes: firebase.firestore.FieldValue.arrayRemove(userId),
        });
      } else {
        await postRef.update({
          likes: firebase.firestore.FieldValue.arrayUnion(userId),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  static async deletePost(postId: string): Promise<void> {
    try {
      await db.collection("community_posts").doc(postId).delete();
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  static subscribeToPosts(
    communityId: string,
    callback: (posts: ForumPost[]) => void
  ): () => void {
    const q = db
      .collection("community_posts")
      .where("communityId", "==", communityId)
      .orderBy("timestamp", "desc");

    return q.onSnapshot((querySnapshot: any) => {
      const posts: ForumPost[] = [];
      querySnapshot.forEach((doc: any) => {
        posts.push({ id: doc.id, ...doc.data() } as ForumPost);
      });
      callback(posts);
    });
  }
}

// Community Resources Service
export class CommunityResourcesService {
  static async getResources(communityId: string): Promise<CommunityResource[]> {
    try {
      const querySnapshot = await db
        .collection("community_resources")
        .where("communityId", "==", communityId)
        .orderBy("timestamp", "desc")
        .get();

      const resources: CommunityResource[] = [];

      querySnapshot.forEach((doc: any) => {
        resources.push({ id: doc.id, ...doc.data() } as CommunityResource);
      });

      return resources;
    } catch (error) {
      console.error("Error getting resources:", error);
      return [];
    }
  }

  static async uploadResource(
    communityId: string,
    file: File,
    name: string,
    description: string,
    uploaderId: string,
    uploaderName: string
  ): Promise<string> {
    try {
      // Upload file to Firebase Storage
      const storageRef = storage.ref();
      const fileRef = storageRef.child(
        `community_resources/${communityId}/${Date.now()}_${file.name}`
      );
      const snapshot = await fileRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();

      // Save resource metadata to Firestore
      const docRef = await db.collection("community_resources").add({
        communityId,
        name,
        description,
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        uploaderId,
        uploaderName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        downloads: 0,
        downloaders: [],
      });

      return docRef.id;
    } catch (error) {
      console.error("Error uploading resource:", error);
      throw error;
    }
  }

  static async trackDownload(
    resourceId: string,
    userId: string
  ): Promise<void> {
    try {
      const resourceRef = db.collection("community_resources").doc(resourceId);
      await resourceRef.update({
        downloads: firebase.firestore.FieldValue.increment(1),
        downloaders: firebase.firestore.FieldValue.arrayUnion(userId),
      });
    } catch (error) {
      console.error("Error tracking download:", error);
      throw error;
    }
  }

  static async deleteResource(resourceId: string): Promise<void> {
    try {
      const resourceDoc = await db
        .collection("community_resources")
        .doc(resourceId)
        .get();
      if (resourceDoc.exists) {
        const data = resourceDoc.data();
        if (data?.fileUrl) {
          // Delete from Storage
          const fileRef = storage.refFromURL(data.fileUrl);
          await fileRef.delete();
        }
        // Delete from Firestore
        await resourceDoc.ref.delete();
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      throw error;
    }
  }
}

// Community Members Service
export class CommunityMembersService {
  static async getMembers(communityId: string): Promise<CommunityMember[]> {
    try {
      const querySnapshot = await db
        .collection("community_members")
        .where("communityId", "==", communityId)
        .orderBy("joinedAt", "desc")
        .get();

      const members: CommunityMember[] = [];

      querySnapshot.forEach((doc: any) => {
        members.push({ ...doc.data() } as CommunityMember);
      });

      return members;
    } catch (error) {
      console.error("Error getting members:", error);
      return [];
    }
  }

  static async addMember(
    member: Omit<CommunityMember, "joinedAt" | "lastActive">
  ): Promise<void> {
    try {
      await db
        .collection("community_members")
        .doc(`${member.communityId}_${member.userId}`)
        .set({
          ...member,
          joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }

  static async updateMemberActivity(
    communityId: string,
    userId: string
  ): Promise<void> {
    try {
      const memberRef = db
        .collection("community_members")
        .doc(`${communityId}_${userId}`);

      // Check if document exists first
      const memberDoc = await memberRef.get();

      if (memberDoc.exists) {
        // Update existing member
        await memberRef.update({
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create new member document if it doesn't exist
        await memberRef.set({
          communityId,
          userId,
          name: userId, // Using address as name for now
          joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          contributionScore: 0,
          role: "member",
        });
      }
    } catch (error) {
      console.error("Error updating member activity:", error);
      throw error;
    }
  }

  static async updateContributionScore(
    communityId: string,
    userId: string,
    score: number
  ): Promise<void> {
    try {
      await db
        .collection("community_members")
        .doc(`${communityId}_${userId}`)
        .update({
          contributionScore: firebase.firestore.FieldValue.increment(score),
        });
    } catch (error) {
      console.error("Error updating contribution score:", error);
      throw error;
    }
  }
}

// Telegram Bot Service
export class TelegramService {
  private static readonly BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  private static readonly BOT_API_URL = `https://api.telegram.org/bot${TelegramService.BOT_TOKEN}`;

  // Send message to user
  static async sendMessage(chatId: string, text: string, options?: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: any;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${TelegramService.BOT_API_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options?.parse_mode || 'HTML',
          reply_markup: options?.reply_markup,
        }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  // Get user info from Telegram
  static async getUserInfo(chatId: string): Promise<any> {
    try {
      const response = await fetch(`${TelegramService.BOT_API_URL}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
        }),
      });

      const result = await response.json();
      return result.ok ? result.result : null;
    } catch (error) {
      console.error('Error getting Telegram user info:', error);
      return null;
    }
  }

  // Generate verification code
  static generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Store verification code in Firestore
  static async storeVerificationCode(userId: string, code: string, telegramHandle?: string): Promise<void> {
    try {
      const data: any = {
        code,
        userId, // Store the user's wallet address
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      };
      
      if (telegramHandle) {
        data.telegramHandle = telegramHandle;
      }
      
      await db.collection('telegram_verification').doc(userId).set(data);
    } catch (error) {
      console.error('Error storing verification code:', error);
      throw error;
    }
  }

  // Verify code and link Telegram account
  static async verifyAndLinkAccount(userId: string, code: string, telegramHandle: string): Promise<boolean> {
    try {
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      
      if (!verificationDoc.exists) {
        return false;
      }

      const verificationData = verificationDoc.data();
      const now = new Date();
      const expiresAt = verificationData?.expiresAt?.toDate();

      if (!expiresAt || now > expiresAt) {
        // Code expired
        await verificationDoc.ref.delete();
        return false;
      }

      if (verificationData?.code !== code) {
        return false;
      }

      // Mark as verified by updating the verification document
      await verificationDoc.ref.update({
        verified: true,
        verified_at: firebase.firestore.FieldValue.serverTimestamp(),
        telegram_handle: telegramHandle,
      });

      return true;
    } catch (error) {
      console.error('Error verifying Telegram account:', error);
      return false;
    }
  }

  // Handle /verify command from Telegram bot
  static async handleVerifyCommand(telegramUserId: string, telegramHandle: string, code: string): Promise<boolean> {
    try {
      // Find user by telegram handle
      const usersSnapshot = await db.collection('users')
        .where('telegram_handle', '==', telegramHandle)
        .where('telegram_verified', '==', false)
        .get();

      if (usersSnapshot.empty) {
        return false;
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      // Check verification code
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      
      if (!verificationDoc.exists) {
        return false;
      }

      const verificationData = verificationDoc.data();
      const now = new Date();
      const expiresAt = verificationData?.expiresAt?.toDate();

      if (!expiresAt || now > expiresAt) {
        await verificationDoc.ref.delete();
        return false;
      }

      if (verificationData?.code !== code) {
        return false;
      }

      // Update user with Telegram user ID
      await userDoc.ref.update({
        telegram_user_id: telegramUserId,
        telegram_verified: true,
        telegram_verified_at: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Clean up verification code
      await verificationDoc.ref.delete();

      return true;
    } catch (error) {
      console.error('Error handling verify command:', error);
      return false;
    }
  }

  // Send event registration confirmation
  static async sendRegistrationConfirmation(userId: string, eventName: string, eventDate: string): Promise<void> {
    try {
      // Find verification document by userId (wallet address)
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      if (!verificationData?.verified || !verificationData?.telegram_user_id) return;

      const message = `
🎉 <b>Registration Confirmed!</b>

You've successfully registered for:
<b>${eventName}</b>

📅 Date: ${eventDate}

We'll send you reminders before the event starts. See you there!
      `.trim();

      await TelegramService.sendMessage(verificationData.telegram_user_id, message);
    } catch (error) {
      console.error('Error sending registration confirmation:', error);
    }
  }

  // Send event reminder
  static async sendEventReminder(userId: string, eventName: string, eventDate: string, timeUntil: string): Promise<void> {
    try {
      // Find verification document by userId (wallet address)
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      if (!verificationData?.verified || !verificationData?.telegram_user_id) return;

      const message = `
⏰ <b>Event Reminder</b>

Your event is coming up:
<b>${eventName}</b>

📅 Date: ${eventDate}
⏱️ Time until event: ${timeUntil}

Don't forget to check in when you arrive!
      `.trim();

      await TelegramService.sendMessage(verificationData.telegram_user_id, message);
    } catch (error) {
      console.error('Error sending event reminder:', error);
    }
  }

  // Send check-in notification
  static async sendCheckInNotification(userId: string, eventName: string): Promise<void> {
    try {
      // Find verification document by userId (wallet address)
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      if (!verificationData?.verified || !verificationData?.telegram_user_id) return;

      const message = `
✅ <b>Checked In!</b>

Welcome to <b>${eventName}</b>!

You're now checked in and can participate in the event activities.
      `.trim();

      await TelegramService.sendMessage(verificationData.telegram_user_id, message);
    } catch (error) {
      console.error('Error sending check-in notification:', error);
    }
  }

  // Send document flow notification
  static async sendDocumentFlowNotification(userId: string, eventName: string, action: string): Promise<void> {
    try {
      // Find verification document by userId (wallet address)
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      if (!verificationData?.verified || !verificationData?.telegram_user_id) return;

      const message = `
📄 <b>Document Flow Update</b>

Event: <b>${eventName}</b>
Action: ${action}

Check your app for more details.
      `.trim();

      await TelegramService.sendMessage(verificationData.telegram_user_id, message);
    } catch (error) {
      console.error('Error sending document flow notification:', error);
    }
  }

  // Send profile creation notification
  static async sendProfileCreationNotification(userId: string, profileType: 'user' | 'organizer'): Promise<void> {
    try {
      // Find verification document by userId (wallet address)
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      if (!verificationData?.verified || !verificationData?.telegram_user_id) return;

      const profileTypeText = profileType === 'organizer' ? 'Organizer' : 'User';
      const emoji = profileType === 'organizer' ? '🎪' : '👤';

      const message = `
${emoji} <b>Profile Created Successfully!</b>

Your ${profileTypeText} profile has been created on Ariya Events Platform.

${profileType === 'organizer' ? 'You can now create and manage events!' : 'You can now register for events and participate in the community!'}

Welcome to Ariya! 🎉
      `.trim();

      await TelegramService.sendMessage(verificationData.telegram_user_id, message);
    } catch (error) {
      console.error('Error sending profile creation notification:', error);
    }
  }

  // Send event creation notification
  static async sendEventCreationNotification(userId: string, eventName: string, eventDate: string, eventTime: string): Promise<void> {
    try {
      // Find verification document by userId (wallet address)
      const verificationDoc = await db.collection('telegram_verification').doc(userId).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      if (!verificationData?.verified || !verificationData?.telegram_user_id) return;

      const message = `
🎪 <b>Event Created Successfully!</b>

Your event has been created:
<b>${eventName}</b>

📅 Date: ${eventDate}
⏰ Time: ${eventTime}

You can now manage your event from the organizer dashboard. We'll send you reminders before the event starts!
      `.trim();

      await TelegramService.sendMessage(verificationData.telegram_user_id, message);
    } catch (error) {
      console.error('Error sending event creation notification:', error);
    }
  }

  // Schedule event reminder (simplified version - in a real app you'd use a proper scheduler)
  static async scheduleEventReminder(userId: string, eventName: string, eventDate: string, timeUntil: string): Promise<void> {
    try {
      // For now, we'll just send the reminder immediately
      // In a real app, you'd store this in a database and use a cron job or scheduler
      await TelegramService.sendEventReminder(userId, eventName, eventDate, timeUntil);
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
    }
  }
}

// Export Firebase auth
export { auth };
