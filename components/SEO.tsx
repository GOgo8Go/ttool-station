import React from 'react';
import { Helmet } from 'react-helmet-async';
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

    return (
        <Helmet>
            <html lang={lang} />
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            {allKeywords.length > 0 && (
                <meta name="keywords" content={allKeywords.join(', ')} />
            )}
            <link rel="canonical" href={pageUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:type" content="website" />

            {/* Twitter */}
            <meta property="twitter:title" content={pageTitle} />
            <meta property="twitter:description" content={pageDescription} />
            <meta property="twitter:card" content="summary_large_image" />
        </Helmet>
    );
};
