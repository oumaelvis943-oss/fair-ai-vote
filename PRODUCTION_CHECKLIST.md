# Uchaguzi MFA Production Deployment Checklist

## Pre-Deployment

### Database
- [x] All migrations applied and tested
- [x] Performance indexes created (GIN on JSONB fields)
- [x] RLS policies verified and strengthened
- [x] Functions have SET search_path = public
- [ ] Backup strategy configured (Supabase point-in-time recovery)
- [ ] Database plan upgraded to production tier

### Security
- [x] Rate limiting implemented
- [x] Input validation with Zod schemas
- [x] Error sanitization in place
- [x] CSRF protection configured
- [x] Security headers defined
- [ ] SSL/TLS certificates configured
- [ ] Environment secrets rotated
- [ ] Admin accounts secured with MFA

### Code Quality
- [x] Global ErrorBoundary implemented
- [x] Monitoring utilities added
- [x] Production environment config created
- [ ] All console.logs reviewed (remove sensitive data)
- [ ] Type checking passes
- [ ] No hardcoded credentials

### Performance
- [x] Database indexes optimized
- [x] Query performance tested
- [ ] Load testing completed (1000+ concurrent users)
- [ ] CDN configured for assets
- [ ] Image optimization implemented

### Testing
- [ ] End-to-end tests for critical paths
  - [ ] Admin: Create election → Upload voters → Approve candidates → Calculate results
  - [ ] Voter: Check eligibility → Cast vote → Verify receipt
  - [ ] Candidate: Apply → Submit forms → View evaluation
- [ ] Security penetration testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit (WCAG 2.1 AA)

### Monitoring & Logging
- [x] Error tracking configured (ready for Sentry)
- [x] Performance monitoring implemented
- [ ] Uptime monitoring configured
- [ ] Alert system for critical errors
- [ ] Analytics tracking (Google Analytics/Plausible)
- [ ] Log aggregation (if using separate service)

### Documentation
- [ ] User guides for each role (Admin, Voter, Candidate)
- [ ] API documentation for edge functions
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Incident response plan

## Deployment Steps

### 1. Staging Environment Test
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Verify all features work end-to-end
- [ ] Test with production-like data volume
- [ ] Security scan with OWASP ZAP

### 2. Pre-Production
- [ ] Database backup created
- [ ] Rollback plan confirmed
- [ ] Team notified of deployment window
- [ ] Maintenance page ready (if needed)

### 3. Production Deployment
```bash
# 1. Deploy database migrations
supabase db push --project-ref neaegcjppvnvbghgervx

# 2. Deploy edge functions
supabase functions deploy --project-ref neaegcjppvnvbghgervx

# 3. Build frontend
npm run build

# 4. Deploy to Vercel (or hosting provider)
vercel --prod

# 5. Verify deployment
curl https://your-production-domain.com/health
```

### 4. Post-Deployment Verification
- [ ] Homepage loads correctly
- [ ] Authentication works (Google OAuth)
- [ ] Admin dashboard accessible
- [ ] Create test election
- [ ] Upload test voters
- [ ] Cast test vote
- [ ] Calculate test results
- [ ] Check error tracking dashboard
- [ ] Verify monitoring metrics

### 5. Smoke Tests (Production)
- [ ] Login as admin
- [ ] Login as voter
- [ ] Submit a vote
- [ ] View results
- [ ] Check audit logs
- [ ] Verify email notifications (if configured)

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Monitor error rates (target: <0.1%)
- [ ] Check response times (target: <2s for most pages)
- [ ] Verify database performance
- [ ] Monitor edge function invocations
- [ ] Check storage usage

### Ongoing Maintenance
- [ ] Daily health checks
- [ ] Weekly security scans
- [ ] Monthly performance reviews
- [ ] Quarterly disaster recovery drills

## Environment Variables

### Required for Production
```bash
# Supabase
VITE_SUPABASE_URL=https://neaegcjppvnvbghgervx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=neaegcjppvnvbghgervx

# Application
VITE_APP_VERSION=1.0.0
VITE_APP_NAME="Uchaguzi MFA"
VITE_APP_URL=https://your-production-domain.com

# Error Tracking (Optional but recommended)
VITE_SENTRY_DSN=<your-sentry-dsn>

# Analytics (Optional)
VITE_GA_TRACKING_ID=<your-ga-id>
```

### Supabase Secrets (Set in Dashboard)
- `GOOGLE_API_KEY` - For AI features
- `SMTP_*` - For email notifications
- Any other third-party API keys

## Rollback Procedure

If critical issues are detected:

1. **Immediate Actions**
   ```bash
   # Revert to previous Vercel deployment
   vercel rollback
   
   # Or revert database migration
   supabase db reset --project-ref neaegcjppvnvbghgervx
   ```

2. **Investigate**
   - Check error logs
   - Review recent changes
   - Identify root cause

3. **Fix and Redeploy**
   - Apply fix in development
   - Test in staging
   - Redeploy to production

## Success Criteria

### Performance
- Page load time: <2 seconds (95th percentile)
- API response time: <500ms (95th percentile)
- Uptime: >99.9%

### Security
- Zero critical vulnerabilities
- All data encrypted in transit and at rest
- RLS policies prevent unauthorized access
- Rate limiting prevents abuse

### User Experience
- Error rate: <0.1%
- No data loss incidents
- All critical user flows working
- Mobile-responsive on all devices

## Emergency Contacts

- **Technical Lead**: [Name] - [Email] - [Phone]
- **DevOps**: [Name] - [Email] - [Phone]
- **Security**: [Name] - [Email] - [Phone]
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com

## Notes

- This checklist should be updated after each deployment
- Document any issues encountered and resolutions
- Keep track of deployment times and downtime (if any)
- Regular drills for rollback procedures

---

**Last Updated**: 2025-01-24
**Next Review**: Before production deployment
