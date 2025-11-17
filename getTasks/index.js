const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');

/**
 * Google Cloud Function: getTasks
 * Retrieves tasks from Google Tasks API using service account with domain-wide delegation
 *
 * Expected request body:
 * {
 *   "userEmail": "user@citylifestyle.com",
 *   "taskListId": "optional-task-list-id"
 * }
 */
functions.http('getTasks', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
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

    const { userEmail, taskListId } = req.body;

    if (!userEmail) {
      res.status(400).json({ error: 'userEmail is required' });
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

    // Get the task list ID (use default if not provided)
    let listId = taskListId;
    if (!listId) {
      const taskLists = await tasks.tasklists.list();
      listId = taskLists.data.items[0]?.id;
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
