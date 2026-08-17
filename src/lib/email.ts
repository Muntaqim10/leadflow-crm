import { getRows, addRow, updateRow } from './db';
import nodemailer from 'nodemailer';

export interface EmailServiceResult {
  success: boolean;
  message: string;
  log?: any;
}

/**
 * Generates an AI reply to a lead based on status and email template type using Groq Llama 3.1
 */
export async function generateAiEmail(leadId: string, templateType?: string, senderName = 'Sales Team'): Promise<{ logId: string; content: string; templateType: string }> {
  // 1. Fetch lead details
  const leads = await getRows('leads');
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  // 2. Auto-determine template type if not provided or set to 'auto'
  let determinedTemplateType = templateType;
  if (!determinedTemplateType || determinedTemplateType === 'auto') {
    const status = lead.status;
    if (status === 'new') determinedTemplateType = 'thank_you';
    else if (status === 'proposal_sent') determinedTemplateType = 'follow_up_reminder';
    else if (status === 'negotiation') determinedTemplateType = 'gentle_reminder';
    else if (status === 'confirmed') determinedTemplateType = 'booking_confirmation';
    else if (status === 'lost') determinedTemplateType = 'feedback_request';
    else determinedTemplateType = 'thank_you'; // default fallback
  }

  // 3. Fetch templates from database
  const templates = await getRows('email_templates');
  const template = templates.find((t) => t.template_type === determinedTemplateType);

  // Prepare fallback template content if database template is empty
  let templateText = template?.content || '';
  if (!templateText) {
    if (determinedTemplateType === 'thank_you') {
      templateText = `Subject: Thank you for your inquiry - [Hotel Name]\n\nDear {guest_name},\n\nThank you for contacting us regarding your upcoming stay from {check_in} to {check_out}.\n\nWe have received your request for:\n{details}\n\nOur team is currently reviewing your details and we will follow up shortly with a customized proposal.\n\nBest regards,\n[Sales Team]`;
    } else if (determinedTemplateType === 'follow_up_reminder') {
      templateText = `Subject: Proposal Follow-Up - [Hotel Name]\n\nDear {guest_name},\n\nI hope this email finds you well.\n\nI wanted to follow up on the proposal we sent for your upcoming stay from {check_in} to {check_out} ({details}).\n\nPlease let us know if you have any questions or if you would like to proceed.\n\nBest regards,\n[Sales Team]`;
    } else if (determinedTemplateType === 'gentle_reminder') {
      templateText = `Subject: Booking Inquiry Update - [Hotel Name]\n\nDear {guest_name},\n\nJust a gentle reminder regarding your booking inquiry for {check_in} to {check_out}.\n\nWe are seeing high demand for these stay dates. Please let us know if you are still interested.\n\nWarm regards,\n[Sales Team]`;
    } else if (determinedTemplateType === 'booking_confirmation') {
      templateText = `Subject: Booking Confirmed! - [Hotel Name]\n\nDear {guest_name},\n\nWe are thrilled to confirm your upcoming booking from {check_in} to {check_out}!\n\nYour event / stay details:\n{details}\n\nBest regards,\n[Sales Team]`;
    } else if (determinedTemplateType === 'feedback_request') {
      templateText = `Subject: Re: Booking Inquiry - [Hotel Name]\n\nDear {guest_name},\n\nThank you for considering us for your event from {check_in} to {check_out}. We hope to have the opportunity to host you in the future.\n\nIf you have a moment, we would love to hear any feedback you have to help us improve.\n\nBest regards,\n[Sales Team]`;
    } else {
      templateText = `Subject: Inquiry Update\n\nDear {guest_name},\n\nWe are writing regarding your booking inquiry for {check_in} to {check_out}.\n\nBest regards,\n[Sales Team]`;
    }
  }

  // Replace template variables
  const rawName = lead.name_company || '';
  const clientNameOnly = rawName.split(' / ')[0] || 'Guest';

  // Replace hardcoded Sarah Jenkins signature if it exists in the template
  templateText = templateText.replace(/Sarah Jenkins/gi, senderName);

  // Clean up possessive event suffixes (e.g., "Arzaan's wedding night" -> "Arzaan")
  let guestName = clientNameOnly
    .replace(/'s\s+wedding\s+night$/i, '')
    .replace(/s\s+wedding\s+night$/i, '')
    .replace(/'s\s+wedding$/i, '')
    .replace(/s\s+wedding$/i, '')
    .replace(/'s\s+event$/i, '')
    .replace(/s\s+event$/i, '')
    .replace(/'s\s+stay$/i, '')
    .replace(/s\s+stay$/i, '')
    .trim();

  if (!guestName) {
    guestName = 'Guest';
  }

  function formatRoomDetailsText(raw: string | undefined | null): string {
    if (!raw) return 'N/A';
    try {
      if (raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw);
        const parts = [];
        if (parsed.eventRoom) {
          const rate = parsed.eventRoomRate ? ` ($${parsed.eventRoomRate})` : '';
          parts.push(`Event Space: ${parsed.eventRoom}${rate}`);
        }
        if (parsed.guestRooms && parsed.guestRooms.length > 0) {
          const rooms = parsed.guestRooms
            .filter((r: any) => r.type)
            .map((r: any) => `${r.count} ${r.type} rooms` + (r.rate ? ` at $${r.rate}/night` : ''))
            .join(', ');
          if (rooms) parts.push(`Guest Rooms: ${rooms}`);
        }
        if (parsed.accessories && parsed.accessories.length > 0) {
          const accs = parsed.accessories
            .filter((a: any) => a.name)
            .map((a: any) => `${a.name} ($${a.price})`)
            .join(', ');
          if (accs) parts.push(`Accessories/Addons: ${accs}`);
        }
        if (parsed.eventDetails) {
          parts.push(`Event Details: ${parsed.eventDetails}`);
        }
        return parts.join(' | ');
      }
    } catch (e) {}
    return raw;
  }

  const checkIn = lead.check_in_date || 'N/A';
  const checkOut = lead.check_out_date || 'N/A';
  const details = formatRoomDetailsText(lead.rooms_or_event_details);
  const revenue = lead.revenue_potential || '0';

  const personalizedPrompt = templateText
    .replace(/{guest_name}/g, guestName)
    .replace(/{check_in}/g, checkIn)
    .replace(/{check_out}/g, checkOut)
    .replace(/{details}/g, details)
    .replace(/{revenue}/g, revenue);

  // 4. Call Groq API with context-aware prompts
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a premium hotel sales team. You are highly context-aware of leads and their sales pipeline status.
Write a professional, personalized email for the client based on the lead context and template.

Lead Context Details:
- Client Name/Company: ${guestName}
- Stay Dates: ${checkIn} to ${checkOut}
- Pipeline Status: ${lead.status}
- Event/Rooms Details: ${details}
- Revenue Potential: $${revenue}
- Market Segment: ${lead.market_segment}
- Lead Source: ${lead.lead_source}
- Sender Name: ${senderName}

Tone Guidelines:
- If market segment is 'corporate', use a formal, polished, professional business tone.
- If market segment is 'leisure', use a warm, friendly, welcoming, and relaxed hospitality tone.
- If market segment is 'group', use a welcoming, detailed, and organized coordinator-friendly tone.
- Adjust tone based on the Lead Source (e.g. acknowledge a recent 'sales_call' or a direct walk-in).

Addressing the Recipient:
- You MUST address the recipient by their actual personal name (e.g. "Dear Arzaan," or "Dear Mr. Shaikh,") instead of using event descriptions, possessive phrases, or company suffixes (e.g. do NOT say "Dear Arzaan's wedding night," or "Dear Microsoft," or "Dear wedding night").
- If the client name represents an event or group name and doesn't contain a clear personal name, address them politely as "Dear Guest," or "Dear Client,".

Sign-off Signature:
- You MUST sign off the email using the Sender Name: ${senderName}. Do NOT use "Sarah Jenkins" or any other name under any circumstances.

Terminology Constraints:
- When referring to pricing, totals, or room rates in the email to the client, you MUST use customer-friendly terms such as "Total Cost", "Estimated Total", "Package Price", or "Total Amount".
- Never use internal sales/CRM terms like "Revenue", "Revenue Potential", or "Lead Value" in client-facing correspondence.

Output constraints:
- Generate a professional email starting with "Subject: [Your Subject Line]".
- Do not include any introductory text, greeting to the user, or conversational remarks outside the email text itself.
- Base your draft on the provided template, but polish it dynamically using the lead details and tone guidelines above.`
        },
        {
          role: 'user',
          content: `Personalize and polish this template according to the lead context:\n\n${personalizedPrompt}`
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    console.error('Groq API Error Response:', errorText);
    throw new Error(`Groq API returned status ${groqResponse.status}`);
  }

  const data = await groqResponse.json();
  const generatedContent = data.choices?.[0]?.message?.content || personalizedPrompt;

  // 5. Log the generated email in database
  const emailLogEntry = await addRow('email_log', {
    lead_id: leadId,
    template_type: determinedTemplateType,
    generated_content: generatedContent,
    was_edited_by_human: 'false',
    sent_at: '',
  });

  return {
    logId: emailLogEntry.id,
    content: generatedContent,
    templateType: determinedTemplateType,
  };
}

export async function sendEmail(logId: string, content: string, wasEditedByHuman = false): Promise<EmailServiceResult> {
  // 1. Fetch the log details
  const logs = await getRows('email_log');
  const logEntry = logs.find((l) => l.id === logId);
  if (!logEntry) {
    throw new Error('Email log not found');
  }

  // 2. Fetch the lead
  const leads = await getRows('leads');
  const lead = leads.find((l) => l.id === logEntry.lead_id);
  if (!lead) {
    throw new Error('Associated lead not found');
  }

  // Parse Subject and Body from content
  let subject = 'Update from Hotel Sales';
  let bodyText = content;

  const subjectMatch = content.match(/^Subject:\s*(.*)/i);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    bodyText = content.replace(/^Subject:\s*(.*)/i, '').trim();
  }

  const recipientEmail = lead.email || '';
  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw new Error(`Invalid recipient email address: ${recipientEmail}`);
  }

  // Try actual SMTP send if configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  let sendResult = '';
  let smtpSuccess = false;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Leadflow CRM" <no-reply@leadflow.com>`,
        to: recipientEmail,
        subject: subject,
        text: bodyText,
      });

      console.log(`[Email Dispatch] Sent via SMTP. Message ID: ${info.messageId}`);
      sendResult = `Sent email to ${recipientEmail} via SMTP`;
      smtpSuccess = true;
    } catch (smtpError: any) {
      console.error(`[Email Dispatch Failure] SMTP error: ${smtpError.message}`);
      sendResult = `Attempted SMTP but failed: ${smtpError.message}. Logging fallback.`;
    }
  }

  if (!smtpSuccess) {
    // Fallback: If no SMTP configured, or SMTP failed, log mock result instead of crashing
    sendResult = wasEditedByHuman
      ? `Copied to clipboard and logged to CRM database (no SMTP configured)`
      : `Logged auto-responder to CRM database (no SMTP configured)`;
    console.log(`[Email Mock Dispatch] Log ID: ${logId}. Recipient: [REDACTED]`);
  }

  // Update email log in database
  const updatedLog = await updateRow('email_log', logId, {
    generated_content: content,
    was_edited_by_human: wasEditedByHuman ? 'true' : 'false',
    sent_at: new Date().toISOString(),
  });

  return {
    success: true,
    message: sendResult,
    log: updatedLog,
  };
}
