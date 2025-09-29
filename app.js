const path = require('path');
require('dotenv').config({ override: true });
const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./src/routes');
const homeRoutes = require('./src/routes/home');
const { getAdminBase, getSettings } = require('./src/services/settingsService');
const { customRoutesMiddleware } = require('./src/middleware/customRoutes');

const app = express();

app.set('views', path.join(process.cwd(), 'src', 'views'));
app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(customRoutesMiddleware);

// Redirect root to dashboard if configured
const settings = getSettings();
if (settings.redirectRoot) {
  app.get('/', (req, res) => {
    const base = '/' + getAdminBase();
    return res.redirect(base + '/dashboard');
  });
} else {
  app.use('/', routes);
}
const adminBase = '/' + getAdminBase();
app.use(adminBase, homeRoutes);

// 404 handler
app.use((req, res) => {
  try {
    const { appendLog } = require('./src/services/logService');
    const ignorePath = '/.well-known/appspecific/com.chrome.devtools.json';
    if (req.path !== ignorePath) {
      appendLog({ method: req.method, path: req.path, matcher: 'n/a', routePath: 'n/a', ip: req.ip, headers: req.headers, notFound: true });
    }
  } catch {}
  res.status(404).type('text/plain').send('Not found');
});

module.exports = app;


