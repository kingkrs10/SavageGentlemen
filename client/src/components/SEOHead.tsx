import React from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  ogImage?: string;
  canonicalUrl?: string;
  ogType?: string;
  twitterCard?: string;
}

const SEOHead = ({
  title,
  description,
  ogImage = '/assets/sgx-logo-share.png',
  canonicalUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image'
}: SEOHeadProps) => {
  // Get the current URL
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const siteTitle = 'Savage Gentlemen Lifestyle | SGX Media';
  const fullTitle = `${title} | ${siteTitle}`;
  
  React.useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update meta tags
    const metaTags = [
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: canonicalUrl || url },
      { property: 'og:type', content: ogType },
      { name: 'twitter:card', content: twitterCard },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage }
    ];
    
    // Update existing meta tags or create new ones
    metaTags.forEach(({ name, property, content }) => {
      // Look for existing meta tag by name or property
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      const existingTag = document.querySelector(selector) as HTMLMetaElement;
      
      if (existingTag) {
        // Update existing tag
        existingTag.content = content;
      } else {
        // Create new tag
        const newTag = document.createElement('meta');
        if (name) newTag.setAttribute('name', name);
        if (property) newTag.setAttribute('property', property);
        newTag.setAttribute('content', content);
        document.head.appendChild(newTag);
      }
    });
    
    // Add canonical link if provided
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      
      if (canonicalLink) {
        canonicalLink.href = canonicalUrl;
      } else {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        canonicalLink.href = canonicalUrl;
        document.head.appendChild(canonicalLink);
      }
    }
    
    // Cleanup function
    return () => {
      // Optionally remove the created tags when the component unmounts
      // This isn't always necessary, especially for single page applications
    };
  }, [fullTitle, description, ogImage, canonicalUrl, ogType, twitterCard, url]);
  
  // This component doesn't render anything visible
  return null;
};

export default SEOHead;