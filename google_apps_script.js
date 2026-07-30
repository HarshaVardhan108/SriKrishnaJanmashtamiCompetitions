/**
 * ==============================================================================
 * ISKCON TIRUPATI - SRI KRISHNA JANMASHTAMI SHYAMA 2026
 * FINAL PRODUCTION GOOGLE APPS SCRIPT BACKEND
 * ==============================================================================
 * 
 * STEP-BY-STEP SETUP INSTRUCTIONS:
 * ------------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.google.com) and create a NEW blank spreadsheet.
 * 2. Title your spreadsheet: "ISKCON Tirupati Registration 2026".
 * 3. In Row 1 of your Sheet, set the following column headers:
 *    A1: Timestamp
 *    B1: Event Name
 *    C1: Student Name
 *    D1: School Name
 *    E1: Class / Level
 *    F1: Section
 *    G1: Phone Number
 *    H1: Registration Fee
 *    I1: Screenshot Drive Link
 *    J1: Status
 * 
 * 4. Click top menu: Extensions -> Apps Script.
 * 5. Delete any code in the editor and PASTE THIS ENTIRE FILE CODE.
 * 6. (Optional) If you want screenshots saved in a specific Google Drive Folder:
 *    - Open Google Drive -> Create a folder named "Janmashtami_Screenshots".
 *    - Open the folder, copy the ID from the URL (the text after /folders/...).
 *    - Paste it in DRIVE_FOLDER_ID variable below inside quotes.
 * 
 * 7. DEPLOY AS WEB APP:
 *    - Click top right "Deploy" -> "New deployment".
 *    - Click gear icon next to "Select type" -> Choose "Web app".
 *    - Description: "ISKCON Tirupati Registration API"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (CRITICAL: Must select 'Anyone' so form submits work!)
 *    - Click "Deploy".
 *    - Click "Authorize access", choose your Google account, click "Advanced", then "Go to project (unsafe)", and click "Allow".
 * 
 * 8. COPY THE WEB APP URL:
 *    - Copy the generated Web App URL (ends with /exec).
 *    - Set this Web App URL in your script.js file or enter it when prompted!
 * ==============================================================================
 */

// OPTIONAL: Specify Google Drive Folder ID to save screenshot files.
// Leave as "" to save in root Drive, or paste your Folder ID: e.g. "1A2B3C4D5E6F..."
var DRIVE_FOLDER_ID = "https://drive.google.com/drive/folders/1nSjC3zqlw2Da8d8CyELwOpGpobxGzWfB"; 

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for lock to avoid concurrency issues
  lock.tryLock(10000);
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        "result": "error",
        "message": "No data received in post body"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Save image to Google Drive if screenshot is provided as Base64 Data URL
    var screenshotUrl = "No Screenshot Attached";
    
    if (data.screenshotBase64 && data.screenshotBase64.indexOf("data:image") !== -1) {
      try {
        var fileData = data.screenshotBase64.split(",");
        var contentType = fileData[0].match(/:(.*?);/)[1];
        var base64Data = fileData[1];
        
        var fileName = "ISKCON_Payment_" + (data.phone || "screenshot") + "_" + Date.now() + ".jpg";
        var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
        
        var folder;
        if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim() !== "") {
          folder = DriveApp.getFolderById(DRIVE_FOLDER_ID.trim());
        } else {
          // Default to creating or retrieving a dedicated Drive folder
          var folderName = "ISKCON_Janmashtami_Payment_Screenshots";
          var folders = DriveApp.getFoldersByName(folderName);
          if (folders.hasNext()) {
            folder = folders.next();
          } else {
            folder = DriveApp.createFolder(folderName);
          }
        }
        
        // Save file & set sharing permission so organizers can view link
        var file = folder.createFile(decodedBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        screenshotUrl = file.getUrl();
      } catch (imgError) {
        screenshotUrl = "Error saving screenshot: " + imgError.toString();
      }
    }
    
    // Format timestamp in IST time zone
    var formattedDate = data.timestamp || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");
    
    // Append submission row to Google Sheet
    sheet.appendRow([
      formattedDate,
      data.event || "ISKCON Tirupati Sri Krishna Janmashtami SHYAMA 2026",
      data.fullName || "",
      data.schoolName || "",
      data.className || "",
      data.section || "",
      "'" + (data.phone || ""), // Format phone number as string to preserve leading zero
      "Rs. " + (data.fee || "100"),
      screenshotUrl,
      "Confirmed & Received"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      "result": "success",
      "message": "Hare Krishna! Payment screenshot & registration logged successfully.",
      "screenshotUrl": screenshotUrl
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "message": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("ISKCON Tirupati Sri Krishna Janmashtami SHYAMA 2026 - Registration Web App Service is Active & Online!");
}
