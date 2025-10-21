// Favicon handler - returns a simple redirect to Gistvox favicon
export default function handler(req, res) {
  // Redirect to Gistvox's favicon
  res.redirect(301, 'https://gistvox.com/favicon.ico');
}
