function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return token;
}

// Automatically check auth on include unless page is index.html
if (window.location.pathname.indexOf('index.html') === -1 && window.location.pathname !== '/' && window.location.pathname !== '/pasabaybcd/') {
  checkAuth();
}
