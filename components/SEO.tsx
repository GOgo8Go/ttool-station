import React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  toolId?: string;
  categoryId?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  toolId,
  categoryId
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  // Default values
  const defaultTitle = '简简单单的前端小工具';
  const defaultDescription = '一个模块化、可扩展的实用工具站，提供开发者工具和生产力工具的分类集合。在线JSON格式化、二维码生成器、密码强度检测等40+个实用工具。';

  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const pageDescription = description || defaultDescription;

  // Construct URL
  const baseUrl = 'https://www.zinc233.top/';
  const pageUrl = toolId && categoryId
    ? `${baseUrl}#/tools/${categoryId}/${toolId}`
    : baseUrl;

  // Combine keywords
  const allKeywords = [
    '前端工具',
    '开发者工具',
    '在线工具',
    ...keywords
  ];

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update title
    document.title = pageTitle;
    
    // Update description meta
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta') as HTMLMetaElement;
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDescription);
    
    // Update keywords meta
    let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (allKeywords.length > 0) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta') as HTMLMetaElement;
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', allKeywords.join(', '));
    } else if (metaKeywords) {
      metaKeywords.remove();
    }
    
    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link') as HTMLLinkElement;
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', pageUrl);
    
    // Update Open Graph tags
    updateMetaProperty('og:title', pageTitle);
    updateMetaProperty('og:description', pageDescription);
    updateMetaProperty('og:url', pageUrl);
    updateMetaProperty('og:type', 'website');
    
    // Update Twitter tags
    updateMetaProperty('twitter:title', pageTitle);
    updateMetaProperty('twitter:description', pageDescription);
    updateMetaProperty('twitter:card', 'summary_large_image');
    
    // Cleanup function to reset some values if needed
    return () => {
      document.title = defaultTitle;
    };
  }, [pageTitle, pageDescription, allKeywords, pageUrl, lang]);
  
  // Helper function to update or create meta tags with property attribute
  const updateMetaProperty = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta') as HTMLMetaElement;
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  return null; // This component doesn't render anything
};