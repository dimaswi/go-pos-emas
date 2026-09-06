/**
 * Utility function to set page title dynamically
 * @param pageTitle - The title of the current page
 */
export const setPageTitle = (pageTitle: string) => {
  const appName = localStorage.getItem('appName') || 'Starter Kits';
  document.title = `${pageTitle} - ${appName}`;
};

/**
 * Get application name from localStorage
 */
export const getAppName = () => {
  return localStorage.getItem('appName') || 'Starter Kits';
};

/**
 * Get application subtitle from localStorage
 */
export const getAppSubtitle = () => {
  return localStorage.getItem('appSubtitle') || 'Your Application Subtitle';
};

/**
 * Helper to get full media URL
 */
export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const apiUrl = (import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8088/api')).replace(/\/api$/, '');
  
  // Ensure there's a slash between apiUrl and path
  if (apiUrl && !path.startsWith('/')) {
    return `${apiUrl}/${path}`;
  }
  return `${apiUrl}${path}`;
};

/**
 * Utility function to set app favicon dynamically
 */
export const setAppFavicon = () => {
  const favicon = localStorage.getItem('appFavicon');
  if (favicon) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = getMediaUrl(favicon);
  }
};
