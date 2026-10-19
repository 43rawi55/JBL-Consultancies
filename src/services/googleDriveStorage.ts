/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Drive Storage Integration Service for Law Firm Case Files & Attachments
 * Implements client-side OAuth token retrieval with 'select_account' support (any Gmail account),
 * direct Drive REST API v3 multipart upload, folder organization, and direct URL generation.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize or reuse Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account', // Always allows user to pick any Gmail/Google account
});

// In-memory token storage (Security requirement: never in localStorage)
let cachedAccessToken: string | null = null;
let cachedUserEmail: string | null = null;
let isSigningIn = false;

// Default target folder for firm documents in Drive
const FIRM_DRIVE_FOLDER_NAME = 'Elite Jurist - Law Firm Case Files (ملفات مكتب المحاماة)';
let cachedFirmFolderId: string | null = null;

// Listen to auth state changes to keep token lifecycle clean
onAuthStateChanged(auth, (user) => {
  if (user) {
    cachedUserEmail = user.email || null;
  } else {
    cachedAccessToken = null;
    cachedUserEmail = null;
  }
});

/**
 * Returns true if Google Drive is actively authenticated and ready for uploads
 */
export const isDriveConnected = (): boolean => {
  return Boolean(cachedAccessToken);
};

/**
 * Returns the currently connected Google/Gmail account email address
 */
export const getConnectedDriveEmail = (): string | null => {
  return cachedUserEmail || auth.currentUser?.email || null;
};

/**
 * Initiates the Google Drive connection popup flow.
 * Supports choosing any Gmail account via select_account.
 */
export const connectGoogleDrive = async (
  forceAccountSelect = false
): Promise<{ accessToken: string; email: string }> => {
  if (cachedAccessToken && !forceAccountSelect) {
    return {
      accessToken: cachedAccessToken,
      email: cachedUserEmail || auth.currentUser?.email || 'Connected Google Account',
    };
  }

  isSigningIn = true;
  try {
    if (forceAccountSelect) {
      provider.setCustomParameters({ prompt: 'select_account' });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('لم نتمكن من الحصول على تصريح الوصول إلى Google Drive. يرجى المحاولة مجدداً.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUserEmail = result.user.email || null;

    return {
      accessToken: cachedAccessToken,
      email: cachedUserEmail || 'Google Drive',
    };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    // Fallback: If popup was closed or failed, try GIS token client if available in window
    if ((window as any).google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
      return new Promise((resolve, reject) => {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: firebaseConfig.oAuthClientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            prompt: 'select_account',
            callback: (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                cachedAccessToken = tokenResponse.access_token;
                cachedUserEmail = 'Connected Google Account';
                resolve({
                  accessToken: tokenResponse.access_token,
                  email: cachedUserEmail,
                });
              } else {
                reject(new Error(tokenResponse?.error || 'فشل الاتصال بحساب Google'));
              }
            },
            error_callback: (err: any) => reject(err),
          });
          client.requestAccessToken();
        } catch (e) {
          reject(e);
        }
      });
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Disconnects the active Google Drive session
 */
export const disconnectGoogleDrive = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out error:', e);
  }
  cachedAccessToken = null;
  cachedUserEmail = null;
  cachedFirmFolderId = null;
};

/**
 * Ensures or creates a dedicated directory inside the firm's Google Drive.
 */
export const getOrCreateFirmFolder = async (token?: string): Promise<string | null> => {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return null;
  if (cachedFirmFolderId) return cachedFirmFolderId;

  try {
    // 1. Search if the folder already exists in Drive
    const query = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${FIRM_DRIVE_FOLDER_NAME}' and trashed=false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        cachedFirmFolderId = data.files[0].id;
        return cachedFirmFolderId;
      }
    }

    // 2. Folder does not exist, create it
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FIRM_DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Elite Jurist Legal Documents & Case Attachments',
      }),
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      cachedFirmFolderId = folderData.id;
      return cachedFirmFolderId;
    }
  } catch (err) {
    console.warn('Folder creation warning:', err);
  }

  return null;
};

/**
 * Directly uploads a legal case file/attachment into the firm's Google Drive
 * via the multipart upload endpoint, generating direct view and download links.
 */
export const uploadCaseFileToGoogleDrive = async (
  file: File,
  caseInfo?: { caseNumber?: string; clientName?: string }
): Promise<{
  fileId: string;
  fileName: string;
  fileSizeFormatted: string;
  mimeType: string;
  driveViewUrl: string;
  driveDownloadUrl: string;
}> => {
  // Ensure we have a valid token
  let token = cachedAccessToken;
  if (!token) {
    const conn = await connectGoogleDrive();
    token = conn.accessToken;
  }

  // Ensure firm case folder exists
  const folderId = await getOrCreateFirmFolder(token);

  // File metadata for Drive
  const metadata: Record<string, any> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    description: caseInfo
      ? `Case: ${caseInfo.caseNumber || 'N/A'} - Client: ${caseInfo.clientName || 'N/A'}`
      : 'Elite Jurist Legal Case Document',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  // Construct standard multipart upload body
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;
  const mediaHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const uint8Array = new Uint8Array(
    new TextEncoder().encode(metadataPart + mediaHeader).length +
      fileArrayBuffer.byteLength +
      new TextEncoder().encode(closeDelimiter).length
  );

  let offset = 0;
  const p1 = new TextEncoder().encode(metadataPart + mediaHeader);
  uint8Array.set(p1, offset);
  offset += p1.length;

  uint8Array.set(new Uint8Array(fileArrayBuffer), offset);
  offset += fileArrayBuffer.byteLength;

  const p3 = new TextEncoder().encode(closeDelimiter);
  uint8Array.set(p3, offset);

  // Send multipart upload request to Google Drive API
  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: uint8Array,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Google Drive Upload Failed:', errorText);
    throw new Error(`فشل رفع الملف إلى Google Drive: ${uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;

  // Make file readable with link so case attachments can be opened by authorized team
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Could not set public reader permission:', permErr);
  }

  // Format file size
  const sizeBytes = Number(uploadResult.size || file.size);
  const sizeFormatted =
    sizeBytes > 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;

  const driveViewUrl =
    uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const driveDownloadUrl =
    uploadResult.webContentLink ||
    `https://drive.google.com/uc?export=download&id=${fileId}`;

  return {
    fileId,
    fileName: uploadResult.name || file.name,
    fileSizeFormatted: sizeFormatted,
    mimeType: uploadResult.mimeType || file.type || 'application/pdf',
    driveViewUrl,
    driveDownloadUrl,
  };
};

/**
 * Permanently removes a file from Google Drive (Mandatory user confirmation required)
 */
export const deleteFileFromGoogleDrive = async (fileId: string): Promise<boolean> => {
  const token = cachedAccessToken;
  if (!token || !fileId) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete file from Google Drive:', err);
    return false;
  }
};
