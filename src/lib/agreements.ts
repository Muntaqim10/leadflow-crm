import { Lead } from '@/types/crm';
import { parseRoomDetails } from './calculations';

interface AgreementOptions {
  hotelName?: string;
  hotelPhone?: string;
  hotelAddress?: string;
  roomTaxRate?: string;
  eventTaxRate?: string;
  eventGratuityRate?: string;
}

export const generateAgreementHtml = (lead: Lead, options: AgreementOptions = {}): string => {
  const {
    hotelName = 'Hotel Flow Grand',
    roomTaxRate = '15.0',
    eventTaxRate = '6.0',
    eventGratuityRate = '20.0'
  } = options;

  const parsed = parseRoomDetails(lead.rooms_or_event_details);

  let nights = 1;
  if (lead.check_in_date && lead.check_out_date) {
    const start = new Date(lead.check_in_date);
    const end = new Date(lead.check_out_date);
    const diff = Math.abs(end.getTime() - start.getTime());
    nights = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  }

  // 1. Guest Rooms subtotal
  let guestRoomsHtml = '';
  let totalRoomsRev = 0;
  if (parsed.guestRooms && parsed.guestRooms.length > 0) {
    parsed.guestRooms.forEach((r: any) => {
      const count = parseInt(r.count) || 0;
      const rate = parseFloat(r.rate) || 0;
      const sub = count * rate * nights;
      totalRoomsRev += sub;
      guestRoomsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">🛏️ ${r.type}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; text-align: center;">${count}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; text-align: right;">$${rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${sub.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    });
  } else {
    guestRoomsHtml = `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #64748B;">No dedicated guest room block attached.</td></tr>`;
  }

  // 2. Event Rental subtotal
  let eventHtml = '';
  let eventRate = 0;
  if (parsed.eventRoom) {
    eventRate = parseFloat(parsed.eventRoomRate) || 0;
    eventHtml = `
      <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px;">2. EVENT SPACE & FUNCTION SETUP</h3>
      <p style="font-size: 13px; margin-bottom: 10px;">The following meeting / function space is reserved for the Group's exclusive use:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
            <th style="padding: 10px; font-weight: bold;">Function Space / Room</th>
            <th style="padding: 10px; font-weight: bold;">Function Setup Details</th>
            <th style="padding: 10px; font-weight: bold; text-align: right;">Rental Charge</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">📍 ${parsed.eventRoom}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${parsed.eventDetails || 'Meeting / Setup Details'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${eventRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // 3. Accessories subtotal
  let accessoriesHtml = '';
  let totalAccessories = 0;
  if (parsed.accessories && parsed.accessories.length > 0) {
    let rows = '';
    parsed.accessories.forEach((a: any) => {
      const price = parseFloat(a.price) || 0;
      totalAccessories += price;
      rows += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">✨ ${a.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    });
    accessoriesHtml = `
      <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px;">3. ACCESSORIES & SERVICE CHARGES</h3>
      <p style="font-size: 13px; margin-bottom: 10px;">The following catering, AV, or support packages are added to the Group order:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
            <th style="padding: 10px; font-weight: bold;">Service / Equipment Name</th>
            <th style="padding: 10px; font-weight: bold; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  const roomTaxPct = parseFloat(roomTaxRate) || 15;
  const eventTaxPct = parseFloat(eventTaxRate) || 6;
  const eventGratuityPct = parseFloat(eventGratuityRate) || 20;

  const guestRoomsTax = totalRoomsRev * (roomTaxPct / 100);
  const eventTax = eventRate * (eventTaxPct / 100);
  const eventGratuity = eventRate * (eventGratuityPct / 100);
  const grandTotal = totalRoomsRev + guestRoomsTax + eventRate + eventTax + eventGratuity + totalAccessories;

  return `
    <div style="font-family: 'Inter', sans-serif; color: #1E293B; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E3A8A; margin: 0; font-size: 24px;">${hotelName.toUpperCase()}</h1>
        <p style="color: #64748B; margin: 5px 0 0 0; font-size: 14px;">Group Rooms & Event Agreement</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px;">
        <div>
          <strong style="color: #0F172A; display: block; margin-bottom: 5px;">ORGANIZATION / GROUP DETAILS:</strong>
          <strong>Group Name:</strong> ${lead.name_company}<br>
          <strong>Contact Email:</strong> ${lead.email}<br>
          <strong>Contact Phone:</strong> ${lead.phone || 'N/A'}<br>
        </div>
        <div style="text-align: right;">
          <strong style="color: #0F172A; display: block; margin-bottom: 5px;">AGREEMENT DETAILS:</strong>
          <strong>Check-In Date:</strong> ${lead.check_in_date}<br>
          <strong>Check-Out Date:</strong> ${lead.check_out_date}<br>
          <strong>Stay Length:</strong> ${nights} Nights<br>
        </div>
      </div>

      <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 30px;">1. ROOM BLOCK & REVENUE TERMS</h3>
      <p style="font-size: 13px;">The Hotel agrees to block the following guest rooms for the Group during the Stay Dates:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
            <th style="padding: 10px; font-weight: bold;">Room Type</th>
            <th style="padding: 10px; font-weight: bold;">Daily Rooms</th>
            <th style="padding: 10px; font-weight: bold;">Agreed Daily Rate</th>
            <th style="padding: 10px; font-weight: bold;">Est. Total Room Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${guestRoomsHtml}
        </tbody>
      </table>

      ${eventHtml}

      ${accessoriesHtml}

      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 8px; margin-top: 30px; page-break-inside: avoid; break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; line-height: 1.8;">
          <tr>
            <td style="color: #475569;">Guest Rooms Subtotal:</td>
            <td style="text-align: right; font-weight: bold; color: #1E293B;">$${totalRoomsRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Guest Room Occupancy Taxes (${roomTaxPct}%):</td>
            <td style="text-align: right; font-weight: bold; color: #E11D48;">$${guestRoomsTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          ${parsed.eventRoom ? `
          <tr>
            <td style="color: #475569;">Event Space Rental:</td>
            <td style="text-align: right; font-weight: bold; color: #1E293B;">$${eventRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Event Space Tax (${eventTaxPct}%):</td>
            <td style="text-align: right; font-weight: bold; color: #E11D48;">$${eventTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="color: #475569;">Event Space Gratuity & Service Charge (${eventGratuityPct}%):</td>
            <td style="text-align: right; font-weight: bold; color: #E11D48;">$${eventGratuity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>` : ''}
          ${parsed.accessories && parsed.accessories.length > 0 ? `
          <tr>
            <td style="color: #475569;">Accessories & Services:</td>
            <td style="text-align: right; font-weight: bold; color: #1E293B;">$${totalAccessories.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>` : ''}
          <tr style="border-top: 2px solid #E2E8F0;">
            <td style="padding-top: 10px; font-size: 14px; font-weight: bold; color: #1E3A8A;">ESTIMATED TOTAL CONTRACT VALUE:</td>
            <td style="padding-top: 10px; text-align: right; font-size: 18px; font-weight: 900; color: #10B981;">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>

      <div style="page-break-before: always; break-before: page; margin-top: 35px;">
        <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">4. CANCELLATION & ATTRITION POLICY</h3>
        <p style="font-size: 12px; color: #475569; text-align: justify; margin-bottom: 15px;">
          The Group agrees that damages in the event of cancellation are difficult to calculate accurately. Therefore, if the Group cancels this Agreement for any reason, the Group agrees to pay liquidated damages equal to 100% of the Estimated Total Contract Value if cancelled within 30 days of arrival, or 50% if cancelled between 31 and 90 days of arrival.
        </p>

        <h3 style="color: #1E3A8A; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 25px;">5. SIGNATURE & ACCEPTANCE</h3>
        <p style="font-size: 12px; color: #475569; margin-bottom: 25px;">
          By signing below, the authorized representative accepts all terms, conditions, rates, room commitments, and cancellation policies stated in this Agreement.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; font-size: 13px;">
          <div>
            <div style="border-bottom: 1px solid #000; height: 35px; margin-bottom: 8px;"></div>
            <strong>Authorized Client Representative</strong><br>
            <span style="color: #64748B; font-size: 11px;">Print Name & Date</span>
          </div>
          <div>
            <div style="border-bottom: 1px solid #000; height: 35px; margin-bottom: 8px;"></div>
            <strong>Leadflow Sales Representative</strong><br>
            <span style="color: #64748B; font-size: 11px;">Hotel Sales & Events Management</span>
          </div>
        </div>
      </div>
    </div>
  `;
};
