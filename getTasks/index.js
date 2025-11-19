const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');

// Environment variables
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'citylifestyle.com';
const CIRCLE_DOMAIN = process.env.CIRCLE_DOMAIN || 'https://citylifestyle.circle.so';

/**
 * Google Cloud Function: getTasks
 * Retrieves tasks from Google Tasks API using service account with domain-wide delegation
 *
 * Expected request body:
 * {
 *   "userEmail": "user@citylifestyle.com",
 *   "userName": "John Smith",  // Optional - searches for "Onboarding: {userName}" list
 *   "taskListId": "optional-task-list-id"  // Optional - specific list ID
 * }
 */
functions.http('getTasks', async (req, res) => {
  // Set CORS headers - restrict to Circle.so domain
  res.set('Access-Control-Allow-Origin', CIRCLE_DOMAIN);
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    const { userEmail, taskListId, userName } = req.body;

    if (!userEmail) {
      res.status(400).json({ error: 'userEmail is required' });
      return;
    }

    // Validate domain - only allow authorized emails
    if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      res.status(403).json({ error: `Access denied. Only @${ALLOWED_DOMAIN} emails are allowed.` });
      return;
    }

    // Authenticate using service account with domain-wide delegation
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/tasks.readonly'],
      clientOptions: {
        subject: userEmail // Impersonate the user
      }
    });

    const authClient = await auth.getClient();
    const tasks = google.tasks({ version: 'v1', auth: authClient });

    // Get the task list ID
    let listId = taskListId;
    if (!listId) {
      const taskLists = await tasks.tasklists.list();
      const allLists = taskLists.data.items || [];

      // If userName provided, search for "Onboarding: {userName}" list
      if (userName) {
        const onboardingListName = `Onboarding: ${userName}`;
        const onboardingList = allLists.find(list => list.title === onboardingListName);

        if (onboardingList) {
          console.log(`Found onboarding list: "${onboardingListName}"`);
          listId = onboardingList.id;
        } else {
          console.log(`Onboarding list "${onboardingListName}" not found, using default`);
          listId = allLists[0]?.id;
        }
      } else {
        // No userName provided, use default first list
        listId = allLists[0]?.id;
      }
    }

    if (!listId) {
      res.status(404).json({ error: 'No task lists found' });
      return;
    }

    // Retrieve tasks
    const response = await tasks.tasks.list({
      tasklist: listId,
      showCompleted: true,
      showHidden: true
    });

    res.status(200).json({
      success: true,
      taskListId: listId,
      tasks: response.data.items || []
    });

  } catch (error) {
    console.error('Error retrieving tasks:', error);
    res.status(500).json({
      error: 'Failed to retrieve tasks',
      message: error.message
    });
  }
});
