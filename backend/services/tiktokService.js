// TikTok Service - Business Logic
import { query, queryOne } from "../db.js";

class TikTokService {
  // Process incoming webhook from TikTok
  async processWebhook(data) {
    const { event, userId, username, content, videoId, videoTitle } = data;
    
    switch (event) {
      case "comment":
        return this.handleNewComment(userId, username, content, videoId, videoTitle);
      case "message":
        return this.handleNewMessage(userId, username, content);
      case "follow":
        return this.handleNewFollower(userId, username);
      default:
        console.log(`Unknown TikTok event: ${event}`);
    }
  }

  // Handle new comment
  async handleNewComment(userId, username, content, videoId, videoTitle) {
    // Check if auto-reply is enabled for TikTok platform
    const settings = await this.getPlatformSettings("tiktok");
    
    if (settings.notifyComment) {
      // Save comment to database
      await query(
        `INSERT INTO tiktok_comments (comment_id, user_id, username, content, video_id, video_title, status)
         VALUES (?, ?, ?, ?, ?, ?, 'new')
         ON DUPLICATE KEY UPDATE content = VALUES(content)`,
        [`c_${Date.now()}`, userId, username, content, videoId, videoTitle]
      );
      
      // Check for auto-reply rules
      if (settings.autoReply) {
        const matchingRule = await this.findMatchingRule(content);
        if (matchingRule) {
          // Auto-reply would be triggered here
          console.log(`Auto-reply matched for keyword: ${matchingRule.keyword}`);
        }
      }
    }
    
    return { success: true, event: "comment_processed" };
  }

  // Handle new DM
  async handleNewMessage(userId, username, content) {
    await query(
      `INSERT INTO tiktok_messages (user_id, username, message, direction)
       VALUES (?, ?, ?, 'inbound')`,
      [userId, username, content]
    );
    
    // Check for auto-reply
    const settings = await this.getPlatformSettings("tiktok");
    if (settings.autoReply) {
      const matchingRule = await this.findMatchingRule(content);
      if (matchingRule) {
        // Auto-reply logic would go here
        return {
          success: true,
          event: "message_processed",
          autoReply: matchingRule.reply
        };
      }
    }
    
    return { success: true, event: "message_processed" };
  }

  // Handle new follower
  async handleNewFollower(userId, username) {
    // Create lead from new follower
    await query(
      `INSERT INTO tiktok_leads (user_id, username, source, platform, status)
       VALUES (?, ?, 'tiktok', 'tiktok', 'new')
       ON DUPLICATE KEY UPDATE username = VALUES(username)`,
      [userId, username]
    );
    
    return { success: true, event: "follower_registered" };
  }

  // Find matching auto-reply rule
  async findMatchingRule(content) {
    const rules = await query(
      "SELECT * FROM tiktok_rules WHERE is_active = 1 ORDER BY priority DESC"
    );
    
    for (const rule of rules) {
      const contentLower = content.toLowerCase();
      const keywordLower = rule.keyword.toLowerCase();
      
      switch (rule.match_type) {
        case "exact":
          if (contentLower === keywordLower) return rule;
          break;
        case "starts_with":
          if (contentLower.startsWith(keywordLower)) return rule;
          break;
        case "contains":
        default:
          if (contentLower.includes(keywordLower)) return rule;
          break;
      }
    }
    
    return null;
  }

  // Get platform settings from database
  async getPlatformSettings(platform) {
    const settings = await query(
      "SELECT settings_key, settings_value FROM platform_settings WHERE platform = ?",
      [platform]
    );
    
    const result = {};
    settings.forEach((row) => {
      let value = row.settings_value;
      if (value === "true") value = true;
      else if (value === "false") value = false;
      result[row.settings_key] = value;
    });
    
    // Add defaults
    return {
      enabled: true,
      autoReply: false,
      notifyComment: true,
      autoLike: false,
      ...result
    };
  }

  // Get dashboard stats
  async getDashboardStats(userId) {
    const whereClause = userId ? "WHERE user_id = ?" : "";
    const params = userId ? [userId] : [];
    
    const [comments] = await query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_comments,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_comments
      FROM tiktok_comments ${whereClause}
    `, params);
    
    const [messages] = await query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as sent
      FROM tiktok_messages ${whereClause}
    `, params);
    
    const [leads] = await query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
      FROM tiktok_leads ${whereClause}
    `, params);
    
    return {
      comments: comments[0] || { total: 0, new_comments: 0, replied_comments: 0 },
      messages: messages[0] || { total: 0, received: 0, sent: 0 },
      leads: leads[0] || { total: 0, new_leads: 0, converted: 0 }
    };
  }

  // Reply to comment
  async replyToComment(commentId, message, userId) {
    // Update comment status
    await query(
      "UPDATE tiktok_comments SET status = 'replied', replied_at = NOW(), replied_by = ? WHERE id = ?",
      [userId, commentId]
    );
    
    // Save reply
    await query(
      "INSERT INTO tiktok_comment_replies (comment_id, message, created_by) VALUES (?, ?, ?)",
      [commentId, message, userId]
    );
    
    return { success: true };
  }

  // Send DM to user
  async sendMessage(userId, message, senderId) {
    // Save to database
    await query(
      "INSERT INTO tiktok_messages (user_id, message, direction, sent_by) VALUES (?, ?, 'outbound', ?)",
      [userId, message, senderId]
    );
    
    return { success: true };
  }

  // Convert lead
  async convertLead(leadId, notes) {
    await query(
      "UPDATE tiktok_leads SET status = 'converted', notes = ? WHERE id = ?",
      [notes, leadId]
    );
    
    return { success: true };
  }

  // Assign lead to user
  async assignLead(leadId, assignedTo) {
    await query(
      "UPDATE tiktok_leads SET assigned_to = ?, status = 'contacted' WHERE id = ?",
      [assignedTo, leadId]
    );
    
    return { success: true };
  }
}

export const tiktokService = new TikTokService();
export default tiktokService;
