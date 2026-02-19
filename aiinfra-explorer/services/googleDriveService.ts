
// This service handles Google Drive API and Picker interactions.
// It requires a valid Client ID and API Key (from process.env.API_KEY).

export class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private isPickerApiLoaded = false;
  private isDriveApiLoaded = false;

  async init(clientId: string) {
    if (typeof window === 'undefined' || !(window as any).google) return;

    return new Promise<void>((resolve) => {
      // Use window.google to avoid TypeScript "Cannot find name 'google'" errors
      const googleObj = (window as any).google;
      this.tokenClient = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
        callback: (response: any) => {
          if (response.error !== undefined) {
            console.error("GIS Error:", response);
            return;
          }
          this.accessToken = response.access_token;
        },
      });

      // Load Picker and Drive APIs using window.gapi
      const gapiObj = (window as any).gapi;
      gapiObj.load('client:picker', async () => {
        await gapiObj.client.load('drive', 'v3');
        this.isDriveApiLoaded = true;
        this.isPickerApiLoaded = true;
        resolve();
      });
    });
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (response: any) => {
          if (response.error) {
            reject(response);
          } else {
            this.accessToken = response.access_token;
            resolve(this.accessToken!);
          }
        };
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  async openFolderPicker(): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token || !this.isPickerApiLoaded) return null;

    return new Promise((resolve) => {
      // Reference google global via window to resolve name error
      const googleObj = (window as any).google;
      const view = new googleObj.picker.DocsView(googleObj.picker.ViewId.FOLDERS)
        .setSelectableMimeTypes('application/vnd.google-apps.folder');

      const picker = new googleObj.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(process.env.API_KEY)
        .setCallback((data: any) => {
          if (data.action === googleObj.picker.Action.PICKED) {
            const folderId = data.docs[0].id;
            resolve(folderId);
          } else if (data.action === googleObj.picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();
      picker.setVisible(true);
    });
  }

  async listFilesInFolder(folderId: string): Promise<any[]> {
    const token = await this.getAccessToken();
    const gapiObj = (window as any).gapi;
    
    try {
      // Access gapi client via window object
      const response = await gapiObj.client.drive.files.list({
        q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/pdf' or mimeType = 'text/plain' or mimeType = 'application/vnd.google-apps.document')`,
        fields: 'files(id, name, mimeType, description)',
      });
      return response.result.files || [];
    } catch (err) {
      console.error("GAPI list error, falling back to fetch:", err);
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,description)&key=${process.env.API_KEY}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      return data.files || [];
    }
  }
}

export const driveService = new GoogleDriveService();
