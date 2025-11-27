# Uchaguzi MFA - Production Deployment Guide

## 🚀 Quick Start

This guide covers the production deployment of Uchaguzi MFA, a secure AI-powered multi-factor authentication voting platform.

## ✅ What's Been Implemented

### Database & Performance
- ✅ 15+ performance indexes created (GIN indexes for JSONB fields)
- ✅ Composite indexes for common queries
- ✅ All SECURITY DEFINER functions have proper search_path
- ✅ Enhanced error handling in all database functions
- ✅ Constraints for vote integrity and email validation

### Security
- ✅ Global ErrorBoundary for graceful error handling
- ✅ Comprehensive input validation with Zod
- ✅ Rate limiting on edge functions
- ✅ Error sanitization to prevent information leakage
- ✅ CSRF protection utilities
- ✅ Security utilities for production
- ✅ RLS policies on all tables

### Monitoring & Logging
- ✅ Production monitoring utilities
- ✅ Performance tracking
- ✅ Error capture and reporting
- ✅ User action tracking
- ✅ Ready for Sentry integration

### Configuration
- ✅ Production environment configuration
- ✅ Vercel deployment configuration with security headers
- ✅ GitHub Actions workflow for CI/CD
- ✅ Security headers (X-Frame-Options, CSP, etc.)

## ⚠️ Critical Manual Steps Required

### 1. Enable Leaked Password Protection (REQUIRED)

**⚠️ SECURITY WARNING**: This MUST be configured before production launch.

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Password Protection**
3. Enable **"I have been pwned"** integration
4. Set minimum password requirements:
   - Minimum length: 8 characters
   - Password strength: Medium or higher

📚 Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 2. Configure Environment Variables

Create production environment variables in your hosting platform:

```bash
# Supabase
VITE_SUPABASE_URL=https://neaegcjppvnvbghgervx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-production-key>
VITE_SUPABASE_PROJECT_ID=neaegcjppvnvbghgervx

# Application
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://your-domain.com

# Optional but recommended
VITE_SENTRY_DSN=<your-sentry-dsn>
VITE_GA_TRACKING_ID=<your-analytics-id>
```

### 3. Database Backup

Before deploying to production:

```bash
# Enable point-in-time recovery in Supabase Dashboard
# Settings → Database → Enable Point in Time Recovery
```

### 4. Set Up Error Tracking

Configure Sentry or similar service:

1. Create account at https://sentry.io
2. Get your DSN
3. Add to environment variables
4. Uncomment Sentry integration in `src/lib/monitoring.ts`

### 5. Set Up Monitoring

Configure uptime monitoring:
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://www.pingdom.com)
- Or Vercel's built-in monitoring

## 📋 Deployment Checklist

Use `PRODUCTION_CHECKLIST.md` for the complete pre-deployment checklist.

### Quick Pre-Flight Check

```bash
# 1. Run type check
npm run type-check || npx tsc --noEmit

# 2. Build for production
npm run build

# 3. Test production build locally
npm run preview

# 4. Deploy database migrations
supabase db push --project-ref neaegcjppvnvbghgervx

# 5. Deploy edge functions
supabase functions deploy --project-ref neaegcjppvnvbghgervx

# 6. Deploy to Vercel
vercel --prod
```

## 🔐 Security Reminders

1. **Never commit secrets** to version control
2. **Enable MFA** for all admin accounts
3. **Review RLS policies** before launch
4. **Test with production-like data** in staging first
5. **Enable leaked password protection** (see above)
6. **Rotate secrets** after deployment

## 📊 Monitoring After Deployment

### Key Metrics to Watch

**First Hour:**
- Error rate should be <0.1%
- Response time should be <2s
- Check Supabase edge function logs

**First Day:**
- Monitor authentication flows
- Check vote submission success rate
- Review audit logs

**First Week:**
- Performance trends
- Storage usage
- Database query performance

## 🐛 Debugging

### View Recent Errors

```javascript
// In browser console
const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
console.table(errors);
```

### Check Performance Report

```javascript
// In browser console
import { monitoring } from '@/lib/monitoring';
console.log(monitoring.getPerformanceReport());
```

## 🔄 Rollback Procedure

If critical issues are detected:

```bash
# 1. Rollback Vercel deployment
vercel rollback

# 2. Check logs
vercel logs <deployment-url>

# 3. Rollback database if needed
# (Use Supabase Dashboard → Database → Backups)
```

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: [Your repo]/issues
- **Security Issues**: security@your-domain.com (set up dedicated email)

## 🎯 Performance Targets

- **Page Load**: <2s (95th percentile)
- **API Response**: <500ms (95th percentile)
- **Uptime**: >99.9%
- **Error Rate**: <0.1%

## ✨ Post-Deployment

After successful deployment:

1. ✅ Run smoke tests (see PRODUCTION_CHECKLIST.md)
2. ✅ Verify all critical paths work
3. ✅ Test with multiple user roles
4. ✅ Monitor for 24 hours
5. ✅ Document any issues encountered
6. ✅ Update team on deployment status

## 🚨 Emergency Contacts

Set up and document your emergency contacts:

- Technical Lead: [Name] - [Email] - [Phone]
- DevOps: [Name] - [Email] - [Phone]
- Security: [Name] - [Email] - [Phone]

---

**Last Updated**: 2025-01-24
**Version**: 1.0.0
**Status**: Production Ready (pending manual security configuration)
