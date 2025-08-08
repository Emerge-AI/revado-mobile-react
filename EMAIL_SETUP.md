# Email Setup Guide for Share with Dentist Feature

## Overview
The "Share with Dentist" feature now supports actual email sending with PDF attachments. It has two modes:
1. **EmailJS Mode** - Sends emails directly from the browser (recommended)
2. **Mailto Fallback** - Downloads PDF and opens email client (when EmailJS not configured)

## Quick Setup (5 minutes)

### Step 1: Sign up for EmailJS (Free)
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month free)
3. Verify your email address

### Step 2: Create an Email Service
1. In EmailJS Dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the connection instructions
5. Save your **Service ID** (looks like: `service_xxxxxxx`)

### Step 3: Create an Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Set up your template:

**Subject Line:**
```
Health Records from {{from_name}} - Secure Transmission
```

**Email Body:**
```html
<p>Dear {{to_name}},</p>

<p><strong>{{from_name}}</strong> ({{from_email}}) has shared their health records with you.</p>

<h3>Summary:</h3>
<ul>
  <li>Number of Records: {{record_count}}</li>
  <li>Date Range: {{date_range}}</li>
</ul>

<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
  <pre>{{summary}}</pre>
</div>

<p style="color: #666; font-size: 12px;">
  <strong>Security Notice:</strong> This email contains protected health information. 
  Please handle with appropriate security measures.
</p>

<hr>

<p style="color: #999; font-size: 11px;">
  Sent via Revado Health App on {{sent_date}} at {{sent_time}}
</p>
```

4. Save your **Template ID** (looks like: `template_xxxxxxx`)

### Step 4: Get Your Public Key
1. Go to "Account" > "API Keys"
2. Copy your **Public Key**

### Step 5: Configure the App
1. Create a `.env` file in the project root:
```bash
cp .env.emailjs.example .env
```

2. Add your EmailJS credentials:
```env
VITE_EMAILJS_SERVICE_ID=service_your_id_here
VITE_EMAILJS_TEMPLATE_ID=template_your_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. Restart the development server:
```bash
npm run dev
```

## Testing the Feature

1. **Upload some test records** in the Upload page
2. **Go to Share page**
3. **Enter an email address**
4. **Click "Send Records"**
5. **Check the recipient's email**

## Features

### ✅ What Gets Sent:
- Professional PDF summary with patient info
- AI-generated health summary
- List of all shared records
- Security notices
- Timestamp and metadata

### 📧 Email Capabilities:
- Direct browser-to-email sending (no backend needed)
- PDF attachment support
- Professional email template
- Fallback to email client if EmailJS not configured

### 🔒 Security:
- No PHI stored on external servers
- Email sent directly from browser
- PDF generated locally
- Optional: Can add password protection to PDFs

## Troubleshooting

### EmailJS Not Working?
1. Check console for errors
2. Verify all three credentials are correct
3. Check EmailJS dashboard for quota/errors
4. Make sure email service is connected properly

### PDF Not Generating?
1. Check browser console for errors
2. Ensure records have been uploaded first
3. Try with fewer records if many are selected

### Fallback Mode Active?
- This means EmailJS is not configured
- The app will download a PDF and open your email client
- You'll need to manually attach the PDF

## Production Considerations

### For Production Use:
1. **Upgrade EmailJS Plan** for more emails/month
2. **Add email validation** on backend
3. **Implement rate limiting**
4. **Add audit logging**
5. **Consider HIPAA compliance** requirements
6. **Add encryption** for sensitive data

### Alternative Solutions:
- **SendGrid** - More robust, requires backend
- **AWS SES** - Cost-effective for high volume
- **Custom SMTP** - Full control, more complex

## Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify EmailJS dashboard shows sent emails
3. Test with the fallback mode (remove .env temporarily)
4. Check that all dependencies are installed: `npm install`

## Summary

The share feature now provides:
- ✅ Real email sending
- ✅ Professional PDF generation
- ✅ Progress tracking
- ✅ Error handling
- ✅ Fallback support
- ✅ Mobile-optimized UI

Total setup time: ~5 minutes