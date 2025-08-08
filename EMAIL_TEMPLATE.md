# EmailJS Template Configuration

This template should be created in your EmailJS dashboard for sending health records with attachments.

## Template Name
`template_health_records`

## Template Content

```html
Subject: Health Records from {{from_name}} - {{sent_date}}

Dear {{to_name}},

{{from_name}} has shared their health records with you through the Revado Health app.

=== SUMMARY ===
{{summary}}

=== RECORD DETAILS ===
• Patient: {{from_name}}
• Email: {{from_email}}  
• Number of Records: {{record_count}}
• Date Range: {{date_range}}
• Sent: {{sent_date}} at {{sent_time}}

{{#if file_count}}
=== ATTACHED FILES ===
This email includes {{file_count}} file attachment(s):
{{file_list}}

Please find the attached files along with the PDF summary.
{{/if}}

{{#if share_link}}
=== SECURE LINK ===
Access Link: {{share_link}}
Expiration: {{expiration_date}}
{{/if}}

=== SECURITY NOTICE ===
{{security_notice}}

=== INSTRUCTIONS ===
1. Download and save the attached PDF summary
2. Review the attached medical files (if any)
3. Contact the patient if you need additional information
4. Reply to this email to reach the patient directly

Best regards,
Revado Health Team

---
This email was sent on behalf of {{from_name}} ({{from_email}})
Reply directly to this email to contact the patient.
```

## EmailJS Variables

These variables are sent from the app:

- `to_email` - Recipient's email address
- `to_name` - Recipient's name (e.g., "Dr. Smith")
- `from_name` - Patient's name
- `from_email` - Patient's email
- `record_count` - Number of records shared
- `date_range` - Date range of records
- `summary` - AI-generated text summary
- `share_link` - Optional secure link
- `expiration_date` - Link expiration date
- `sent_date` - Date sent
- `sent_time` - Time sent
- `security_notice` - HIPAA notice
- `attachment` - Base64 PDF attachment
- `file_count` - Number of file attachments
- `file_list` - List of attached file names
- `attachments_note` - Note about attachments

## Attachment Configuration

In EmailJS dashboard:

1. Enable attachments for your template
2. Add attachment field: `{{attachment}}`
3. Set attachment name: `health-records-{{sent_date}}.pdf`
4. Set MIME type: `application/pdf`

## Important Notes

### Size Limitations
- EmailJS Free: 50KB per attachment
- EmailJS Paid: 10MB per attachment
- Multiple attachments supported on paid plans

### For Large Files
If files exceed email limits, consider:
1. Using a secure file sharing service (Dropbox, Google Drive)
2. Implementing a temporary download link system
3. Compressing images before attachment

### Security Considerations
- Never send passwords in emails
- Use HTTPS links only
- Consider encryption for sensitive data
- Add expiration to shared links

## Testing Your Template

1. Create a test template in EmailJS
2. Use test data to verify formatting
3. Check attachment delivery
4. Test reply-to functionality
5. Verify on multiple email clients

## Alternative: Using SendGrid

For production with larger attachments:

```javascript
// SendGrid configuration
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: recipientEmail,
  from: 'noreply@revadohealth.com',
  replyTo: patientEmail,
  subject: `Health Records from ${patientName}`,
  html: emailHTML,
  attachments: [
    {
      content: pdfBase64,
      filename: 'health-records.pdf',
      type: 'application/pdf',
      disposition: 'attachment'
    },
    // Additional file attachments
    ...fileAttachments.map(file => ({
      content: file.base64,
      filename: file.name,
      type: file.type,
      disposition: 'attachment'
    }))
  ]
};

await sgMail.send(msg);
```

## Fallback for No Email Service

When EmailJS is not configured:
1. PDF is downloaded locally
2. mailto: link opens with pre-filled content
3. User manually attaches the downloaded PDF
4. Instructions shown to user