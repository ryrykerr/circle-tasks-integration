const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');

/**
 * Google Cloud Function: uncompleteTask
 * Marks a task as incomplete in Google Tasks API using service account with domain-wide delegation
 *
 * Expected request body:
 * {
 *   "userEmail": "user@citylifestyle.com",
 *   "taskListId": "task-list-id",
 *   "taskId": "task-id"
 * }
 */
functions.http('uncompleteTask', async (req, res) => {
  // Set CORS headers - restrict to Circle.so domain
  res.set('Access-Control-Allow-Origin', 'https://citylifestyle.circle.so');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

    const { userEmail, taskListId, taskId } = req.body;

    if (!userEmail || !taskListId || !taskId) {
      res.status(400).json({
        error: 'userEmail, taskListId, and taskId are required'
      });
      return;
    }

    // Validate domain - only allow citylifestyle.com emails
    if (!userEmail.endsWith('@citylifestyle.com')) {
      res.status(403).json({ error: 'Access denied. Only @citylifestyle.com emails are allowed.' });
      return;
    }

    // Authenticate using service account with domain-wide delegation
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/tasks'],
      clientOptions: {
        subject: userEmail // Impersonate the user
      }
    });

    const authClient = await auth.getClient();
    const tasks = google.tasks({ version: 'v1', auth: authClient });

    // Mark as incomplete (needsAction)
    const updatedTask = await tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        id: taskId,
        status: 'needsAction',
        completed: null // Remove completion timestamp
      }
    });

    res.status(200).json({
      success: true,
      message: 'Task marked as incomplete',
      task: updatedTask.data
    });

  } catch (error) {
    console.error('Error uncompleting task:', error);
    res.status(500).json({
      error: 'Failed to uncomplete task',
      message: error.message
    });
  }
});
