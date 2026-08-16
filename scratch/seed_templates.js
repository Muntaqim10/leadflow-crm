require('dotenv').config({ path: '.env.local' });
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const mockTemplates = [
  { id: 'tpl-1', template_type: 'thank_you', content: 'Dear {{client_name}},\n\nThank you for choosing Leadflow for your upcoming event! We are absolutely thrilled at the prospect of hosting {{company_name}} and ensuring your stay beginning on {{check_in_date}} is nothing short of exceptional.\n\nOur team is currently reviewing your details. In the meantime, please feel free to reach out if you have any immediate questions.\n\nWarm regards,\n{{user_name}}' },
  { id: 'tpl-2', template_type: 'follow_up_reminder', content: 'Dear {{client_name}},\n\nI hope you are having a wonderful week.\n\nI am following up on the proposal we sent over for your event on {{check_in_date}}. We would love to finalize your arrangements and secure your preferred dates in {{event_room}}.\n\nPlease let me know if you have any questions or if you would like to review the details together.\n\nBest regards,\n{{user_name}}' },
  { id: 'tpl-3', template_type: 'gentle_reminder', content: 'Dear {{client_name}},\n\nThis is a gentle reminder regarding the pending contract for your event on {{check_in_date}}.\n\nTo ensure we can accommodate all your needs, please review and sign the contract at your earliest convenience. Let us know if any adjustments are needed!\n\nWe look forward to hosting you soon.\n\nWarm regards,\n{{user_name}}' },
  { id: 'tpl-4', template_type: 'booking_confirmation', content: 'Dear {{client_name}},\n\nWe are thrilled to officially confirm your booking at Leadflow for {{check_in_date}} to {{check_out_date}}!\n\nAttached is your official confirmation. We can\'t wait to deliver an unforgettable experience for you and your guests.\n\nBest,\n{{user_name}}' },
  { id: 'tpl-5', template_type: 'feedback_request', content: 'Dear {{client_name}},\n\nThank you for considering Leadflow. We are always striving to improve our guest experience, and we would deeply appreciate any feedback on how we can better serve your event needs in the future.\n\nThank you for your time,\n{{user_name}}' }
];

async function seed() {
  console.log('Pushing new templates to Supabase...');
  for (const tpl of mockTemplates) {
    const { error } = await supabase.from('email_templates').upsert(tpl, { onConflict: 'template_type' });
    if (error) {
      console.error(`Error saving ${tpl.template_type}:`, error.message);
    } else {
      console.log(`Successfully saved ${tpl.template_type}`);
    }
  }
  console.log('Done!');
}

seed();
