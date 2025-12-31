/**
 * Firebase Rules Setup Helper
 * 
 * Copy and paste the security rules below into your Firebase Console:
 * https://console.firebase.google.com
 * 
 * Steps:
 * 1. Go to your Firebase project
 * 2. Select "Realtime Database" from left menu
 * 3. Click "Rules" tab
 * 4. Copy the rules below
 * 5. Paste into the rules editor
 * 6. Click "Publish"
 */

const FIREBASE_RULES = {
  "rules": {
    "admin": {
      ".read": false,
      ".write": false,
      "cities": {
        ".indexOn": ["type", "createdAt", "registrations"],
        "$cityId": {
          ".read": true,
          ".write": "root.child('auth').child('adminUsers').child(auth.uid).exists()",
          ".validate": "newData.hasChildren(['name', 'lat', 'lng', 'type', 'description'])",
          "name": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
          },
          "lat": {
            ".validate": "newData.isNumber() && newData.val() >= -90 && newData.val() <= 90"
          },
          "lng": {
            ".validate": "newData.isNumber() && newData.val() >= -180 && newData.val() <= 180"
          },
          "type": {
            ".validate": "newData.isString() && (newData.val() === 'meetup' || newData.val() === 'trip')"
          },
          "description": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500"
          },
          "registrations": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          },
          "createdAt": {
            ".validate": "newData.isNumber()"
          },
          "updatedAt": {
            ".validate": "newData.isNumber()"
          },
          "$other": {
            ".validate": false
          }
        }
      },
      "formConfigs": {
        ".indexOn": ["formType", "createdAt", "isActive"],
        "$formId": {
          ".read": true,
          ".write": "root.child('auth').child('adminUsers').child(auth.uid).exists()",
          ".validate": "newData.hasChildren(['name', 'formType', 'fields', 'isActive'])",
          "name": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
          },
          "description": {
            ".validate": "newData.isString() && newData.val().length <= 500"
          },
          "formType": {
            ".validate": "newData.isString() && (newData.val() === 'general' || newData.val() === 'cityMeetup' || newData.val() === 'trip')"
          },
          "fields": {
            ".validate": "newData.isArray() && newData.val().length > 0 && newData.val().length <= 50",
            "$fieldId": {
              ".validate": "newData.hasChildren(['id', 'name', 'type', 'label', 'required', 'order'])",
              "id": {
                ".validate": "newData.isString()"
              },
              "name": {
                ".validate": "newData.isString() && newData.val().length > 0"
              },
              "type": {
                ".validate": "newData.isString() && ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'radio'].indexOf(newData.val()) !== -1"
              },
              "label": {
                ".validate": "newData.isString() && newData.val().length > 0"
              },
              "required": {
                ".validate": "newData.isBoolean()"
              },
              "order": {
                ".validate": "newData.isNumber() && newData.val() >= 0"
              },
              "placeholder": {
                ".validate": "!newData.exists() || newData.isString()"
              },
              "options": {
                ".validate": "!newData.exists() || newData.isArray()"
              },
              "validationPattern": {
                ".validate": "!newData.exists() || newData.isString()"
              },
              "$other": {
                ".validate": false
              }
            }
          },
          "isActive": {
            ".validate": "newData.isBoolean()"
          },
          "createdAt": {
            ".validate": "newData.isNumber()"
          },
          "updatedAt": {
            ".validate": "newData.isNumber()"
          },
          "$other": {
            ".validate": false
          }
        }
      },
      "submissions": {
        ".indexOn": ["formId", "cityId", "submittedAt"],
        "$submissionId": {
          ".read": "root.child('auth').child('adminUsers').child(auth.uid).exists()",
          ".write": "!root.child('admin').child('submissions').child($submissionId).exists()",
          ".validate": "newData.hasChildren(['formId', 'formName', 'submittedData'])",
          "formId": {
            ".validate": "newData.isString()"
          },
          "formName": {
            ".validate": "newData.isString() && newData.val().length > 0"
          },
          "cityId": {
            ".validate": "!newData.exists() || newData.isString()"
          },
          "cityName": {
            ".validate": "!newData.exists() || newData.isString()"
          },
          "submittedData": {
            ".validate": "newData.isObject()"
          },
          "submittedAt": {
            ".validate": "newData.isNumber()"
          },
          "ip": {
            ".validate": "!newData.exists() || newData.isString()"
          },
          "userAgent": {
            ".validate": "!newData.exists() || newData.isString()"
          },
          "$other": {
            ".validate": false
          }
        }
      },
      "auth": {
        ".read": false,
        ".write": false,
        "adminUsers": {
          ".read": false,
          ".write": false,
          "$uid": {
            ".read": "$uid === auth.uid",
            ".write": false
          }
        }
      }
    },
    ".read": false,
    ".write": false
  }
};

/**
 * How to Apply Rules:
 * 
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your Boundless Society project
 * 3. Click "Realtime Database" in the left sidebar
 * 4. Click the "Rules" tab
 * 5. Delete the existing rules
 * 6. Copy and paste the JSON from FIREBASE_RULES.rules above
 * 7. Click "Publish" button
 * 
 * That's it! Your database is now secure.
 */

/**
 * What These Rules Do:
 * 
 * 🏙️ CITIES (/admin/cities)
 *   - Anyone can READ (for displaying on map)
 *   - Only admins can WRITE (add/edit/delete)
 *   - Validates: name, lat, lng, type, description
 *   - Indexed for fast queries
 * 
 * 📋 FORMS (/admin/formConfigs)
 *   - Anyone can READ (for rendering forms)
 *   - Only admins can WRITE (create/edit/delete)
 *   - Validates: form fields, types, and required fields
 *   - Indexed for fast queries
 * 
 * 📝 SUBMISSIONS (/admin/submissions)
 *   - Only admins can READ (view submissions)
 *   - Anyone can CREATE but NOT MODIFY (write-once)
 *   - Validates: formId, formName, submittedData
 *   - Indexed by formId, cityId, and submittedAt
 * 
 * 🔐 AUTH (/admin/auth)
 *   - Protected - for future admin user management
 *   - Currently not used (password auth instead)
 */

/**
 * Testing the Rules:
 * 
 * After applying, test by:
 * 
 * 1. Go to admin panel (/admin)
 * 2. Try to add a city - should work (write access)
 * 3. View the map - cities should show (read access)
 * 4. Submit a form - submission should save
 * 5. Try to modify data in Firebase console - should be denied
 * 
 * If something doesn't work:
 * - Check browser console for errors
 * - Verify rules were published (not just saved)
 * - Check that you're accessing correct database paths
 * - Review the rules in Firebase console
 */

export default FIREBASE_RULES;
