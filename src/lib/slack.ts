interface SlackMessage {
  text?: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export async function sendSlackNotification(
  giverName: string,
  receiverName: string,
  category: string,
  reason: string,
  categoryEmoji: string
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured - skipping Slack notification');
    return false;
  }

  const message: SlackMessage = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🌟 *${giverName}* just sparked *${receiverName}*!`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Category:*\n${categoryEmoji} ${category}`
          },
          {
            type: "mrkdwn",
            text: `*Reason:*\n_"${reason}"_`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✨ _Keep up the amazing work, team!_ ✨`
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.status, response.statusText);
      return false;
    }

    console.log('Slack notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

// Alternative: Using Slack Web API (if you want to use Bot Token instead of webhook)
export async function sendSlackNotificationWithAPI(
  giverName: string,
  receiverName: string,
  category: string,
  reason: string,
  categoryEmoji: string,
  channel: string = '#sparks-notifications'
): Promise<boolean> {
  const botToken = process.env.SLACK_BOT_TOKEN;
  
  if (!botToken) {
    console.warn('SLACK_BOT_TOKEN not configured - falling back to webhook');
    return sendSlackNotification(giverName, receiverName, category, reason, categoryEmoji);
  }

  const message = {
    channel,
    text: `🌟 ${giverName} just sparked ${receiverName}!`, // Fallback text for notifications
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🌟 New Spark Given!"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${giverName}* just recognized *${receiverName}* for their amazing work!`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Category:*\n${categoryEmoji} ${category}`
          },
          {
            type: "mrkdwn",
            text: `*Recognition:*\n"${reason}"`
          }
        ]
      },
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "✨ _Spreading positivity across the YAAS team!_ ✨"
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Failed to send Slack notification via API:', data.error);
      return false;
    }

    console.log('Slack notification sent successfully via API');
    return true;
  } catch (error) {
    console.error('Error sending Slack notification via API:', error);
    return false;
  }
}