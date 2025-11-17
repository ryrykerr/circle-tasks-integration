const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');

/**
 * Google Cloud Function: completeTask
 * Marks a task as complete in Google Tasks API using service account with domain-wide delegation
 *
 * Expected request body:
 * {
 *   "userEmail": "user@citylifestyle.com",
 *   "taskListId": "task-list-id",
 *   "taskId": "task-id"
 * }
 */
functions.http('completeTask', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
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

    // Get the current task
    const task = await tasks.tasks.get({
      tasklist: taskListId,
      task: taskId
    });

    // Mark as completed
    const updatedTask = await tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        id: taskId,
        status: 'completed'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Task marked as complete',
      task: updatedTask.data
    });

  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      error: 'Failed to complete task',
      message: error.message
    });
  }
});
