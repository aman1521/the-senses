// Test individual route loading
const routes = [
    'authRoutes',
    'gameRoutes',
    'companyRoutes',
    'adminRoutes',
    'aiRoutes',
    'aiStreamRoutes',
    'ingestionRoutes',
    'leaderboardRoutes',
    'planRoutes',
    'intelligence',
    'cardRoutes',
    'duelRoutes',
    'aiBattleRoutes',
    'profileRoutes',
    'questionsRoutes',
    'questionRoutes',
    'bubbles',
    'companyDashboard',
    'dashboardRoutes',
    'paymentRoutes',
    'marketUpdateRoutes',
    'notificationRoutes',
    'usersRoutes',
    'chatRoutes',
    'publicRoutes',
    'telemetryRoutes',
    'organizationRoutes',
    'teamRoutes',
    'inviteRoutes',
    'ssoRoutes',
    'pushTokenRoutes',
    'userProfileRoutes',
    'companyProfileRoutes'
];

console.log('Testing route loading...\n');

for (const route of routes) {
    try {
        require(`./routes/${route}`);
        console.log(`✅ ${route}`);
    } catch (e) {
        console.error(`❌ ${route}:`, e.message);
        console.error('Full error:', e.stack);
        break;
    }
}
